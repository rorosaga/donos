from __future__ import annotations

from collections.abc import Iterable
from threading import Lock

from app.models import DonationRecord, NGOProfile, WalletSecrets


class NGORepository:
    def __init__(
        self,
        profiles: Iterable[NGOProfile],
        wallet_secrets: dict[str, WalletSecrets],
    ) -> None:
        self._profiles = {profile.ngo_id: profile for profile in profiles}
        self._wallet_secrets = wallet_secrets

    def list(self) -> list[NGOProfile]:
        return list(self._profiles.values())

    def get(self, ngo_id: str) -> NGOProfile | None:
        return self._profiles.get(ngo_id)

    def get_wallet_secrets(self, ngo_id: str) -> WalletSecrets | None:
        return self._wallet_secrets.get(ngo_id)


class DonationRepository:
    def __init__(self) -> None:
        self._lock = Lock()
        self._by_id: dict[str, DonationRecord] = {}
        self._by_payment_reference: dict[str, str] = {}

    def upsert(self, donation: DonationRecord) -> DonationRecord:
        with self._lock:
            self._by_id[donation.donation_id] = donation
            self._by_payment_reference[donation.payment_reference] = donation.donation_id
        return donation

    def get(self, donation_id: str) -> DonationRecord | None:
        return self._by_id.get(donation_id)

    def get_by_payment_reference(self, payment_reference: str) -> DonationRecord | None:
        donation_id = self._by_payment_reference.get(payment_reference)
        if donation_id is None:
            return None
        return self._by_id.get(donation_id)

    def list(
        self,
        *,
        ngo_id: str | None = None,
        donor_wallet_address: str | None = None,
    ) -> list[DonationRecord]:
        donations = list(self._by_id.values())
        if ngo_id is not None:
            donations = [donation for donation in donations if donation.ngo_id == ngo_id]
        if donor_wallet_address is not None:
            donations = [
                donation
                for donation in donations
                if donation.donor_wallet_address == donor_wallet_address
            ]
        return sorted(donations, key=lambda donation: donation.created_at, reverse=True)
