from fastapi import APIRouter, HTTPException

from app.schemas import (
    DonationCreate, DonationResponse, DonationListItem, DonorTree,
)
from app.services import donation_service

router = APIRouter(prefix="/donations", tags=["donations"])


@router.post("/", response_model=DonationResponse)
def create_donation(data: DonationCreate):
    """Verify an on-chain payment and issue DONO tokens synchronously."""
    try:
        return donation_service.process_donation(
            ngo_id=data.ngo_id,
            donor_address=data.donor_address,
            tx_hash=data.tx_hash,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=list[DonationResponse])
def list_donations(ngo_id: str | None = None, donor_id: str | None = None):
    return donation_service.list_donations(ngo_id=ngo_id, donor_id=donor_id)


@router.get("/donor/{donor_address}/tree", response_model=DonorTree)
def get_donor_tree(donor_address: str):
    """The most important endpoint — returns the full donor tree for the frontend."""
    return donation_service.get_donor_tree(donor_address)


@router.get("/{donation_id}", response_model=DonationResponse)
def get_donation(donation_id: str):
    donation = donation_service.get_donation(donation_id)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    return donation
