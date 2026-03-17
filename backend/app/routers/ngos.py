from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_donation_processor, get_ngo_repository
from app.repositories import NGORepository
from app.schemas.api import (
    NGOResponse,
    TrustlinePrepareRequest,
    TrustlinePrepareResponse,
    TrustlineVerifyRequest,
    TrustlineVerifyResponse,
)
from app.services.donation_processor import DonationProcessor

router = APIRouter(prefix="/ngos", tags=["ngos"])


@router.get("", response_model=list[NGOResponse])
async def list_ngos(
    ngo_repository: NGORepository = Depends(get_ngo_repository),
) -> list[NGOResponse]:
    return [NGOResponse.from_domain(ngo) for ngo in ngo_repository.list()]


@router.get("/{ngo_id}", response_model=NGOResponse)
async def get_ngo(
    ngo_id: str,
    ngo_repository: NGORepository = Depends(get_ngo_repository),
) -> NGOResponse:
    ngo = ngo_repository.get(ngo_id)
    if ngo is None:
        raise HTTPException(status_code=404, detail="NGO not found.")
    return NGOResponse.from_domain(ngo)


@router.post("/{ngo_id}/trustline/prepare", response_model=TrustlinePrepareResponse)
async def prepare_trustline(
    ngo_id: str,
    payload: TrustlinePrepareRequest,
    processor: DonationProcessor = Depends(get_donation_processor),
) -> TrustlinePrepareResponse:
    try:
        prepared = await processor.prepare_trustline(
            ngo_id=ngo_id,
            wallet_address=payload.wallet_address,
            limit_value=payload.limit_value,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return TrustlinePrepareResponse(**prepared)


@router.post("/{ngo_id}/trustline/verify", response_model=TrustlineVerifyResponse)
async def verify_trustline(
    ngo_id: str,
    payload: TrustlineVerifyRequest,
    processor: DonationProcessor = Depends(get_donation_processor),
) -> TrustlineVerifyResponse:
    try:
        trustline_ready = await processor.verify_trustline(
            ngo_id=ngo_id,
            wallet_address=payload.wallet_address,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return TrustlineVerifyResponse(
        ngo_id=ngo_id,
        wallet_address=payload.wallet_address,
        trustline_ready=trustline_ready,
    )
