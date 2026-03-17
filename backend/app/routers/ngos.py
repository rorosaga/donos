from fastapi import APIRouter, HTTPException

from app.schemas import (
    NGOCreate, NGOResponse, NGOListItem, NGORating,
    NgoTransactionResponse, ProofCreate, ProofResponse,
)
from app.services import ngo_service
from app.services.rating_service import compute_rating, check_anomalies

router = APIRouter(prefix="/ngos", tags=["ngos"])


@router.post("/", response_model=NGOResponse)
def create_ngo(data: NGOCreate):
    """Register a new NGO — creates 3 XRPL accounts and stores in DB."""
    try:
        return ngo_service.register_ngo(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=list[NGOListItem])
def list_ngos():
    return ngo_service.list_ngos()


@router.get("/{ngo_id}", response_model=NGOResponse)
def get_ngo(ngo_id: str):
    ngo = ngo_service.get_ngo(ngo_id)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    return ngo


@router.get("/{ngo_id}/transactions", response_model=list[NgoTransactionResponse])
def get_ngo_transactions(ngo_id: str):
    return ngo_service.get_ngo_transactions(ngo_id)


@router.get("/{ngo_id}/rating", response_model=NGORating)
def get_ngo_rating(ngo_id: str):
    ngo = ngo_service.get_ngo(ngo_id)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    # Run anomaly checks before returning rating
    check_anomalies(ngo_id)
    return compute_rating(ngo_id)


@router.post("/{ngo_id}/proofs", response_model=ProofResponse)
def add_proof(ngo_id: str, data: ProofCreate):
    ngo = ngo_service.get_ngo(ngo_id)
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")
    return ngo_service.add_proof(
        ngo_id=ngo_id,
        ngo_transaction_id=data.ngo_transaction_id,
        file_url=data.file_url,
        description=data.description,
    )
