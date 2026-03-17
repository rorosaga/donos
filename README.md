# donos

Solarpunk donation platform. Transparent giving on XRPL, where donors donate in stablecoins and watch impact grow without touching a wallet.

Built for the **XRPL Commons Hackathon - Challenge 4**.

## Architecture

Donors send `RLUSD` donations to NGO treasuries and receive NGO-issued `DONO` tokens as on-chain proof-of-donation receipts. Each NGO owns its own treasury, issuer, and distributor accounts, while a backend scanner watches treasury activity and triggers issuance after validated payments.

1. **Donor** - sends stablecoin donations
2. **Treasury** - the NGO-owned account that receives and stores incoming `RLUSD` donations
3. **Issuer** - the NGO-owned issuing account that mints that NGO's `DONO` tokens
4. **Distributor** - the NGO-owned account that receives issued `DONO` and distributes it to donors

The canonical v1 chain architecture is documented in `docs/architecture/donation-infrastructure.md`.

## Project Structure

```text
donos/
|- frontend/   # React + Vite + TypeScript + Tailwind
`- backend/    # Python FastAPI + xrpl-py
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev        # -> http://localhost:5173
```

### Backend

```bash
cd backend
python -m pip install -e .
python -m app.main   # -> http://localhost:8000
```

Copy `.env.example` to `.env` before running:

```bash
cp backend/.env.example backend/.env
```

Replace the placeholder values in `backend/.env` before starting the API. In particular, `RLUSD_ISSUER` and every NGO address/seed in `NGO_CHAIN_PROFILES_JSON` must be real XRPL testnet values.

### XRPL Testnet Operator Flow

Preflight a configured NGO account set:

```bash
cd backend
python -m app.cli preflight --ngo-id wateraid
```

Print the manual verification guide for a donor wallet:

```bash
cd backend
python -m app.cli verification-guide --ngo-id wateraid --donor-wallet-address rDonorAddress --rlusd-amount 5
```

Read-only operator diagnostics are also available over HTTP:

- `GET /ngos/{ngo_id}/diagnostics`
- `POST /ngos/{ngo_id}/verification-guide`

Happy-path live verification:

1. Run preflight and confirm all configured NGO accounts exist and seeds match.
2. Call `/ngos/{ngo_id}/verification-guide` or the CLI command and submit the returned `TrustSet` transaction with the donor wallet.
3. Send `RLUSD` from the donor wallet to the NGO treasury.
4. Wait for the poller or call `POST /donations/reprocess`.
5. Confirm the donation reaches `sent_to_donor` via `GET /donations/by-payment/{payment_reference}`.

## Tech Stack

| Layer    | Stack                                 |
|----------|---------------------------------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend  | FastAPI, Pydantic, uvicorn            |
| Chain    | XRPL (xrpl-py), Testnet               |
