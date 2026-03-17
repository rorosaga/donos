---
name: donos-project-context
description: Donos is an XRPL donation platform for the XRPL Commons Hackathon Challenge 4 — monorepo with React+Vite frontend and FastAPI backend
type: project
---

Donos is a transparent donation platform built on XRPL for the XRPL Commons Hackathon (Challenge 4).

**Why:** Donors send RLUSD stablecoin donations to NGO treasuries and receive DONO tokens as on-chain proof-of-donation receipts. Each NGO issues its own DONO tokens through its own issuer account. The frontend has a solarpunk-aesthetic growing tree that visualizes cumulative donor impact.

**How to apply:**
- Monorepo: `frontend/` (React + Vite + TS + Tailwind v4, port 5173) and `backend/` (FastAPI + xrpl-py + uv, port 8000)
- Architecture: 4-account pipeline per NGO (Donor → Treasury → Issuer → Distributor)
- Canonical architecture doc: `docs/architecture/donation-infrastructure.md`
- Donors link their **Xaman wallet** — no custodial wallet creation
- Donations are **RLUSD stablecoin** only, DONO is non-fractional
- Backend uses `uv`, not pip

## Backend Status (as of 2026-03-17)
**Core async architecture implemented by teammate:**
- `DonationProcessor` — state machine (DETECTED → PENDING_TRUSTLINE → READY_TO_ISSUE → ISSUED_TO_DISTRIBUTOR → SENT_TO_DONOR)
- `DonationPoller` — background asyncio task scanning treasuries every 30s
- `XRPLPyService` — async client for treasury detection, trustline checks, issuance & distribution
- `NGORepository` / `DonationRepository` — **in-memory only, no Supabase persistence yet**
- Config via env: `NGO_CHAIN_PROFILES_JSON`, `XRPL_NETWORK_URL`, `RLUSD_ISSUER`
- Routers: GET/POST /ngos (list, detail, trustline prepare/verify), GET/POST /donations (list, detail, reprocess)
- **main.py has duplicate router imports** (old + new) — needs cleanup
- Legacy code exists: `donation_service.py`, `ngo_service.py`, `rating_service.py`, `supabase.py` — not wired to new arch

**Missing:** Supabase persistence, /donor/{address}/tree endpoint, /rating endpoint, main.py cleanup

## Frontend Status (as of 2026-03-17)
**User wants full rebuild** — current pages have wrong aesthetic and use inline styles:
- 4 pages exist with mock data (Home, Donate 4-step, Dashboard SVG tree, NGOProfile)
- No API integration, no Xaman wallet, no real data
- Design needs to match Ghibli-inspired solarpunk (vivid sky, lush greens, painterly clouds)
- See `feedback_aesthetic.md` for visual reference

## DB: Supabase (project ID: fcaxacsccokwaayuiast)
Tables: ngos, donors, donations, ngo_transactions, anomaly_flags, proofs
Donations table needs new columns for processing state machine fields.
