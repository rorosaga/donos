from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal, ROUND_FLOOR
from enum import StrEnum


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DonationProcessingState(StrEnum):
    DETECTED = "detected"
    PENDING_TRUSTLINE = "pending_trustline"
    READY_TO_ISSUE = "ready_to_issue"
    ISSUED_TO_DISTRIBUTOR = "issued_to_distributor"
    SENT_TO_DONOR = "sent_to_donor"
    COMPLETED_ZERO_ISSUANCE = "completed_zero_issuance"
    FAILED = "failed"


@dataclass(frozen=True)
class NGOProfile:
    ngo_id: str
    name: str
    treasury_address: str
    issuer_address: str
    distributor_address: str
    dono_rate: Decimal


@dataclass(frozen=True)
class WalletSecrets:
    treasury_seed: str
    issuer_seed: str
    distributor_seed: str


@dataclass(frozen=True)
class IssuedAsset:
    currency_code: str
    issuer_address: str


@dataclass(frozen=True)
class TreasuryPayment:
    payment_reference: str
    tx_hash: str
    ledger_index: int
    destination: str
    source_address: str
    amount: Decimal
    currency_code: str
    issuer_address: str
    validated: bool


@dataclass
class DonationRecord:
    donation_id: str
    payment_reference: str
    ngo_id: str
    donor_wallet_address: str
    treasury_address: str
    rlusd_amount: Decimal
    dono_rate: Decimal
    dono_amount: int
    state: DonationProcessingState
    failure_reason: str | None = None
    detection_tx_hash: str | None = None
    issuance_tx_hash: str | None = None
    distribution_tx_hash: str | None = None
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

    def mark_updated(self) -> None:
        self.updated_at = utc_now()


def compute_dono_amount(rlusd_amount: Decimal, dono_rate: Decimal) -> int:
    issued = (rlusd_amount * dono_rate).to_integral_value(rounding=ROUND_FLOOR)
    return int(issued)
