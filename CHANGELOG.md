# CHANGELOG

## Unreleased - 2026-11-11

- S00: derived the single active backend `services/church-core` once from canonical v2.6 (server, tests, integration verifier, V001–V015 migrations, OpenAPI). Source hashes in `services/church-core/PROVENANCE.md`. The snapshot is unchanged. New CI `.github/workflows/church-core.yml` runs unit tests, the OpenAPI contract test and the real PostgreSQL 16 integration (63 checks).
- church-core 0.5.0: unexpected errors return 500 instead of 503 and every 5xx is logged as JSON without message/body; DB role safety check is cached for 30s on success; a connection is destroyed when ROLLBACK fails; `HOST` sets the listen address.
- Added `docs/governance/DUPLICATE_COPY_REGISTER.md`/`.csv`: 20 copied files with their source of truth. The unreferenced B-04 copy in `tests/contract` is recorded as partly STALE (manifest template 1.0 vs 1.1). No files were deleted.
- Added `tools/validation/validate_duplicate_copies.py` and its tests; the design-documents CI now fails when a registered copy diverges or an unregistered copy appears, and also runs on `.sql` changes.
- Noted in `STRUCTURE_GUIDE.md` that workflows under `canonical/.../.github` do not run.

## 3.0 - 2026-10-17

- Repository renamed from `CHGO-Platform` to `JesusLife-Church-OS` and narrowed to Church OS.
- Removed 192 files that belong to the CHGO engine, Life Diary or other products. They remain in history at `b64dd9a`. See `docs/governance/Repository_Split_Record_2026-10-17.md`.
- Moved ADR-LD01 (Life Diary role separation) to `CHGO-Life-Diary-Flutter`.
- Retired E5 suites E5-R01 (CHGO repository structure freeze) and E5-R05 (PDV-008 Vault).
- Rewrote `README.md`, `START_HERE.md` and `STRUCTURE_GUIDE.md` for Church OS.

## 2.1 - 2026-09-21

- Added CHGO Ecosystem Master Roadmap 2.0.
- Added an executable backlog for shared identity, ontology runtime, Life Diary MVP, CHGO Engine, Church OS, BibleON and Prayer integration.
- Established Life Diary-first implementation order and one-account product experience.
- Preserved JesusLife Canonical and existing governance authority without semantic modification.
- Identified F1 Shared Identity, Membership and Product Consent Contract 1.0 as the next official work item.
- Added the F1 contract candidate and its minimal OpenAPI contract, covering one-account login, later church linking, product consent and Vault authorization separation.

## 2.0 - 2026-09-21

- Promoted the clean E5 cloud candidate as the GitHub pre-development baseline candidate.
- Added the top-level CHGO project context, definition, Constitution 2 and Core Philosophy 3 under `canonical/governance/`.
- Recorded modular monorepo boundaries for CHGO Engine, Scripture, Prayer and Church OS.
- Added neutral product and service placeholders so consumer brand changes do not force technical renaming.
- Added domain ownership and source-admission registries.
- Kept the 1,613-file legacy source archive outside the executable repository; no HWP, nested ZIP, cache or credential material was bulk-admitted.
- Preserved runtime and approval truth: static PASS does not convert NOT_RUN or OPEN gates into PASS.

## E5 Cloud PostgreSQL Runtime Candidate 1.0 - 2026-09-14

- Added a manually triggered GitHub Actions PostgreSQL 16 disposable runtime.
- Added real V001-V012 execution, V010 replay and dump/drop/recreate/restore evidence capture.
- Added hashed evidence packaging with 90-day artifact retention.
- Marked API and Vault provider/KMS runtime as `BLOCKED_NO_RUNTIME_IMPLEMENTATION`; E5 remains `OPEN`.
- Excluded mistakenly nested historical B04 update folders from the clean candidate.
- Did not modify Canonical artifacts.

## E5 Execution-Ready Candidate 1.0 - 2026-09-14

- Added cross-gate static regression orchestration for B-04, PDV-008 and C-02.
- Registered B-02, B-03 and seven blocking regression suites for runtime execution.
- Added rollback triggers, recovery boundaries and seven rollback controls.
- Kept E5 `OPEN`; runtime regression, rollback proof and reviewer approval remain `NOT_RUN/PENDING`.
- Did not modify Canonical artifacts.

## C-02 Candidate 1.0 - 2026-09-14

- Added the production privacy policy decision record and ADR.
- Added 14 controlled decisions and four launch-market compliance rows.
- Added a machine-readable evidence record and validation script.
- Kept production `OPEN` pending accountable approvals and runtime evidence.
- Did not modify Canonical artifacts.

## 1.0 - 2026-09-10

-   Created the Clean Repository physical folder structure.
-   Promoted only a curated set of governance, canonical, architecture,
    product, privacy, DB, API, test and backlog artifacts.
-   Added CRAVS 1.0, Bootstrap 27 Re-Admission Matrix, API Versioning
    ADR 1.0, Church OS 2.x -\> 3.0 Carry-Forward Matrix, and Church OS
    Product & Experience Architecture 3.0.
-   Preserved DB migrations V001-V010 and validation V011-V012 as
    **CANDIDATE-B02**, not runtime-passed.
-   Preserved Church OS OpenAPI Delta 2.0 as **CANDIDATE-B04**, not
    final consolidated v2.
-   Preserved MVP acceptance matrix as **NOT_RUN**, not evidence.
-   Repository state set to **PRE-FREEZE CLEAN DEVELOPMENT REPOSITORY**.
# JL-LD Flutter Integration Candidate 2.3 - 2026-10-06

- Added the implementation-ready Flutter MVP integration contract.
- Added a nine-item dependency-ordered Flutter implementation backlog linked to LD-001 through LD-015.
- Added a machine-readable Flutter-to-Canonical/SQLite mapping.
- Added a static validator for Canonical IDs, confession wording, privacy boundary, season size, backlog, and acceptance coverage.
- Did not change Canonical IDs, Canonical wording, runtime schema 1.0.0, or SQLite V001.
- Kept Flutter runtime proof `NOT_RUN` until tested in the actual application repository.
