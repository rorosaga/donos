from __future__ import annotations

import asyncio
from decimal import Decimal

from app.config import Settings
from app.models import (
    DonationProcessingState,
    DonationRecord,
    IssuedAsset,
    NGOProfile,
    NGOOperationalDiagnostics,
    TreasuryPayment,
    WalletSecrets,
    XRPLAccountStatus,
    compute_dono_amount,
)
from app.repositories import DonationRepository, NGORepository
from app.services.donation_processor import DonationProcessor
from app.services.operations import NGOOperationsService
from app.services.xrpl.client import XRPLService


class FakeXRPLService(XRPLService):
    def __init__(self) -> None:
        self.payments: dict[str, list[TreasuryPayment]] = {}
        self.trustlines: set[tuple[str, str, str]] = set()
        self.account_statuses: dict[str, XRPLAccountStatus] = {}
        self.seed_matches: dict[tuple[str, str], bool] = {}
        self.issue_failures_remaining = 0
        self.distribution_failures_remaining = 0
        self.issue_calls = 0
        self.distribution_calls = 0

    async def get_validated_treasury_payments(self, treasury_address: str) -> list[TreasuryPayment]:
        return list(self.payments.get(treasury_address, []))

    async def get_network_status(self) -> dict[str, str]:
        return {
            "server_state": "full",
            "complete_ledgers": "1-100",
            "validated_ledger_seq": "100",
        }

    async def get_account_status(self, *, wallet_address: str) -> XRPLAccountStatus:
        return self.account_statuses.get(
            wallet_address,
            XRPLAccountStatus(
                address=wallet_address,
                exists=False,
                balance_drops=None,
                owner_count=None,
                previous_txn_id=None,
                sequence=None,
            ),
        )

    def seed_matches_address(self, *, wallet_seed: str, wallet_address: str) -> bool:
        return self.seed_matches.get((wallet_seed, wallet_address), True)

    async def has_trustline(
        self,
        *,
        wallet_address: str,
        issuer_address: str,
        currency_code: str,
    ) -> bool:
        return (wallet_address, issuer_address, currency_code) in self.trustlines

    async def prepare_trustline(
        self,
        *,
        wallet_address: str,
        issuer_address: str,
        currency_code: str,
        limit_value: str,
    ) -> dict[str, object]:
        return {
            "TransactionType": "TrustSet",
            "Account": wallet_address,
            "LimitAmount": {
                "currency": currency_code,
                "issuer": issuer_address,
                "value": limit_value,
            },
        }

    async def issue_to_distributor(
        self,
        *,
        issuer_seed: str,
        distributor_address: str,
        issued_asset: IssuedAsset,
        amount: int,
    ) -> str:
        self.issue_calls += 1
        if self.issue_failures_remaining > 0:
            self.issue_failures_remaining -= 1
            raise RuntimeError("issuance failed")
        return f"issue-{self.issue_calls}"

    async def distribute_to_donor(
        self,
        *,
        distributor_seed: str,
        donor_wallet_address: str,
        issued_asset: IssuedAsset,
        amount: int,
    ) -> str:
        self.distribution_calls += 1
        if self.distribution_failures_remaining > 0:
            self.distribution_failures_remaining -= 1
            raise RuntimeError("distribution failed")
        return f"distribute-{self.distribution_calls}"


def build_settings() -> Settings:
    return Settings(
        xrpl_network_url="https://example.test",
        xrpl_poll_interval_seconds=30,
        xrpl_account_tx_limit=20,
        rlusd_currency_code="RLUSD",
        rlusd_issuer="rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
        ngo_profiles=[],
    )


def build_processor(fake_xrpl: FakeXRPLService) -> tuple[DonationProcessor, DonationRepository]:
    ngo = NGOProfile(
        ngo_id="wateraid",
        name="WaterAid",
        treasury_address="rTreasury",
        issuer_address="rIssuer",
        distributor_address="rDistributor",
        dono_rate=Decimal("2.5"),
    )
    ngo_repository = NGORepository(
        [ngo],
        {
            "wateraid": WalletSecrets(
                treasury_seed="sTreasury",
                issuer_seed="sIssuer",
                distributor_seed="sDistributor",
            )
        },
    )
    donation_repository = DonationRepository()
    processor = DonationProcessor(
        settings=build_settings(),
        donation_repository=donation_repository,
        ngo_repository=ngo_repository,
        xrpl_service=fake_xrpl,
    )
    return processor, donation_repository


def build_payment(
    *,
    tx_hash: str = "tx-1",
    amount: str = "10",
    currency_code: str = "RLUSD",
    issuer_address: str = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
) -> TreasuryPayment:
    return TreasuryPayment(
        payment_reference=tx_hash,
        tx_hash=tx_hash,
        ledger_index=123,
        destination="rTreasury",
        source_address="rDonor",
        amount=Decimal(amount),
        currency_code=currency_code,
        issuer_address=issuer_address,
        validated=True,
    )


def test_compute_dono_amount_uses_floor() -> None:
    assert compute_dono_amount(Decimal("1.99"), Decimal("2.5")) == 4


def test_scan_records_pending_trustline_when_missing() -> None:
    fake_xrpl = FakeXRPLService()
    fake_xrpl.payments["rTreasury"] = [build_payment(amount="3")]
    processor, donation_repository = build_processor(fake_xrpl)

    processed = asyncio.run(processor.scan_ngo("wateraid"))

    assert len(processed) == 1
    donation = donation_repository.get_by_payment_reference("tx-1")
    assert donation is not None
    assert donation.state == DonationProcessingState.PENDING_TRUSTLINE
    assert donation.dono_amount == 7


