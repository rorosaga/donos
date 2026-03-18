# Donos — Business Analysis

## Executive Summary

Donos is a transparent donation platform built on the XRP Ledger that solves the fundamental trust problem in charitable giving: donors cannot verify where their money goes. By leveraging XRPL trustlines and issued currencies, Donos creates an immutable, on-chain audit trail for every donation.

## The Problem

- $471 billion donated to charity annually in the US alone (Giving USA 2023)
- Only 32% of donors trust that their money reaches its intended purpose
- NGO fraud and mismanagement scandals erode public confidence
- Existing donation platforms offer no verifiable transparency
- Donors have no way to trace funds beyond the initial gift

## How Donos Solves It

### On-Chain Donation Receipts (DONO Tokens)
Every donation triggers the issuance of DONO tokens — non-fractional IOU tokens on XRPL that serve as immutable proof of contribution. Each NGO controls its own issuer account, making DONO tokens distinguishable by issuer address while sharing a common currency code.

### 4-Account Pipeline Architecture
- **Donor Wallet** — sends RLUSD/XRP donations via Xaman
- **NGO Treasury** — receives and holds donated funds on-chain
- **NGO Issuer** — mints DONO receipt tokens after validated payment detection
- **NGO Distributor** — delivers DONO tokens to the donor wallet

This separation of concerns ensures:
- Issuance only happens after validated on-chain payment
- Treasury funds remain auditable and untouched during the receipt flow
- Distribution can be retried independently of issuance
- Each step has its own transaction hash for verification

## Trust Metrics

### Credibility Score (0-100)
Each NGO receives a composite credibility score based on:

| Metric | Weight | Description |
|--------|--------|-------------|
| Transparency | 40% | Ratio of spending events with uploaded proof (receipts, photos) to total spending |
| Activity | 30% | Total completed donation count, normalized (capped at 50 donations = 100%) |
| Donor Diversity | 30% | Ratio of unique donors to total donations — higher diversity = more trust |

### Anomaly Detection
Automated flags trigger when:
- **High Outflow**: Treasury drained >80% within 24 hours
- **Single Destination**: >70% of spending goes to one address
- **Dormant**: Received donations but no spending activity in 30 days

NGOs must explain flagged behavior or face reduced credibility scores.

### On-Chain Trackable Metrics
- DONO tokens issued per NGO (verifiable on XRPL)
- Treasury balance (real-time via AccountInfo)
- Trustline count (proxy for donor engagement)
- Transaction history (full audit trail via AccountTx)
- Base reserve utilization (account reserve health)

## Fundraising Efficiency

### For NGOs
- **Zero-fee donations**: XRPL transaction costs are fractions of a cent (~0.000012 XRP)
- **Instant settlement**: No 3-5 business day bank processing
- **Dual currency support**: Accept both XRP and RLUSD stablecoins
- **Automated receipting**: DONO token issuance replaces manual receipt generation
- **Trust signaling**: High credibility scores attract more donors

### For Donors
- **3-click donation flow**: Select NGO → Enter amount → Confirm
- **Verifiable receipts**: DONO tokens are permanent on-chain proof
- **Fund traceability**: Follow every movement from wallet to final expenditure
- **No blockchain expertise required**: Xaman wallet handles all XRPL complexity
- **Cross-currency support**: Pay in XRP, NGO receives stablecoins (via XRPL pathfinding)

## Competitive Advantage

| Feature | Traditional Platforms | Donos |
|---------|----------------------|-------|
| Donation verification | Self-reported by NGO | On-chain, immutable |
| Fund traceability | None | Full tx-level tracking |
| Receipt authenticity | PDF/email (forgeable) | XRPL token (unforgeable) |
| Settlement time | 3-5 business days | 3-5 seconds |
| Transaction fees | 2-5% platform fee | ~0.000012 XRP |
| Cross-currency | Not supported | XRPL pathfinding |
| Anomaly detection | Manual audits | Automated on-chain |

## XRPL Concepts Demonstrated

### Trustlines
- Bidirectional agreements between donor and NGO issuer
- Prevent spam token delivery (donor must opt in)
- Each trustline requires 0.2 XRP owner reserve
- Enables per-NGO token issuance with shared currency code

### Issued Currencies (IOUs)
- DONO tokens are issued currencies distinguished by (currency_code, issuer_address)
- Non-fractional (integer amounts only)
- Issuer controls supply — mints only after validated treasury payment
- Different NGOs issue their own DONO — same code, different issuers

### Base Reserve
- Every XRPL account requires 1 XRP minimum balance (base reserve)
- Each trustline adds 0.2 XRP to the owner reserve requirement
- Platform displays reserve status in the Blockchain Details section
- Critical for user education about XRPL account costs

### Pathfinding
- XRPL's native pathfinding enables cross-currency payments
- Donor sends XRP → XRPL finds path → NGO receives RLUSD
- Demonstrated via POST /donations/pathfind endpoint
- Enables maximum donor flexibility without NGO-side complexity

## Future Roadmap

1. **NGO-specific impact tokens** — different token per campaign for granular tracking
2. **Milestone-based releases** — treasury funds released in tranches based on proof uploads
3. **Donor rewards** — DONO token accumulation unlocks event invitations, merch, recognition
4. **Multi-signature treasuries** — require board approval for large outflows
5. **Real-time notifications** — push alerts when NGOs deploy donated funds
6. **DAO governance** — top donors vote on flag resolutions
