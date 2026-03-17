# Donos Donation Chain Implementation Skill

Use this skill for any task that touches the XRPL donation flow for Donos, including treasury payment detection, trustline handling, NGO issuer and distributor logic, `DONO` issuance, or donor distribution.

This skill covers the chain implementation slice only. It may guide backend orchestration for this flow, but it does not govern frontend UX, styling, or unrelated XRPL work.

## Required First Step

Before designing or changing this flow, read:

- `docs/architecture/donation-infrastructure.md`

Treat that architecture document as the canonical source of truth for this slice.

## Hard Constraints

Do not deviate from these rules unless the user explicitly approves an architecture change:

- Each NGO owns and controls its own `treasury`, `issuer`, and `distributor` accounts.
- The NGO is the issuer. The platform is not the issuer.
- `DONO` uses the shared currency code `DONO`, and each NGO token is distinguished by issuer address.
- v1 donation intake is `RLUSD` only.
- `DONO` is non-fractional.
- `DONO` issuance happens only after a qualifying treasury payment is observed in a validated ledger.
- If the donor does not have the required trustline, the donation stays pending for later distribution.
- Treasury funds remain in the treasury in v1 and are not automatically moved as part of the receipt-token flow.
- Issuance and distribution must be idempotent per validated donation event.

If implementation work conflicts with any of these rules, stop and ask the user before proceeding.

## Implementation Guidance

When working in this slice:

- Start from the on-chain flow, then map it into backend state and service boundaries.
- Preserve the explicit donation state progression defined in the architecture.
- Keep issuance separate from donor delivery so distributor retries do not imply re-issuance.
- Capture the NGO-specific `dono_rate` used at processing time so historical donations remain stable if config changes later.
- Treat missing trustline, duplicate event detection, unsupported asset, and partial processing failure as first-class cases, not edge notes.
- Prefer behavior that makes replay safe and recovery explicit.

## Code Anchors

Inspect these areas first when the skill triggers:

- `docs/architecture/donation-infrastructure.md`
- `backend/app/routers/`
- `backend/app/services/xrpl/`
- any donation, NGO, schema, or model code related to the validated treasury-payment flow

If the backend implementation is still sparse, keep new work aligned to the architecture instead of inventing a competing flow.

## What To Avoid

- Do not introduce a central issuer model.
- Do not treat `DONO` as interchangeable across NGOs without considering issuer address.
- Do not issue on unvalidated or ambiguous treasury activity.
- Do not require a second donation when trustline setup happens after payment.
- Do not fold treasury custody movement into the receipt-token flow unless the user changes the architecture.
