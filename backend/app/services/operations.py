from __future__ import annotations

from dataclasses import asdict
from decimal import Decimal
from decimal import ROUND_FLOOR

from app.config import Settings
from app.models import NGOOperationalDiagnostics
from app.repositories import NGORepository
from app.services.xrpl.client import XRPLService


class NGOOperationsService:
    def __init__(
        self,
        *,
        settings: Settings,
        ngo_repository: NGORepository,
        xrpl_service: XRPLService,
    ) -> None:
        self._settings = settings
        self._ngo_repository = ngo_repository
        self._xrpl_service = xrpl_service

    async def get_network_status(self) -> dict[str, str]:
        return await self._xrpl_service.get_network_status()

    async def get_ngo_diagnostics(self, ngo_id: str) -> NGOOperationalDiagnostics:
        ngo = self._ngo_repository.get(ngo_id)
        if ngo is None:
            raise ValueError(f"Unknown NGO {ngo_id!r}.")
        secrets = self._ngo_repository.get_wallet_secrets(ngo_id)
        if secrets is None:
            raise ValueError(f"Missing wallet secrets for NGO {ngo_id!r}.")

        treasury = await self._xrpl_service.get_account_status(
            wallet_address=ngo.treasury_address
        )
        issuer = await self._xrpl_service.get_account_status(wallet_address=ngo.issuer_address)
        distributor = await self._xrpl_service.get_account_status(
            wallet_address=ngo.distributor_address
        )
        issuer_distributor_trustline_ready = await self._xrpl_service.has_trustline(
            wallet_address=ngo.distributor_address,
            issuer_address=ngo.issuer_address,
            currency_code="DONO",
        )
        distributor_rlusd_trustline_ready = await self._xrpl_service.has_trustline(
            wallet_address=ngo.distributor_address,
            issuer_address=self._settings.rlusd_issuer,
            currency_code=self._settings.rlusd_currency_code,
        )
        return NGOOperationalDiagnostics(
            ngo_id=ngo.ngo_id,
            network_url=self._settings.xrpl_network_url,
            treasury=treasury,
            issuer=issuer,
            distributor=distributor,
            treasury_seed_matches_address=self._xrpl_service.seed_matches_address(
                wallet_seed=secrets.treasury_seed,
                wallet_address=ngo.treasury_address,
            ),
            issuer_seed_matches_address=self._xrpl_service.seed_matches_address(
                wallet_seed=secrets.issuer_seed,
                wallet_address=ngo.issuer_address,
            ),
            distributor_seed_matches_address=self._xrpl_service.seed_matches_address(
                wallet_seed=secrets.distributor_seed,
                wallet_address=ngo.distributor_address,
            ),
            issuer_distributor_trustline_ready=issuer_distributor_trustline_ready,
            distributor_rlusd_trustline_ready=distributor_rlusd_trustline_ready,
        )

    async def build_verification_guide(
        self,
        *,
        ngo_id: str,
        donor_wallet_address: str,
        rlusd_amount: Decimal,
        trustline_limit_value: str = "1000000000",
    ) -> dict[str, object]:
        ngo = self._ngo_repository.get(ngo_id)
        if ngo is None:
            raise ValueError(f"Unknown NGO {ngo_id!r}.")

        trustline_transaction = await self._xrpl_service.prepare_trustline(
            wallet_address=donor_wallet_address,
            issuer_address=ngo.issuer_address,
            currency_code="DONO",
            limit_value=trustline_limit_value,
        )

        expected_dono_amount = int(
            (rlusd_amount * ngo.dono_rate).to_integral_value(rounding=ROUND_FLOOR)
        )
        return {
            "ngo_id": ngo.ngo_id,
            "network_url": self._settings.xrpl_network_url,
            "donor_wallet_address": donor_wallet_address,
            "treasury_address": ngo.treasury_address,
            "issuer_address": ngo.issuer_address,
            "distributor_address": ngo.distributor_address,
            "rlusd_currency_code": self._settings.rlusd_currency_code,
            "rlusd_issuer": self._settings.rlusd_issuer,
            "rlusd_amount": str(rlusd_amount),
            "expected_dono_amount": expected_dono_amount,
            "trustline_transaction": trustline_transaction,
            "verification_steps": [
                "Run backend preflight and confirm all NGO accounts exist and seeds match.",
                "Submit the TrustSet transaction with the donor wallet.",
                "Send the RLUSD payment to the NGO treasury address.",
                "Wait for the poller or call /donations/reprocess.",
                "Inspect /donations/by-payment/{payment_reference} until state is sent_to_donor.",
            ],
        }

    async def summarize_preflight(self, ngo_id: str) -> dict[str, object]:
        network_status = await self.get_network_status()
        diagnostics = await self.get_ngo_diagnostics(ngo_id)
        return {
            "network_status": network_status,
            "ngo_diagnostics": asdict(diagnostics),
        }
