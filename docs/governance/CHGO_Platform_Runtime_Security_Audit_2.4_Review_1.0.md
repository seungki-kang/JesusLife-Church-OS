# CHGO Platform Runtime and Security Audit 2.4 — Review 1.0

Review date: 2026-10-17  
Reviewed document: [`CHGO_Platform_Runtime_Security_Audit_2.4.md`](CHGO_Platform_Runtime_Security_Audit_2.4.md) (kept verbatim, SHA-256 `cdbf81cee975c3aabe3ee0e1d3a1c60390b39f8834dec42f703e79e39b0afe7b`)  
Repository state at review: `main` = `9eda66f`; open [PR #1](https://github.com/seungki-kang/JesusLife-Church-OS/pull/1) = `fix/b02-e5-ci-runtime` (`3affddf`, `d284f5a`). This repository was then named `CHGO-Platform`. It was renamed `JesusLife-Church-OS` on 2026-10-17, and the old name now belongs to a different repository, so the link uses the current name.  
Canonical/Governance meaning changes: none  
Decision: **Audit 2.4 is accepted as a remediation plan, not as closure evidence.**

## 1. Summary

Audit 2.4 identifies the same defect classes found in independent review and proposes sound corrections for most of them. Its "Corrected defects" section, however, describes a patch that is not in this repository:

- `main` is still the audited baseline `9eda66f`. No commit after it implements Audit 2.4.
- Files the audit names as added do not exist on `main`: `tools/validation/validate_b02_pack.py`, `tests/ci/`, `.gitattributes`.
- Every listed verification command is a static check. The highest-risk changes (FORCE RLS, cross-tenant constraint triggers, application-role grants, Vault owner RLS) are runtime behaviors and have no runtime evidence. Audit 2.4 itself lists PostgreSQL 16 execution as an open item.

Accordingly, each item below carries one of these states:

| State | Meaning |
| --- | --- |
| **VERIFIED (PR #1)** | Implemented in PR #1 and executed on PostgreSQL 16.15 |
| **PARTIAL (PR #1)** | Part of the item is implemented and executed in PR #1; the rest is not in the repository |
| **PLANNED** | Not in the repository; not executed |
| **PLANNED — RISK** | Not in the repository, and review found a defect or conflict in the described approach (Section 4) |
| **REJECTED** | Not adopted by owner decision (Section 5) |

## 2. Status of "Corrected defects"

Items are numbered in the order they appear in Audit 2.4.

| # | Audit 2.4 item | State | Notes |
| --- | --- | --- | --- |
| C-01 | V002 case-insensitive unique index | **VERIFIED (PR #1)** | Duplicate hostname differing only in case is rejected |
| C-02 | B-02 shell scripts executable; preflight via `bash` | **VERIFIED (PR #1)** | Baseline failed with exit 126 |
| C-03 | Runners no longer query rolled-back `church_os_test.test_result` | **VERIFIED (PR #1)** | `.sh` executed; `.ps1` edited, not executed (no PowerShell) |
| C-04 | E5 evidence: exactly 12 PASS plus independent rollback log proof | **PARTIAL (PR #1)** | PR #1 judges each test and judges rollback only by PHY-T12. "Exactly 12" and log proof are stricter and not yet implemented |
| C-05 | System roles `UNIQUE NULLS NOT DISTINCT`; system/tenant consistency constraint | **PARTIAL (PR #1)** | Uniqueness verified. Consistency constraint not implemented |
| C-06 | FORCE RLS on tenant tables; system-role read exception separated from write policy | **PARTIAL (PR #1) / RISK** | Policy split verified. FORCE RLS breaks non-superuser migration and backup (R-01) |
| C-07 | Application role: schema usage and DML on RLS tables only | **PLANNED — RISK** | R-05 |
| C-08 | Cross-tenant reference constraint triggers, including V010 FKs | PLANNED | Defect confirmed in review; correction not present |
| C-09 | `updated_at`/`row_version` triggers attached | PLANNED | Defect confirmed (no trigger attached in baseline) |
| C-10 | Outboxes reject Life Diary `narrative` | PLANNED | Defect confirmed (`narrative` payload accepted in baseline) |
| C-11 | Forced owner RLS on Vault version/grant/job tables; grant expiry mandatory | PLANNED | Defect confirmed |
| C-12 | Missing-safe `current_setting(..., true)` | PLANNED | |
| C-13 | Life Diary deleted sessions replaceable via partial active-session unique index | **REJECTED** (LD-P1) | Conflicted with Flutter LD-FL-024 (R-02); application policy kept |
| C-14 | Life Diary RESTORED event and UI draft persistence | PLANNED | Matches Flutter DB v2/v3 |
| C-15 | Separate payload/privacy-class columns for narrative and selections | **REJECTED** (LD-P1) | Would diverge from the Flutter storage schema (R-03) |
| C-16 | Flutter-shaped fixture validated, including empty Q6 `why` | PLANNED — **accepted by LD-P1** | Owner decided the contract follows the application (R-04) |
| C-17 | Canonical UI labels carried by ID in the Flutter projection | PLANNED | |
| C-18 | Delta OpenAPI unique `operationId` values | PLANNED | All 20 Delta operations lack `operationId` on `main` |
| C-19 | Shared identity contract: bearer security, request bodies, grant fields | PLANNED | |
| C-20 | Structure validators use latest manifest and permit `.github` | PLANNED | |
| C-21 | R6 tests no longer depend on `/mnt/data` | PLANNED | 4 R6 tests fail on `main` for this reason |
| C-22 | Argument-taking scripts print usage instead of `IndexError` | PLANNED | |
| C-23 | `.gitattributes` makes LF/CRLF explicit | PLANNED | All 77 manifest 2.2 hash mismatches are explained by CRLF→LF |

Audit 2.4 "Additional defects found during remediation" A-1 to A-6 are design findings and are agreed. A-1 is incomplete without R-05.

## 3. Runtime evidence for VERIFIED items

Environment: PostgreSQL 16.15. Each `run:` step of `.github/workflows/e5-postgresql-runtime.yml` was extracted and executed the way GitHub Actions runs it (`bash --noprofile --norc -eo pipefail`).

| Workflow step | `main` (`9eda66f`) | PR #1 |
| --- | --- | --- |
| Execute B-02 migrations and replay | FAIL (exit 126, `preflight.sh` not executable) | PASS |
| Execute dump drop recreate restore | skipped | PASS |
| Verify restored database (PHY-T01–T12) | skipped | PASS, 12/12 |

Fault injection on the evidence collector:

| Injected state | Baseline collector | PR #1 collector |
| --- | --- | --- |
| PHY-T05 = FAIL | runtime PASS | runtime FAIL_OR_INCOMPLETE |
| PHY-T12 = PENDING | rollback PASS | rollback FAIL_OR_INCOMPLETE |

System-role and RLS probe, executed as a non-owner role so that RLS applies:

- V009 executed three times leaves exactly 6 system roles. A duplicate system role code is rejected.
- A tenant session sees all 6 system roles and only its own tenant roles.
- Tenant UPDATE, re-assignment, and DELETE of system roles affect 0 rows. Creating a system role or another tenant's role is rejected by RLS.
- A tenant can insert, update, and delete its own roles.

## 4. Risks and conflicts in the described approach

### R-01 FORCE RLS breaks seeding and backup under a non-superuser owner (C-06) — verified

Reproduced on PostgreSQL 16.15 using the V004/V008/V009 structure with the Audit 2.4 policies and `FORCE ROW LEVEL SECURITY`:

| Executing account | V009 system-role seed | `pg_dump` (first step of the E5 restore fixture) |
| --- | --- | --- |
| Superuser (as in the E5 CI job) | succeeds | succeeds |
| Non-superuser schema owner (recommended for production) | **fails**: `new row violates row-level security policy` | **fails**: exit 1, `COPY` refused by the policy |

FORCE applies policies to the table owner, so system roles (`tenant_id` NULL) cannot be inserted and dumps are refused. Superusers bypass RLS, so the E5 job cannot detect this.

Required before FORCE is adopted:
- Run seeds and backups under a dedicated migration role with `BYPASSRLS`, or a reviewed equivalent.
- Add a non-superuser execution step to E5.

### R-02 Deleted-session policy conflicts with the Flutter application (C-13)

Audit 2.4 makes a deleted session number reusable through a partial unique index over active entries. Flutter LD-FL-024 ([Flutter PR #1](https://github.com/seungki-kang/CHGO-Life-Diary-Flutter/pull/1)) takes the opposite approach: deleted entries keep their number, so a tombstoned diary stays restorable.

Under the Audit 2.4 approach, restoring a deleted session whose number has been reused violates the partial index, and the restore fails. One policy must be chosen for both repositories. This review recommends number retention, because it guarantees restore.

### R-03 Contract and application storage diverge (C-15)

The contract would drop `payload_json` and `privacy_class` in favor of split columns. The Flutter application's SQLite schema (`lib/data/life_diary_database.dart`, version 3) still uses the combined columns, and no Flutter migration is planned.

"Contract validated" would then describe a schema that the application does not use. A Flutter database v4 migration that converts existing rows must be planned with C-15 and released together with it.

### R-04 Empty Q6 `why` requires a Canonical decision (C-16)

The runtime schema currently requires a non-empty `why` (`minLength: 1`). The Canonical register defines Q6 as recording to whom, what, and why the user is thankful. Relaxing the schema to accept the application's empty `why` is a meaning-level change, not a runtime-only change.

The Canonical owner must decide one of the following:
- Relax the contract.
- Have the application capture `why` separately.

### R-05 Application role cannot reach identity and tenant tables (C-07, A-1)

Limiting application-role DML to RLS-protected tables is the safe choice. As a consequence, the role cannot read `church_identity` or `church_tenant` tables, so sign-in and membership flows cannot run through it. A separately scoped service role for identity and tenant operations still needs to be designed. Until then, C-07 is a partial control, not a completed correction.

### R-06 Overlap with PR #1

C-01 to C-06 modify the same files and lines as PR #1. Both start from `9eda66f`, so applying them independently will conflict. Merge PR #1 first, then rebase the Audit 2.4 patch onto it.

## 5. Decisions

| ID | Decision | Owner | Blocks | Status |
| --- | --- | --- | --- | --- |
| D-1 | Deleted Life Diary sessions: retain number or allow reuse | Product + Life Diary engineering | C-13, Flutter LD-FL-024 | **DECIDED** (LD-P1): retain number, as the application does |
| D-2 | Q6 `why`: relax contract or require capture in the application | Canonical governance | C-16 | **DECIDED** (LD-P1): follow the application; the contract accepts an empty `why` |
| D-3 | Migration and backup role design under FORCE RLS | Platform engineering + security | C-06 | OPEN |
| D-4 | Service role for identity and tenant tables | Platform engineering + security | C-07 | OPEN |
| D-5 | Flutter database v4 migration plan for split payload columns | Life Diary engineering | C-15 | **DECIDED** (LD-P1): no split; the contract keeps the application's storage. No Flutter v4 migration is required for this item |
| D-6 | Merge order: PR #1 first, then rebase Audit 2.4 | Repository owner | C-01–C-06 | **DECIDED**: PR #1 merged first |

### LD-P1 Life Diary follows the application (owner decision, 2026-10-17)

The repository owner has reviewed the Flutter Life Diary application in full and decided:

> The Life Diary contract follows the application. Where the platform contract and the application differ, the application is the source of truth.

Consequences:

- **Source of truth.** For Life Diary, the order is: application → platform contract (`ontology/schemas/life-diary-runtime-schema-v1.json`, `ontology/projections/life-diary-flutter-mapping-v1.json`, `db/migrations/life_diary/`) → validators. The platform artifacts are aligned to the application, not the reverse.
- **C-13 is rejected.** Deleted sessions keep their number and remain restorable, as implemented in the application by LD-FL-024. The partial active-session unique index is not adopted. R-02 is closed.
- **C-15 is rejected.** The application's combined `payload_json` and `privacy_class` storage is kept. R-03 is closed.
- **C-16 is accepted in the application's form.** The contract accepts the application's Q6 records, including an empty `why`. R-04 is closed by owner decision.
- **C-14 and C-17 are retained.** The RESTORED event, UI draft persistence, and ID-carried UI labels already match the application.
- **Follow-up.** Aligning the platform Life Diary artifacts to the application is a design task. It is not part of this review and no code is changed here.

This decision does not change Canonical wording. It records that the runtime contract follows the application as reviewed by the owner.

## 6. Closure conditions for Audit 2.4

Audit 2.4 may be marked closed only when all of the following hold:

1. The Audit 2.4 patch is committed to this repository on top of PR #1.
2. The E5 job passes on that commit, including a non-superuser execution step (R-01).
3. Cross-tenant negative tests run as a non-owner role and their output is attached as evidence (C-08).
4. D-3 and D-4 are recorded as decisions. (D-1, D-2, D-5 and D-6 are decided in Section 5.)
5. The open items listed in Audit 2.4 itself remain open until their own evidence exists.

This review does not change Audit 2.4, Canonical wording, or Governance meaning.
