from fastapi import APIRouter, HTTPException

from app.schemas import DonorCreate, DonorResponse
from app.services.supabase import get_supabase

router = APIRouter(prefix="/donors", tags=["donors"])


@router.post("/", response_model=DonorResponse)
def create_donor(data: DonorCreate):
    sb = get_supabase()
    row = {
        "display_name": data.display_name,
        "xrpl_address": data.xrpl_address,
    }
    result = sb.table("donors").insert(row).execute()
    return result.data[0]


@router.get("/{donor_id}", response_model=DonorResponse)
def get_donor(donor_id: str):
    sb = get_supabase()
    result = sb.table("donors").select("*").eq("id", donor_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Donor not found")
    return result.data[0]
