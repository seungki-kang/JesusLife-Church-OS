# Church OS Repository Structure Guide 2.0

## Scope

This repository holds Church OS only. CHGO engine logic and its approved ontology belong to the independent CHGO product. Academy courses and educational interfaces belong to the independent JesusLife Academy product; this repository retains only ChurchOS-side integration contracts. Life Diary content belongs in `CHGO-Life-Diary-Flutter`. The six user products share an account/SSO direction, with separate product use, church membership and personal sharing permissions. The actual common identity provider remains unverified in this repository. JesusLife One is an internal ecosystem name, not a user-facing app or an implemented identity service.

## Current entry points

Start with [current design guidance](START_RECOVERY_CURRENT.md). [canonical v2.6](canonical/ChurchOS_Canonical_v2.6/README.md) preserves the implementation snapshot; [operations](docs/operations/ecosystem-v1/DETAILED_DESIGN_V1.5.md) and scoped decisions govern later requirements. [Recovery design](recovery-design/README.md) preserves source limitations and follow-up contracts.

## Layout

| Path | Purpose |
| --- | --- |
| `docs/product`, `docs/ux` | Church OS requirements, experience architecture, UX and information architecture |
| `docs/architecture` | White-label and headless architecture; contracts with other products (Church OS side) |
| `docs/adr`, `docs/decisions` | Earlier ADRs and current COS decisions; scoped REC decisions are in recovery-design |
| `docs/privacy-security` | Privacy policy (C-02) and tenant boundaries |
| `docs/governance` | Gate reports, audits, carry-forward matrix, split record |
| `docs/handoff` | Developer handoff packages, including the B-02 PostgreSQL execution pack used by CI |
| `docs/operations` | E5 runtime and rollback runbooks |
| `db` | Earlier migration lineage and validation. Do not merge it with canonical v2.6 migrations without a separately verified forward migration |
| `api` | Earlier OpenAPI v2 and compatibility records. Current implementation must be compared with canonical v2.6 and its actual routes |
| `apps` | Flutter church app; admin-console is an inactive historical reservation. Church administrators use the mobile app |
| `services` | Reserved service boundaries, not running services. Actual church-core implementation is under canonical v2.6 |
| `packages` | Shared types and UI components |
| `localization` | Locales, glossary and regional privacy overlays |
| `tests` | Contract, integration, security, acceptance, regression and database tests |
| `infrastructure`, `.github` | CI, deployment, environments and observability |
| `changes`, `releases`, `feature-flags` | Change objects, release manifests, rollback registers and rollout flags |
| `tools`, `scripts` | Validators and CI helpers |
| `backlog` | Church OS implementation backlog |
| `evidence` | Actual execution evidence only |

## Rules

- Church OS never reads another product's database. It connects through versioned APIs and events.
- Church administrators may access authorized operational records. Cross-product spiritual data is not a per-person administrator view; no spiritual scores, ranks or access to private diary/prayer records is implied.
- Church membership never implies consent and never grants access to a member's diary.
- Raw diary, prayer or counseling text is never written to general logs, events, analytics or evidence.
- Candidate is not evidence and NOT_RUN is not PASS.
- Applied migrations are immutable; use forward migrations.
- Do not commit secrets, `.pytest_cache`, `__pycache__` or `.pyc` files.
