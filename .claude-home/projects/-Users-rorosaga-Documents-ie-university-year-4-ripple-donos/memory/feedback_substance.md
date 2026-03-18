---
name: substance-over-features
description: User wants to stop building new features and focus on real testnet data, blockchain details for judges, and visual bug fixes
type: feedback
---

STOP building new features. Focus on substance:

1. **Real XRPL testnet data** — all seed data must have real tx hashes that link to testnet.xrpl.org. Fund accounts via faucet, get RLUSD from tryrlusd.com, create real trustlines, issue real DONO tokens.

2. **Blockchain Details section on NGO page** — show trustline, DONO issuance tx, treasury address/balance, issuer address, base reserve info. Judges need to see we understand IOUs, trustlines, token issuance.

3. **Visual bugs** — NGO title invisible on white bg, radial diagram not centered, clicking segments doesn't update detail panel, transaction links invalid, vary NGO data beyond Africa.

4. **Challenge requirements still missing:**
   - PATHFINDING: demo endpoint showing cross-currency payment (XRP → RLUSD/DONO) using ripple_path_find
   - DUAL PAYMENT: donate flow supports both XRP and RLUSD
   - BASE RESERVE: show account reserve info (1 XRP base, 0.2 XRP per trustline)

5. **Wallet connection** — must actually connect to Xaman on testnet, not just show an alert. Need real wallet linking and logout.

**Why:** The hackathon judges are blockchain experts. They need to verify real on-chain activity. Mock tx hashes that lead to "invalid" pages will lose points.

**How to apply:** Every tx hash in the UI must be a real testnet transaction. Every address must be a real funded account. The blockchain details section proves we understand the XRPL architecture.
