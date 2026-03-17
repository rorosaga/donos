from xrpl.wallet import Wallet

from app.services.supabase import get_supabase
from app.services.xrpl.accounts import create_funded_account
from app.services.xrpl.tokens import setup_trustline
from app.schemas.ngo import NGOCreate


def register_ngo(data: NGOCreate) -> dict:
    """Register a new NGO: create 3 XRPL accounts (issuer, treasury, distributor),
    set up trustline from distributor to issuer, store in DB."""
    sb = get_supabase()

    # Create the 3 XRPL accounts
    issuer = create_funded_account()
    treasury = create_funded_account()
    distributor = create_funded_account()

    # Distributor needs a trustline to the issuer to hold DONO tokens
    setup_trustline(
        wallet=distributor,
        issuer_address=issuer.address,
        currency_code=data.currency_code,
    )

    row = {
        "name": data.name,
        "description": data.description,
        "logo_url": data.logo_url,
        "issuer_address": issuer.address,
        "issuer_seed": issuer.seed,
        "treasury_address": treasury.address,
        "treasury_seed": treasury.seed,
        "distributor_address": distributor.address,
        "distributor_seed": distributor.seed,
        "currency_code": data.currency_code,
        "conversion_rate": data.conversion_rate,
    }

    result = sb.table("ngos").insert(row).execute()
    return result.data[0]


def list_ngos() -> list[dict]:
    sb = get_supabase()
    result = sb.table("ngos").select("*").execute()
    return result.data


def get_ngo(ngo_id: str) -> dict | None:
    sb = get_supabase()
    result = sb.table("ngos").select("*").eq("id", ngo_id).execute()
    return result.data[0] if result.data else None


def get_ngo_transactions(ngo_id: str) -> list[dict]:
    sb = get_supabase()
    result = sb.table("ngo_transactions").select("*").eq("ngo_id", ngo_id).order("created_at", desc=True).execute()
    return result.data


def add_proof(ngo_id: str, ngo_transaction_id: str | None, file_url: str, description: str | None) -> dict:
    sb = get_supabase()
    row = {
        "ngo_id": ngo_id,
        "ngo_transaction_id": ngo_transaction_id,
        "file_url": file_url,
        "description": description,
    }
    result = sb.table("proofs").insert(row).execute()
    return result.data[0]
