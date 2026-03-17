---
name: donos-project-context
description: Donos is an XRPL donation platform for the XRPL Commons Hackathon Challenge 4 - monorepo with React+Vite frontend and FastAPI backend
type: project
---

Donos is a transparent donation platform built on XRPL for the XRPL Commons Hackathon (Challenge 4).

**Why:** Donors send stablecoin (RLUSD) donations to NGO treasuries and receive DONO tokens as on-chain proof-of-donation receipts. Each NGO issues its own DONO tokens through its own issuer account. The frontend has a solarpunk-aesthetic growing tree that visualizes cumulative donor impact. Blockchain complexity is fully abstracted from the user.

**How to apply:**
- Monorepo: `frontend/` (React + Vite + TS + Tailwind v4, port 5173) and `backend/` (FastAPI + xrpl-py + uv, port 8000)
- Architecture: 4-account pipeline per NGO (Donor, Treasury, Issuer, Distributor)
- Donors link their **Xaman wallet** — no custodial wallet creation on our side
- Donations are in **RLUSD stablecoin**, not native XRP
- Backend uses `uv` for dependency management, not pip
- Frontend follows solarpunk design conventions defined in `.claude/skills/frontend-conventions.md`
- DB is **Supabase** (project ID: fcaxacsccokwaayuiast), connected via MCP
- For hackathon demo: synchronous token issuance (frontend POSTs tx_hash, backend verifies + issues), NOT background scanner

## Backend Status (COMPLETE as of 2026-03-17)
All backend endpoints are implemented and wired:
- **NGOs**: POST /ngos/, GET /ngos/, GET /ngos/{id}, GET /ngos/{id}/transactions, GET /ngos/{id}/rating, POST /ngos/{id}/proofs
- **Donations**: POST /donations/ (verify tx + issue DONO synchronously), GET /donations/, GET /donations/{id}, GET /donations/donor/{address}/tree
- **Donors**: POST /donors/, GET /donors/{id}
- Services: supabase.py, xrpl/ (client, accounts, tokens, transactions), ngo_service, donation_service, rating_service
- Supabase tables: ngos, donors, donations, ngo_transactions, anomaly_flags, proofs (all with seeds columns for XRPL wallets)

## Frontend Status (IN PROGRESS as of 2026-03-17)
Pages exist with **mock data only** — no API integration yet:
- **Home.tsx**: Landing page with hero, stats, features, how-it-works, CTAs
- **Donate.tsx**: 4-step flow (NGO select → trustline → amount → success) — all mock
- **Dashboard.tsx**: SVG impact tree with branch/leaf rendering, donation tracking, filters
- **NGOProfile.tsx**: Reputation dashboard (5-component score, flags, transactions, proof upload)
- **Navbar.tsx**: Sticky glass nav with hardcoded wallet address
- **index.css**: Custom design system (glass, buttons, badges, fonts) — uses Tailwind v4 zero-config
- Uses heavy inline styles; needs refactoring to match skill conventions (liquid glass, dot grid, sky bg)

## Key Frontend Gaps
1. API integration — replace all mock data with backend calls
2. Xaman wallet connection — currently hardcoded address
3. Design polish — align with liquid glass + dot grid + sky background conventions
4. Tree endpoint integration — GET /donations/donor/{address}/tree is the key endpoint
5. Donation flow needs to actually send RLUSD via Xaman, then POST tx_hash to backend
