from pydantic import BaseModel
from datetime import datetime


class NgoTransactionCreate(BaseModel):
    ngo_id: str
    tx_hash: str
    destination: str
    amount: float
    memo: str | None = None
    category: str | None = None


class NgoTransactionResponse(BaseModel):
    id: str
    ngo_id: str
    tx_hash: str
    destination: str
    amount: float
    memo: str | None
    category: str | None
    created_at: datetime


class ProofCreate(BaseModel):
    ngo_transaction_id: str | None = None
    ngo_id: str
    file_url: str
    description: str | None = None


class ProofResponse(BaseModel):
    id: str
    ngo_transaction_id: str | None
    ngo_id: str
    file_url: str
    description: str | None
    created_at: datetime
