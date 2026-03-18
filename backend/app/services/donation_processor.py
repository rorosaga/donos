from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from app.config import Settings
from app.models import (
    DonationProcessingState,
    DonationRecord,
    IssuedAsset,
    NGOProfile,
    TreasuryPayment,
    compute_dono_amount,
)
from app.models.domain import xrpl_currency_code
from app.repositories import DonationRepository, NGORepository
from app.services.xrpl.client import XRPLService


class DonationProcessor:
    def __init__(
        self,
        *,
        settings: Settings,
        donation_repository: DonationRepository,
        ngo_repository: NGORepository,
        xrpl_service: XRPLService,
    ) -> None:
        self._settings = settings
        self._donation_repository = donation_repository
        self._ngo_repository = ngo_repository
        self._xrpl_service = xrpl_service

    async def scan_all_ngos(self) -> list[DonationRecord]:
        processed: list[DonationRecord] = []
        for ngo in self._ngo_repository.list():
            processed.extend(await self.scan_ngo(ngo.ngo_id))
        return processed

    async def scan_ngo(self, ngo_id: str) -> list[DonationRecord]:
        ngo = self._require_ngo(ngo_id)
        payments = await self._xrpl_service.get_validated_treasury_payments(ngo.treasury_address)
        touched: list[DonationRecord] = []
        for payment in payments:
            donation = await self._record_payment_if_eligible(ngo, payment)
            if donation is None:
                continue
            touched.append(await self.process_donation(donation.donation_id))
        return touched

    async def process_donation(self, donation_id: str) -> DonationRecord:
        donation = self._require_donation(donation_id)
        ngo = self._require_ngo(donation.ngo_id)

        if donation.dono_amount == 0:
            donation.state = DonationProcessingState.COMPLETED_ZERO_ISSUANCE
            donation.failure_reason = None
            donation.mark_updated()
            return self._donation_repository.upsert(donation)

        trustline_exists = await self._xrpl_service.has_trustline(
            wallet_address=donation.donor_wallet_address,
            issuer_address=ngo.issuer_address,
            currency_code="DONO",
        )
        if not trustline_exists:
            donation.state = DonationProcessingState.PENDING_TRUSTLINE
            donation.failure_reason = None
            donation.mark_updated()
            return self._donation_repository.upsert(donation)

        if donation.state in {
            DonationProcessingState.DETECTED,
            DonationProcessingState.PENDING_TRUSTLINE,
            DonationProcessingState.READY_TO_ISSUE,
            DonationProcessingState.FAILED,
        }:
            donation.state = DonationProcessingState.READY_TO_ISSUE
            donation.failure_reason = None
            donation.mark_updated()
            self._donation_repository.upsert(donation)

        secrets = self._ngo_repository.get_wallet_secrets(ngo.ngo_id)
        if secrets is None:
            raise ValueError(f"Missing wallet secrets for NGO {ngo.ngo_id!r}.")

        issued_asset = IssuedAsset(currency_code="DONO", issuer_address=ngo.issuer_address)

        if donation.issuance_tx_hash is None:
            try:
                donation.issuance_tx_hash = await self._xrpl_service.issue_to_distributor(
                    issuer_seed=secrets.issuer_seed,
                    distributor_address=ngo.distributor_address,
                    issued_asset=issued_asset,
                    amount=donation.dono_amount,
                )
                donation.state = DonationProcessingState.ISSUED_TO_DISTRIBUTOR
                donation.failure_reason = None
                donation.mark_updated()
                self._donation_repository.upsert(donation)
            except Exception as exc:
                donation.state = DonationProcessingState.FAILED
                donation.failure_reason = str(exc)
                donation.mark_updated()
                return self._donation_repository.upsert(donation)

        if donation.distribution_tx_hash is None:
            try:
                donation.distribution_tx_hash = await self._xrpl_service.distribute_to_donor(
                    distributor_seed=secrets.distributor_seed,
                    donor_wallet_address=donation.donor_wallet_address,
                    issued_asset=issued_asset,
                    amount=donation.dono_amount,
                )
                donation.state = DonationProcessingState.SENT_TO_DONOR
                donation.failure_reason = None
            except Exception as exc:
                donation.state = DonationProcessingState.FAILED
                donation.failure_reason = str(exc)

            donation.mark_updated()
            return self._donation_repository.upsert(donation)

        donation.state = DonationProcessingState.SENT_TO_DONOR
        donation.failure_reason = None
        donation.mark_updated()
        return self._donation_repository.upsert(donation)

    async def prepare_trustline(
        self,
        *,
        ngo_id: str,
        wallet_address: str,
        limit_value: str = "1000000000",
    ) -> dict[str, object]:
        ngo = self._require_ngo(ngo_id)
        transaction = await self._xrpl_service.prepare_trustline(
            wallet_address=wallet_address,
            issuer_address=ngo.issuer_address,
            currency_code="DONO",
            limit_value=limit_value,
        )
        return {
            "network_url": self._settings.xrpl_network_url,
            "issuer_address": ngo.issuer_address,
            "currency_code": "DONO",
            "transaction": transaction,
        }

    async def verify_trustline(self, *, ngo_id: str, wallet_address: str) -> bool:
        ngo = self._require_ngo(ngo_id)
        return await self._xrpl_service.has_trustline(
            wallet_address=wallet_address,
            issuer_address=ngo.issuer_address,
            currency_code="DONO",
        )

    async def _record_payment_if_eligible(
        self,
        ngo: NGOProfile,
        payment: TreasuryPayment,
    ) -> DonationRecord | None:
        if not payment.validated:
            return None

        # Accept RLUSD payments (handle both human-readable and hex-encoded currency codes)
        rlusd_hex = xrpl_currency_code(self._settings.rlusd_currency_code)
        is_rlusd = (
            payment.currency_code in (self._settings.rlusd_currency_code, rlusd_hex)
            and payment.issuer_address == self._settings.rlusd_issuer
        )
        # Also accept native XRP payments
        is_xrp = payment.currency_code == "XRP"

        if not (is_rlusd or is_xrp):
            return None

        existing = self._donation_repository.get_by_payment_reference(payment.payment_reference)
        if existing is not None:
            return existing

        donation = DonationRecord(
            donation_id=str(uuid4()),
            payment_reference=payment.payment_reference,
            ngo_id=ngo.ngo_id,
            donor_wallet_address=payment.source_address,
            treasury_address=payment.destination,
            rlusd_amount=Decimal(payment.amount),
            dono_rate=ngo.dono_rate,
            dono_amount=compute_dono_amount(payment.amount, ngo.dono_rate),
            state=DonationProcessingState.DETECTED,
            detection_tx_hash=payment.tx_hash,
        )
        return self._donation_repository.upsert(donation)

    async def find_payment_paths(self, *, ngo_id: str, source_address: str, amount: str) -> dict:
        ngo = self._require_ngo(ngo_id)
        rlusd_hex = xrpl_currency_code(self._settings.rlusd_currency_code)
        destination_amount = {
            "currency": rlusd_hex,
            "issuer": self._settings.rlusd_issuer,
            "value": amount,
        }
        paths = await self._xrpl_service.find_payment_paths(
            source_address=source_address,
            destination_address=ngo.treasury_address,
            destination_amount=destination_amount,
        )
        return {
            "source_address": source_address,
            "destination_address": ngo.treasury_address,
            "destination_amount": amount,
            "destination_currency": "RLUSD",
            "paths": paths,
            "message": f"Found {len(paths)} payment path(s) to deliver {amount} RLUSD to {ngo.name}",
        }

    def _require_ngo(self, ngo_id: str) -> NGOProfile:
        ngo = self._ngo_repository.get(ngo_id)
        if ngo is None:
            raise ValueError(f"Unknown NGO {ngo_id!r}.")
        return ngo

    def _require_donation(self, donation_id: str) -> DonationRecord:
        donation = self._donation_repository.get(donation_id)
        if donation is None:
            raise ValueError(f"Unknown donation {donation_id!r}.")
        return donation
