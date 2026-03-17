from pydantic import BaseModel
from datetime import datetime


class NGOCreate(BaseModel):
    name: str
    description: str | None = None
    logo_url: str | None = None
    currency_code: str = "DONO"
    conversion_rate: float = 1.0


class NGOResponse(BaseModel):
    id: str
    name: str
    description: str | None
    logo_url: str | None
    issuer_address: str
    treasury_address: str
    distributor_address: str
    currency_code: str
    conversion_rate: float
    created_at: datetime


class NGOListItem(BaseModel):
    id: str
    name: str
    description: str | None
    logo_url: str | None
    currency_code: str
    rating: float | None = None


class NGORating(BaseModel):
    ngo_id: str
    overall: float
    transparency: float
    activity: float
    donor_diversity: float
    total_donations: int
    unique_donors: int
    anomaly_flags: list[dict] = []
