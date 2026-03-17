from pydantic import BaseModel
from datetime import datetime


class DonorCreate(BaseModel):
    display_name: str | None = None
    xrpl_address: str | None = None


class DonorResponse(BaseModel):
    id: str
    auth_user_id: str | None
    display_name: str | None
    xrpl_address: str | None
    created_at: datetime
