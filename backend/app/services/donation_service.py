from app.services.supabase import get_supabase
from app.services.xrpl.transactions import verify_payment
from app.services.xrpl.tokens import issue_tokens
from app.services.ngo_service import get_ngo
from xrpl.wallet import Wallet


def process_donation(ngo_id: str, donor_address: str, tx_hash: str) -> dict:
    """Synchronous donation flow:
    1. Verify the tx_hash is a real payment to the NGO treasury
    2. Record donation in DB
    3. Issue DONO tokens from issuer -> distributor -> donor
    4. Update donation status
    """
    sb = get_supabase()

    # Get NGO details
    ngo = get_ngo(ngo_id)
    if not ngo:
        raise ValueError(f"NGO {ngo_id} not found")

    # Verify the on-chain payment
    payment = verify_payment(tx_hash, expected_destination=ngo["treasury_address"])
    if not payment:
        raise ValueError(f"Transaction {tx_hash} is not a valid payment to this NGO's treasury")

    # Calculate DONO tokens based on conversion rate
    dono_amount = payment["amount"] * ngo["conversion_rate"]

    # Find or create donor record
    donor = _get_or_create_donor(donor_address)

    # Insert donation record as pending
    donation_row = {
        "donor_id": donor["id"],
        "ngo_id": ngo_id,
        "amount": payment["amount"],
        "dono_tokens": dono_amount,
        "tx_hash": tx_hash,
        "status": "verified",
    }
    result = sb.table("donations").insert(donation_row).execute()
    donation = result.data[0]

    # Issue DONO tokens: issuer -> distributor (already has trustline)
    # In a full implementation, distributor would then send to donor
    # For hackathon demo, we issue directly and record it
    try:
        issuer_wallet = _get_ngo_issuer_wallet(ngo)
        token_tx = issue_tokens(
            issuer_wallet=issuer_wallet,
            destination_address=ngo["distributor_address"],
            currency_code=ngo["currency_code"],
            amount=str(dono_amount),
        )
        # Update donation with token tx hash
        sb.table("donations").update({
            "token_tx_hash": token_tx,
            "status": "tokens_issued",
        }).eq("id", donation["id"]).execute()
        donation["token_tx_hash"] = token_tx
        donation["status"] = "tokens_issued"
    except Exception as e:
        sb.table("donations").update({"status": "failed"}).eq("id", donation["id"]).execute()
        donation["status"] = "failed"
        raise ValueError(f"Token issuance failed: {e}")

    return donation


def list_donations(ngo_id: str | None = None, donor_id: str | None = None) -> list[dict]:
    sb = get_supabase()
    query = sb.table("donations").select("*")
    if ngo_id:
        query = query.eq("ngo_id", ngo_id)
    if donor_id:
        query = query.eq("donor_id", donor_id)
    result = query.order("created_at", desc=True).execute()
    return result.data


def get_donation(donation_id: str) -> dict | None:
    sb = get_supabase()
    result = sb.table("donations").select("*").eq("id", donation_id).execute()
    return result.data[0] if result.data else None


def get_donor_tree(donor_address: str) -> dict:
    """Build the donor tree: aggregate DONO balance, per-NGO breakdown, spending trail."""
    sb = get_supabase()

    # Find donor
    donor_result = sb.table("donors").select("id").eq("xrpl_address", donor_address).execute()
    if not donor_result.data:
        return {
            "donor_address": donor_address,
            "total_dono_tokens": 0,
            "total_donated": 0,
            "ngo_count": 0,
            "branches": [],
        }

    donor_id = donor_result.data[0]["id"]

    # Get all donations for this donor
    donations_result = sb.table("donations").select("*").eq("donor_id", donor_id).eq("status", "tokens_issued").execute()
    donations = donations_result.data

    if not donations:
        return {
            "donor_address": donor_address,
            "total_dono_tokens": 0,
            "total_donated": 0,
            "ngo_count": 0,
            "branches": [],
        }

    # Group by NGO
    ngo_groups: dict[str, list[dict]] = {}
    for d in donations:
        ngo_groups.setdefault(d["ngo_id"], []).append(d)

    # Fetch NGO details for all involved NGOs
    ngo_ids = list(ngo_groups.keys())
    ngos_result = sb.table("ngos").select("id, name, logo_url").in_("id", ngo_ids).execute()
    ngo_lookup = {n["id"]: n for n in ngos_result.data}

    # Build branches
    branches = []
    total_dono = 0
    total_donated = 0

    for ngo_id, ngo_donations in ngo_groups.items():
        ngo_info = ngo_lookup.get(ngo_id, {})
        branch_dono = sum(d["dono_tokens"] for d in ngo_donations)
        branch_donated = sum(d["amount"] for d in ngo_donations)
        total_dono += branch_dono
        total_donated += branch_donated

        # Get spending events for this NGO (the sub-branches)
        spending_result = sb.table("ngo_transactions").select("*").eq("ngo_id", ngo_id).order("created_at", desc=True).execute()

        # Check which spending events have proofs
        spending_ids = [s["id"] for s in spending_result.data]
        proofs_result = sb.table("proofs").select("ngo_transaction_id").in_("ngo_transaction_id", spending_ids).execute() if spending_ids else type("R", (), {"data": []})()
        proof_set = {p["ngo_transaction_id"] for p in proofs_result.data}

        spending = [
            {
                "id": s["id"],
                "destination": s["destination"],
                "amount": s["amount"],
                "memo": s["memo"],
                "category": s["category"],
                "has_proof": s["id"] in proof_set,
                "created_at": s["created_at"],
            }
            for s in spending_result.data
        ]

        branches.append({
            "ngo_id": ngo_id,
            "ngo_name": ngo_info.get("name", "Unknown"),
            "ngo_logo_url": ngo_info.get("logo_url"),
            "total_donated": branch_donated,
            "total_dono_tokens": branch_dono,
            "donation_count": len(ngo_donations),
            "spending": spending,
        })

    return {
        "donor_address": donor_address,
        "total_dono_tokens": total_dono,
        "total_donated": total_donated,
        "ngo_count": len(branches),
        "branches": branches,
    }


def _get_or_create_donor(xrpl_address: str) -> dict:
    """Find a donor by XRPL address, or create one."""
    sb = get_supabase()
    result = sb.table("donors").select("*").eq("xrpl_address", xrpl_address).execute()
    if result.data:
        return result.data[0]
    new_donor = sb.table("donors").insert({"xrpl_address": xrpl_address}).execute()
    return new_donor.data[0]


def _get_ngo_issuer_wallet(ngo: dict) -> Wallet:
    """Reconstruct the issuer wallet from the seed stored in DB."""
    seed = ngo.get("issuer_seed")
    if not seed:
        raise ValueError("NGO has no issuer seed stored — cannot issue tokens")
    return Wallet.from_seed(seed)
