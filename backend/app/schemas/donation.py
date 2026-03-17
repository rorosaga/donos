from pydantic import BaseModel
from datetime import datetime


class DonationCreate(BaseModel):
    """Frontend POSTs this after the donor sends stablecoin via Xaman."""
    ngo_id: str
    donor_address: str
    tx_hash: str


class DonationResponse(BaseModel):
    id: str
    donor_id: str | None
    ngo_id: str
    amount: float
    dono_tokens: float
    tx_hash: str
    token_tx_hash: str | None
    status: str
    created_at: datetime


class DonationListItem(BaseModel):
    id: str
    ngo_id: str
    ngo_name: str | None = None
    amount: float
    dono_tokens: float
    status: str
    created_at: datetime


# --- Tree endpoint response shape ---

class TreeBranch(BaseModel):
    """One branch = one NGO the donor has given to."""
    ngo_id: str
    ngo_name: str
    ngo_logo_url: str | None
    total_donated: float
    total_dono_tokens: float
    donation_count: int
    spending: list["TreeSpending"] = []


class TreeSpending(BaseModel):
    """Sub-branch = an NGO spending event."""
    id: str
    destination: str
    amount: float
    memo: str | None
    category: str | None
    has_proof: bool
    created_at: datetime


class DonorTree(BaseModel):
    """The full tree for a donor — this is what the frontend renders."""
    donor_address: str
    total_dono_tokens: float
    total_donated: float
    ngo_count: int
    branches: list[TreeBranch]
