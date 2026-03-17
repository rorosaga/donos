# NGO Donation Infrastructure Blueprint

## Summary

This document defines the v1 XRPL donation infrastructure for Donos. It covers only the chain and chain-adjacent operational flow for NGO donation intake, NGO-issued proof-of-donation tokens, and donor distribution.

The platform accepts `RLUSD` donations and issues `DONO` as a non-fractional receipt token. Each NGO controls its own XRPL account set and self-issues its own `DONO` asset.

## Core Model

### Scope

This blueprint covers:

- NGO-owned XRPL accounts and their roles
- `RLUSD` donation intake
- `DONO` issuance and transfer flow
- Trustline prerequisites for donor receipt
- Pending and retry states needed for distribution

This blueprint does not cover:

- Frontend UX
- Fiat rails or off-chain treasury settlement
- Advanced production custody controls beyond a short hardening section

### Asset Model

- Donation asset: `RLUSD`
- Receipt asset: `DONO`
- `DONO` identity on XRPL is `(currency_code = DONO, issuer_address = NGO issuer)`
- Different NGOs use the same currency code but different issuer addresses
- `DONO` is non-fractional

### NGO Ownership Model

Each NGO owns and controls all three operational accounts:

1. `treasury`
2. `issuer`
3. `distributor`

The platform coordinates the flow but does not act as the issuer.

## Account Topology

### Treasury

- Receives incoming `RLUSD` donations
- Holds donated stablecoin in v1
- Serves as the on-chain source of truth for donation intake
- Does not issue `DONO`

### Issuer

- Is owned by the NGO
- Is the official XRPL issuer for that NGO's `DONO`
- Mints `DONO` only after an eligible treasury payment is confirmed
- Sends newly issued `DONO` to the NGO distributor

### Distributor

- Is owned by the NGO
- Receives issued `DONO` from the NGO issuer
- Sends `DONO` to donor wallets
- Separates issuance from end-user delivery and retry handling

### Donor Wallet

- Is an external XRPL wallet connected by the donor
- Sends `RLUSD` to the NGO treasury
- Must create a trustline to the NGO issuer's `DONO` before it can receive tokens

## Configuration Model

Each NGO must have a chain profile with at least:

- `ngo_id`
- `treasury_address`
- `issuer_address`
- `distributor_address`
- `donation_asset = RLUSD`
- `dono_currency_code = DONO`
- `dono_rate`

### Conversion Rate

`dono_rate` is configured per NGO through environment or equivalent deployment config.

The v1 conversion rule is:

`DONO_to_issue = floor(RLUSD_amount * dono_rate)`

Rules:

- Result must be an integer
- Fractional `DONO` is never issued
- If the computed value is `0`, no `DONO` is distributed for that donation
- The applied rate must be captured with the donation record at issuance time so later config changes do not alter historical results

## Trustline Model

The platform may orchestrate trustline setup, but it cannot create the trustline unilaterally for an existing donor wallet.

The required flow is:

1. Donor connects an XRPL wallet
2. Platform checks whether a trustline already exists for `(DONO, NGO issuer)`
3. If missing, the platform prepares the `TrustSet` transaction
4. The donor signs the transaction in their own wallet
5. After validation, the donor becomes eligible to receive that NGO's `DONO`

Implications:

- Trustlines are per NGO issuer
- A donor may need separate trustlines for different NGOs
- Missing trustline blocks distribution, not donation intake

## Donation And Distribution Flow

### Happy Path

1. Donor connects wallet
2. Donor has an existing trustline or creates one through a wallet-signed `TrustSet`
3. Donor sends `RLUSD` to the NGO treasury
4. The system observes the treasury payment in a validated ledger
5. The payment is recorded as a unique donation event
6. `DONO_to_issue` is computed from the NGO-specific configured rate
7. The NGO issuer issues that `DONO` amount to the NGO distributor
8. The NGO distributor sends that `DONO` amount to the donor wallet
9. The donation is marked fully distributed

