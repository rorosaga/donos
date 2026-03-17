---
name: donos-project-context
description: Donos is an XRPL donation platform for the XRPL Commons Hackathon Challenge 4 — monorepo with React+Vite frontend and FastAPI backend
type: project
---

Donos is a transparent donation platform built on XRPL for the XRPL Commons Hackathon (Challenge 4).

**Why:** Donors send XRP to NGO treasuries and receive DONO tokens as on-chain proof-of-donation receipts. The frontend has a solarpunk-aesthetic growing tree that visualizes cumulative donor impact. Blockchain complexity is fully abstracted from the user.

**How to apply:**
- Monorepo: `frontend/` (React + Vite + TS + Tailwind, port 5173) and `backend/` (FastAPI + xrpl-py + uv, port 8000)
- Architecture: 3-account pipeline per NGO (Issuer, Treasury, Backend scanner)
- Backend uses `uv` for dependency management, not pip
- Frontend follows solarpunk design conventions defined in `.claude/skills/frontend-conventions.md`