def test_duplicate_payment_is_idempotent() -> None:
    fake_xrpl = FakeXRPLService()
    fake_xrpl.payments["rTreasury"] = [build_payment()]
    processor, donation_repository = build_processor(fake_xrpl)

    asyncio.run(processor.scan_ngo("wateraid"))
    asyncio.run(processor.scan_ngo("wateraid"))

    donations = donation_repository.list()
    assert len(donations) == 1


def test_pending_donation_resumes_after_trustline() -> None:
    fake_xrpl = FakeXRPLService()
    fake_xrpl.payments["rTreasury"] = [build_payment(amount="2")]
    processor, donation_repository = build_processor(fake_xrpl)

    asyncio.run(processor.scan_ngo("wateraid"))
    donation = donation_repository.get_by_payment_reference("tx-1")
    assert donation is not None
    assert donation.state == DonationProcessingState.PENDING_TRUSTLINE

    fake_xrpl.trustlines.add(("rDonor", "rIssuer", "DONO"))
    updated = asyncio.run(processor.process_donation(donation.donation_id))

    assert updated.state == DonationProcessingState.SENT_TO_DONOR
    assert updated.issuance_tx_hash == "issue-1"
    assert updated.distribution_tx_hash == "distribute-1"


def test_non_rlusd_payment_is_ignored() -> None:
    fake_xrpl = FakeXRPLService()
    fake_xrpl.payments["rTreasury"] = [build_payment(currency_code="USD")]
    processor, donation_repository = build_processor(fake_xrpl)

    processed = asyncio.run(processor.scan_ngo("wateraid"))

    assert processed == []
    assert donation_repository.list() == []


def test_zero_issuance_is_terminal() -> None:
    fake_xrpl = FakeXRPLService()
    fake_xrpl.payments["rTreasury"] = [build_payment(amount="0.1")]
    processor, donation_repository = build_processor(fake_xrpl)

    asyncio.run(processor.scan_ngo("wateraid"))

    donation = donation_repository.get_by_payment_reference("tx-1")
    assert donation is not None
    assert donation.state == DonationProcessingState.COMPLETED_ZERO_ISSUANCE
    assert donation.issuance_tx_hash is None
    assert fake_xrpl.issue_calls == 0


def test_distribution_retry_does_not_reissue() -> None:
    fake_xrpl = FakeXRPLService()
    fake_xrpl.payments["rTreasury"] = [build_payment(amount="2")]
    fake_xrpl.trustlines.add(("rDonor", "rIssuer", "DONO"))
    fake_xrpl.distribution_failures_remaining = 1
    processor, donation_repository = build_processor(fake_xrpl)

    asyncio.run(processor.scan_ngo("wateraid"))
    donation = donation_repository.get_by_payment_reference("tx-1")
    assert donation is not None
    assert donation.state == DonationProcessingState.FAILED
    assert donation.issuance_tx_hash == "issue-1"
    assert donation.distribution_tx_hash is None

    retried = asyncio.run(processor.process_donation(donation.donation_id))

    assert retried.state == DonationProcessingState.SENT_TO_DONOR
    assert retried.issuance_tx_hash == "issue-1"
    assert retried.distribution_tx_hash == "distribute-2"
    assert fake_xrpl.issue_calls == 1


def test_operations_service_builds_diagnostics() -> None:
    fake_xrpl = FakeXRPLService()
    fake_xrpl.account_statuses = {
        "rTreasury": XRPLAccountStatus(
            address="rTreasury",
            exists=True,
            balance_drops="1000",
            owner_count=0,
            previous_txn_id="tx-a",
            sequence=1,
        ),
        "rIssuer": XRPLAccountStatus(
            address="rIssuer",
            exists=True,
            balance_drops="2000",
            owner_count=1,
            previous_txn_id="tx-b",
            sequence=2,
        ),
        "rDistributor": XRPLAccountStatus(
            address="rDistributor",
            exists=True,
            balance_drops="3000",
            owner_count=2,
            previous_txn_id="tx-c",
            sequence=3,
        ),
    }
    fake_xrpl.trustlines.add(("rDistributor", "rIssuer", "DONO"))
    fake_xrpl.trustlines.add(("rDistributor", "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe", "RLUSD"))
    processor, _ = build_processor(fake_xrpl)
    operations = NGOOperationsService(
        settings=build_settings(),
        ngo_repository=processor._ngo_repository,
        xrpl_service=fake_xrpl,
    )

    diagnostics = asyncio.run(operations.get_ngo_diagnostics("wateraid"))

    assert isinstance(diagnostics, NGOOperationalDiagnostics)
    assert diagnostics.issuer_distributor_trustline_ready is True
    assert diagnostics.distributor_rlusd_trustline_ready is True


def test_operations_service_builds_verification_guide() -> None:
    fake_xrpl = FakeXRPLService()
    processor, _ = build_processor(fake_xrpl)
    operations = NGOOperationsService(
        settings=build_settings(),
        ngo_repository=processor._ngo_repository,
        xrpl_service=fake_xrpl,
    )

    guide = asyncio.run(
        operations.build_verification_guide(
            ngo_id="wateraid",
            donor_wallet_address="rDonor",
            rlusd_amount=Decimal("1.9"),
        )
    )

    assert guide["expected_dono_amount"] == 4
    assert guide["trustline_transaction"]["TransactionType"] == "TrustSet"
