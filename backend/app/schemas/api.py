from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.models import DonationProcessingState, DonationRecord, NGOProfile


class NGOResponse(BaseModel):
    ngo_id: str
    name: str
    treasury_address: str
    issuer_address: str
    distributor_address: str
    dono_rate: Decimal
    dono_currency_code: str = "DONO"

    @classmethod
    def from_domain(cls, ngo: NGOProfile) -> "NGOResponse":
        return cls(
            ngo_id=ngo.ngo_id,
            name=ngo.name,
            treasury_address=ngo.treasury_address,
            issuer_address=ngo.issuer_address,
            distributor_address=ngo.distributor_address,
            dono_rate=ngo.dono_rate,
        )


class DonationResponse(BaseModel):
    model_config = ConfigDict(use_enum_values=True)

    donation_id: str
    payment_reference: str
    ngo_id: str
    donor_wallet_address: str
    treasury_address: str
    rlusd_amount: Decimal
    dono_rate: Decimal
    dono_amount: int
    state: DonationProcessingState
    failure_reason: str | None
    detection_tx_hash: str | None
    issuance_tx_hash: str | None
    distribution_tx_hash: str | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_domain(cls, donation: DonationRecord) -> "DonationResponse":
        return cls(**donation.__dict__)


class TrustlinePrepareRequest(BaseModel):
    wallet_address: str
    limit_value: str = "1000000000"


class TrustlinePrepareResponse(BaseModel):
    network_url: str
    issuer_address: str
    currency_code: str
    transaction: dict[str, Any]


class TrustlineVerifyRequest(BaseModel):
    wallet_address: str


class TrustlineVerifyResponse(BaseModel):
    ngo_id: str
    wallet_address: str
    trustline_ready: bool


class XRPLAccountStatusResponse(BaseModel):
    address: str
    exists: bool
    balance_drops: str | None
    owner_count: int | None
    previous_txn_id: str | None
    sequence: int | None


class NGOOperationalDiagnosticsResponse(BaseModel):
    ngo_id: str
    network_url: str
    treasury: XRPLAccountStatusResponse
    issuer: XRPLAccountStatusResponse
    distributor: XRPLAccountStatusResponse
    treasury_seed_matches_address: bool
    issuer_seed_matches_address: bool
    distributor_seed_matches_address: bool
    issuer_distributor_trustline_ready: bool
    distributor_rlusd_trustline_ready: bool


class NGOOperationalReadinessResponse(BaseModel):
    network_status: dict[str, str]
    ngo_diagnostics: NGOOperationalDiagnosticsResponse


class VerificationGuideRequest(BaseModel):
    donor_wallet_address: str
    rlusd_amount: Decimal
    trustline_limit_value: str = "1000000000"


class VerificationGuideResponse(BaseModel):
    ngo_id: str
    network_url: str
    donor_wallet_address: str
    treasury_address: str
    issuer_address: str
    distributor_address: str
    rlusd_currency_code: str
    rlusd_issuer: str
    rlusd_amount: str
    expected_dono_amount: int
    trustline_transaction: dict[str, Any]
    verification_steps: list[str]


class ReprocessRequest(BaseModel):
    donation_id: str | None = None
    ngo_id: str | None = None


class ReprocessResponse(BaseModel):
    processed_count: int
    donations: list[DonationResponse]


# --- Donor Tree schemas ---


class TreeSpending(BaseModel):
    id: str
    destination: str
    amount: float
    memo: str | None = None
    category: str | None = None
    has_proof: bool = False
    created_at: str


class TreeBranch(BaseModel):
    ngo_id: str
    ngo_name: str
    ngo_logo_url: str | None = None
    total_donated: float
    total_dono_tokens: float
    donation_count: int
    spending: list[TreeSpending] = []


class DonorTree(BaseModel):
    donor_address: str
    total_dono_tokens: float
    total_donated: float
    ngo_count: int
    branches: list[TreeBranch]


# --- NGO Rating schema ---


class NGORating(BaseModel):
    ngo_id: str
    overall: float
    transparency: float
    activity: float
    donor_diversity: float
    total_donations: int
    unique_donors: int
    anomaly_flags: list[dict] = []


# --- Pathfinding schemas ---


class PathfindRequest(BaseModel):
    source_address: str
    ngo_id: str
    destination_amount: str  # amount of RLUSD the NGO should receive


class PathfindResponse(BaseModel):
    source_address: str
    destination_address: str
    destination_amount: str
    destination_currency: str
    paths: list[dict]
    message: str  # human readable explanation
