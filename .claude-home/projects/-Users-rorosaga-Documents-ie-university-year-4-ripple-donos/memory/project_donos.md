---
name: donos-project-context
description: Donos is an XRPL donation platform for the XRPL Commons Hackathon Challenge 4 — monorepo with React+Vite frontend and FastAPI backend
type: project
---

Donos is a transparent donation platform built on XRPL for the XRPL Commons Hackathon (Challenge 4).

**Architecture:** 4-account pipeline per NGO (Donor → Treasury → Issuer → Distributor). RLUSD stablecoin donations, DONO non-fractional receipt tokens. Each NGO is its own issuer.

## Frontend (React + Vite + TS + Tailwind v4, port 5173)

**Routes:**
- `/` — Landing page (sky hero, parallax clouds, flower vignette, bottom sheet)
- `/connect` — Wallet connection page
- `/app` — Main donor view: radial bloom diagram + NGO list (My NGOs / Explore tabs)
- `/profile` — Donor profile (score, stats, recent activity) — reached by clicking bloom center
- `/donate` — 4-step donation flow (Campaign → Authorize → Amount → Done)
- `/ngo/:id` — Full NGO page (hero, gallery, campaigns, river diagram, donations list, reputation)
- `/initiative/:id` — Initiative detail (hero image + personalized message)

**Design:** Ghibli-inspired solarpunk. IvyPresto Headline Light for titles, Inter for body. Liquid glass surfaces, dot grid background, pastel botanical palette. No emojis, no arrows in buttons, no blockchain jargon.

**Key components:** RadialBloom (SVG sunburst), RiverDiagram (SVG flow chart), ScoreBar, DetailPanel

## Backend (FastAPI + xrpl-py + uv, port 8000)

**Architecture:** Async DonationProcessor state machine + DonationPoller (30s). Config via env JSON.
**Endpoints:** GET/POST /ngos (list, detail, trustline, diagnostics, verification-guide, rating), GET/POST /donations (list, detail, by-payment, reprocess, donor tree)

## Supabase (project: fcaxacsccokwaayuiast)
Tables: ngos (with credibility_score, gallery_urls, campaigns), donors, donations (with state machine columns), ngo_transactions, anomaly_flags, proofs, campaigns, initiatives
Seeded with 5 NGOs, 7 campaigns, 11 initiatives with Unsplash images and personalized messages.
