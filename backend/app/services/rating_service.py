from app.services.supabase import get_supabase


def compute_rating(ngo_id: str) -> dict:
    """Compute NGO rating from 3 factors:
    - Transparency (40%): spending events with proofs / total spending events
    - Activity (30%): total donations, capped at 50
    - Donor diversity (30%): unique donors / total donations
    """
    sb = get_supabase()

    # Donations data
    donations = sb.table("donations").select("donor_id").eq("ngo_id", ngo_id).eq("status", "tokens_issued").execute().data
    total_donations = len(donations)
    unique_donors = len({d["donor_id"] for d in donations})

    # Spending & proofs
    transactions = sb.table("ngo_transactions").select("id").eq("ngo_id", ngo_id).execute().data
    total_transactions = len(transactions)
    if total_transactions > 0:
        tx_ids = [t["id"] for t in transactions]
        proofs = sb.table("proofs").select("ngo_transaction_id").in_("ngo_transaction_id", tx_ids).execute().data
        proven_tx_ids = {p["ngo_transaction_id"] for p in proofs}
        transactions_with_proofs = len(proven_tx_ids)
    else:
        transactions_with_proofs = 0

    # Calculate scores
    transparency = (transactions_with_proofs / total_transactions) if total_transactions > 0 else 0
    activity = min(total_donations / 50, 1.0) if total_donations > 0 else 0
    diversity = (unique_donors / total_donations) if total_donations > 0 else 0

    overall = round((transparency * 0.4 + activity * 0.3 + diversity * 0.3) * 5, 1)

    # Get anomaly flags
    flags = sb.table("anomaly_flags").select("*").eq("ngo_id", ngo_id).eq("resolved", False).execute().data

    return {
        "ngo_id": ngo_id,
        "overall": overall,
        "transparency": round(transparency, 3),
        "activity": round(activity, 3),
        "donor_diversity": round(diversity, 3),
        "total_donations": total_donations,
        "unique_donors": unique_donors,
        "anomaly_flags": flags,
    }


def check_anomalies(ngo_id: str) -> list[dict]:
    """Run anomaly threshold checks for an NGO. Returns list of new flags created."""
    sb = get_supabase()
    new_flags = []

    transactions = sb.table("ngo_transactions").select("*").eq("ngo_id", ngo_id).execute().data

    if not transactions:
        return new_flags

    # Check: >70% of spending goes to a single destination
    destinations: dict[str, float] = {}
    total_spent = 0
    for tx in transactions:
        dest = tx["destination"]
        amt = float(tx["amount"])
        destinations[dest] = destinations.get(dest, 0) + amt
        total_spent += amt

    if total_spent > 0:
        for dest, amt in destinations.items():
            if amt / total_spent > 0.7:
                flag = _create_flag_if_new(sb, ngo_id, "single_destination", {
                    "destination": dest,
                    "percentage": round(amt / total_spent * 100, 1),
                })
                if flag:
                    new_flags.append(flag)

    # Check: dormant — has donations but no spending in 30 days
    donations = sb.table("donations").select("created_at").eq("ngo_id", ngo_id).eq("status", "tokens_issued").order("created_at", desc=True).limit(1).execute().data
    if donations and not transactions:
        flag = _create_flag_if_new(sb, ngo_id, "dormant", {
            "last_donation": donations[0]["created_at"],
            "total_transactions": 0,
        })
        if flag:
            new_flags.append(flag)

    return new_flags


def _create_flag_if_new(sb, ngo_id: str, flag_type: str, details: dict) -> dict | None:
    """Only create a flag if there isn't already an unresolved one of the same type."""
    existing = sb.table("anomaly_flags").select("id").eq("ngo_id", ngo_id).eq("flag_type", flag_type).eq("resolved", False).execute().data
    if existing:
        return None
    result = sb.table("anomaly_flags").insert({
        "ngo_id": ngo_id,
        "flag_type": flag_type,
        "details": details,
    }).execute()
    return result.data[0]
