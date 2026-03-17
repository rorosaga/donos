from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_donation_processor, get_donation_repository
from app.repositories import DonationRepository
from app.schemas.api import DonationResponse, ReprocessRequest, ReprocessResponse
from app.services.donation_processor import DonationProcessor

router = APIRouter(prefix="/donations", tags=["donations"])


@router.get("", response_model=list[DonationResponse])
async def list_donations(
    ngo_id: str | None = Query(default=None),
    donor_wallet_address: str | None = Query(default=None),
    donation_repository: DonationRepository = Depends(get_donation_repository),
) -> list[DonationResponse]:
    donations = donation_repository.list(
        ngo_id=ngo_id,
        donor_wallet_address=donor_wallet_address,
    )
    return [DonationResponse.from_domain(donation) for donation in donations]


@router.get("/by-payment/{payment_reference}", response_model=DonationResponse)
async def get_donation_by_payment_reference(
    payment_reference: str,
    donation_repository: DonationRepository = Depends(get_donation_repository),
) -> DonationResponse:
    donation = donation_repository.get_by_payment_reference(payment_reference)
    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found.")
    return DonationResponse.from_domain(donation)


@router.get("/{donation_id}", response_model=DonationResponse)
async def get_donation(
    donation_id: str,
    donation_repository: DonationRepository = Depends(get_donation_repository),
) -> DonationResponse:
    donation = donation_repository.get(donation_id)
    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found.")
    return DonationResponse.from_domain(donation)


@router.post("/reprocess", response_model=ReprocessResponse)
async def reprocess_donations(
    payload: ReprocessRequest,
    processor: DonationProcessor = Depends(get_donation_processor),
    donation_repository: DonationRepository = Depends(get_donation_repository),
) -> ReprocessResponse:
    processed = []
    if payload.donation_id is not None:
        try:
            processed.append(await processor.process_donation(payload.donation_id))
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
    elif payload.ngo_id is not None:
        try:
            processed = await processor.scan_ngo(payload.ngo_id)
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
    else:
        for donation in donation_repository.list():
            processed.append(await processor.process_donation(donation.donation_id))

    return ReprocessResponse(
        processed_count=len(processed),
        donations=[DonationResponse.from_domain(donation) for donation in processed],
    )
