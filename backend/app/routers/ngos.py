from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import (
    get_donation_processor,
    get_donation_repository,
    get_ngo_repository,
    get_operations_service,
)
from app.repositories import DonationRepository, NGORepository
from app.schemas.api import (
    NGOResponse,
    NGORating,
    NGOOperationalReadinessResponse,
    TrustlinePrepareRequest,
    TrustlinePrepareResponse,
    TrustlineVerifyRequest,
    TrustlineVerifyResponse,
    VerificationGuideRequest,
    VerificationGuideResponse,
)
from app.services.donation_processor import DonationProcessor
from app.services.operations import NGOOperationsService

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


@router.get("/{ngo_id}/rating", response_model=NGORating)
async def get_ngo_rating(
    ngo_id: str,
    ngo_repository: NGORepository = Depends(get_ngo_repository),
    donation_repository: DonationRepository = Depends(get_donation_repository),
) -> NGORating:
    ngo = ngo_repository.get(ngo_id)
    if ngo is None:
        raise HTTPException(status_code=404, detail="NGO not found.")

    donations = donation_repository.list(ngo_id=ngo_id)
    completed = [d for d in donations if d.state.value in ('sent_to_donor', 'completed_zero_issuance')]

    total_donations = len(completed)
    unique_donors = len({d.donor_wallet_address for d in completed})

    # Simple rating computation
    transparency = 0.0  # No spending data yet
    activity = min(total_donations / 50.0, 1.0) if total_donations > 0 else 0.0
    diversity = (unique_donors / total_donations) if total_donations > 0 else 0.0

    overall = round((transparency * 0.4 + activity * 0.3 + diversity * 0.3) * 5, 1)

    return NGORating(
        ngo_id=ngo_id,
        overall=overall,
        transparency=round(transparency, 3),
        activity=round(activity, 3),
        donor_diversity=round(diversity, 3),
        total_donations=total_donations,
        unique_donors=unique_donors,
        anomaly_flags=[],
    )


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


@router.get("/{ngo_id}/diagnostics", response_model=NGOOperationalReadinessResponse)
async def get_ngo_diagnostics(
    ngo_id: str,
    operations_service: NGOOperationsService = Depends(get_operations_service),
) -> NGOOperationalReadinessResponse:
    try:
        summary = await operations_service.summarize_preflight(ngo_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return NGOOperationalReadinessResponse(**summary)


@router.post("/{ngo_id}/verification-guide", response_model=VerificationGuideResponse)
async def build_verification_guide(
    ngo_id: str,
    payload: VerificationGuideRequest,
    operations_service: NGOOperationsService = Depends(get_operations_service),
) -> VerificationGuideResponse:
    try:
        guide = await operations_service.build_verification_guide(
            ngo_id=ngo_id,
            donor_wallet_address=payload.donor_wallet_address,
            rlusd_amount=payload.rlusd_amount,
            trustline_limit_value=payload.trustline_limit_value,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return VerificationGuideResponse(**guide)
