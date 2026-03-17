# Donos — Claude Code Memory

## Project
- [project_donos.md](project_donos.md) — Full project context, architecture, and tooling choices

## Skills (read these before working in their domains)
- `skills/frontend-conventions.md` — Solarpunk design system, colors, fonts, components, tree spec
- `skills/donation-chain-implementation.md` — XRPL donation flow hard constraints and implementation rules

## Key Architecture Decisions
- **Monorepo**: `frontend/` (React + Vite + TS + Tailwind) and `backend/` (FastAPI + xrpl-py + uv)
- **4-account pipeline per NGO**: Donor → Treasury → Issuer → Distributor
- **Each NGO is its own DONO issuer** — the platform is NOT the issuer. DONO tokens from different NGOs are distinguished by issuer address.
- **Donations are RLUSD only** (stablecoin), not native XRP
- **Donors connect via Xaman wallet** — we do NOT create custodial wallets
- **Hackathon demo uses synchronous issuance**: frontend POSTs tx_hash → backend verifies on-chain → issues DONO tokens. No background scanner for the demo.
- **DB is Supabase** (project: fcaxacsccokwaayuiast), connected via MCP
- **Backend uses uv**, not pip. Run with `uv run`, not `python`.

## Frontend Rules
- Solarpunk aesthetic — warm canvas (#FAF6F1), botanical greens, Playfair Display + DM Sans
- Use shadcn/ui components, Lucide icons only
- ZERO blockchain jargon in the UI. No "trustline", "XRP Ledger", "IOU", "base reserve"
- Donor sees: donation receipt, verified, transparent, your impact, proof
- The tree is the centerpiece — see TREE_SPEC.md for full visual spec

## What NOT to Do
- Don't introduce a central/platform issuer model
- Don't use pip (use uv)
- Don't build an NGO admin dashboard (donor-side only for hackathon)
- Don't build a background scanner (synchronous verification for demo)
- Don't show blockchain complexity to the user
- Don't use Inter, Roboto, Arial, or dark mode