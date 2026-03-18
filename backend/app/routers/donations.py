from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_donation_processor, get_donation_repository, get_ngo_repository
from app.repositories import DonationRepository, NGORepository
from app.schemas.api import DonationResponse, DonorTree, PathfindRequest, PathfindResponse, ReprocessRequest, ReprocessResponse, TreeBranch
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


@router.post("/pathfind", response_model=PathfindResponse)
async def find_paths(
    payload: PathfindRequest,
    processor: DonationProcessor = Depends(get_donation_processor),
) -> PathfindResponse:
    try:
        result = await processor.find_payment_paths(
            ngo_id=payload.ngo_id,
            source_address=payload.source_address,
            amount=payload.destination_amount,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return PathfindResponse(**result)


@router.get("/by-payment/{payment_reference}", response_model=DonationResponse)
async def get_donation_by_payment_reference(
    payment_reference: str,
    donation_repository: DonationRepository = Depends(get_donation_repository),
) -> DonationResponse:
    donation = donation_repository.get_by_payment_reference(payment_reference)
    if donation is None:
        raise HTTPException(status_code=404, detail="Donation not found.")
    return DonationResponse.from_domain(donation)


@router.get("/donor/{donor_address}/tree", response_model=DonorTree)
async def get_donor_tree(
    donor_address: str,
    donation_repository: DonationRepository = Depends(get_donation_repository),
    ngo_repository: NGORepository = Depends(get_ngo_repository),
) -> DonorTree:
    donations = donation_repository.list(donor_wallet_address=donor_address)

    # Group by ngo_id
    ngo_groups: dict[str, list] = {}
    for d in donations:
        ngo_groups.setdefault(d.ngo_id, []).append(d)

    branches = []
    total_dono = 0.0
    total_donated = 0.0

    for ngo_id, ngo_donations in ngo_groups.items():
        ngo = ngo_repository.get(ngo_id)
        ngo_name = ngo.name if ngo else ngo_id

        branch_donated = sum(float(d.rlusd_amount) for d in ngo_donations)
        branch_dono = sum(d.dono_amount for d in ngo_donations)
        total_dono += branch_dono
        total_donated += branch_donated

        branches.append(TreeBranch(
            ngo_id=ngo_id,
            ngo_name=ngo_name,
            total_donated=branch_donated,
            total_dono_tokens=float(branch_dono),
            donation_count=len(ngo_donations),
            spending=[],  # Will be populated when ngo_transactions are tracked
        ))

    # Sort by total_donated descending
    branches.sort(key=lambda b: b.total_donated, reverse=True)

    return DonorTree(
        donor_address=donor_address,
        total_dono_tokens=total_dono,
        total_donated=total_donated,
        ngo_count=len(branches),
        branches=branches,
    )


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