### Missing Trustline Path

1. Donor sends `RLUSD` to the NGO treasury without a valid trustline
2. The donation is still accepted and recorded after validated payment detection
3. The donation enters `pending_trustline`
4. Once the donor establishes the trustline for that NGO issuer, the donation becomes eligible for issuance and distribution
5. Issuance and transfer resume without requiring a second donation

### Treasury Funds

In v1, the donated `RLUSD` remains in the treasury. The infrastructure does not automatically move treasury funds to any other account as part of the receipt-token flow.

## Processing States

Each donation should move through an explicit processing state model:

- `detected`
- `pending_trustline`
- `ready_to_issue`
- `issued_to_distributor`
- `sent_to_donor`
- `failed`

Suggested behavior:

- `detected`: qualifying treasury payment found in a validated ledger
- `pending_trustline`: donor cannot yet receive `(DONO, NGO issuer)`
- `ready_to_issue`: trustline present and donation eligible for issuance
- `issued_to_distributor`: issuer transfer completed
- `sent_to_donor`: distributor transfer completed
- `failed`: unrecoverable processing error that requires operator review

## Invariants

The implementation must preserve these rules:

- Only `RLUSD` treasury payments are eligible for v1 `DONO` issuance
- A donation is eligible only after it appears in a validated ledger
- The same validated treasury payment must never mint twice
- `DONO` issuance is determined by the NGO-specific rate in effect when the donation is processed
- `DONO` is never fractional
- `RLUSD` custody remains in treasury in v1
- The issuer never receives the donation payment itself
- Missing trustline delays distribution but does not invalidate the donation

## Failure Modes

### Unsupported Asset

- If a treasury payment is not `RLUSD`, it must not trigger `DONO` issuance
- The event may be logged for review, but it is not a qualifying donation in this architecture

### Duplicate Detection

- Repeated observation of the same validated treasury payment must resolve to the same donation record
- Reprocessing must be idempotent

### Zero-Issuance Result

- If `floor(RLUSD_amount * dono_rate) = 0`, the donation should be recorded but no `DONO` should be minted
- This case should be explicit in implementation so it does not oscillate between pending and failed

### Issuer Transfer Failure

- If issuance to distributor fails, the donation must remain recoverable without creating a second donation event
- Retry logic must not produce duplicate minting

### Distributor Transfer Failure

- If issuer-to-distributor succeeds but distributor-to-donor fails, the donation should remain recoverable from the distributor state
- Retry must continue from distribution, not from issuance

### Missing Trustline At Receipt Time

- The donation remains pending until the donor establishes the trustline
- Trustline completion should unlock distribution for the original donation event

## Minimal Data Requirements

The architecture assumes the system can persist:

- NGO chain profile and addresses
- Unique validated treasury payment reference
- donor wallet address
- `RLUSD` donation amount
- NGO-specific `dono_rate` used for computation
- computed integer `DONO` amount
- current donation processing state
- issuance and distribution transaction references

## Future Hardening

These are not part of the main v1 flow but should be considered later:

- multisig or stronger signer policy for treasury, issuer, and distributor
- operational key rotation
- stricter issuer controls and authorization policies where appropriate
- treasury outflow rules and approval flow
- reconciliation and monitoring for stuck pending donations

## Acceptance Scenarios

The architecture should support these scenarios cleanly:

1. Donor with trustline donates `RLUSD` and receives integer `DONO`
2. Donor without trustline donates `RLUSD` and remains `pending_trustline`
3. Donor later creates the trustline and receives the original pending `DONO`
4. The same treasury payment is observed multiple times but only one issuance path exists
5. A non-`RLUSD` treasury payment is ignored by issuance logic
6. A donation amount that would produce a fractional result uses the floor-based integer result only
7. Distributor delivery fails after issuance and can be retried without re-issuing
