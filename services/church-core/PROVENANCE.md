# 파생 기록 (S00)

2026-11-11. 이 서비스는 `canonical/ChurchOS_Canonical_v2.6`에서 **한 번만** 파생한 활성 백엔드다. 이후 변경은 여기에서만 한다. 스냅샷은 바이트 보존 대상이며 고치지 않고, 같은 버그를 양쪽에 고치지 않는다.

- 기준 커밋: `d879e41` (main, PR #14 병합 시점)
- 기준 검사: 스냅샷 서버 테스트 80개, API+PostgreSQL 통합 63개 검사
- 해시: 원본 파일의 SHA-256 앞 16자리. 파생 이후의 변경은 Git 이력으로 추적한다.
- 2026-11-11 `d26ce5b`: Prettier로 코드 전체를 재정렬했다(동작 동일). 이후 파일 해시는 원본과 다르며, `git blame`은 `.git-blame-ignore-revs`로 이 커밋을 건너뛴다.

## 파생 시 바꾼 것

| 파일 | 변경 | 이유 |
|---|---|---|
| `integration/verify.ts` | 마이그레이션 기준 경로를 서비스 폴더로, 증거 artifact 이름을 `ChurchOS_church-core_active`로 | 루트 `db/`는 별도 과거 계보라 섞이면 안 됨. 스냅샷 증거와 활성 증거를 구분 |
| `.gitignore` | `.evidence/` 추가 | 로컬 실행 증거를 커밋하지 않음 |

새로 만든 것: `README.md`, `PROVENANCE.md`, `.dockerignore`, `tools/api-db/` (스냅샷 `tools/api-db`를 서비스 폴더 기준으로 옮긴 실행기), `contract/test_response_contracts.py` (스냅샷 `tests/test_response_contracts.py`의 활성 경로판).

## 위치 대응

- 마이그레이션 V001–V015: 스냅샷 `db/migrations/` → `db/migrations/`. 순서와 내용 보존. 후속 변경은 V016부터 새 파일로 추가하고 적용된 파일은 고치지 않는다.
- OpenAPI: 스냅샷 `api/openapi/church-os-v1.yaml` → `openapi/church-os-v1.yaml`.

## 파일별 원본

| 활성 경로 | 원본 | SHA-256 | 상태 |
|---|---|---|---|
| `.gitignore` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/.gitignore` | `b63ce42e2babc54a` | 파생 시 수정 |
| `integration/evidence.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/integration/evidence.ts` | `7ad6d320a55dab68` | 복사 그대로 |
| `integration/verify.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/integration/verify.ts` | `41bd74450ac3e48c` | 파생 시 수정 |
| `package-lock.json` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/package-lock.json` | `9ec221cb8d82d7cc` | 복사 그대로 |
| `package.json` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/package.json` | `3020f574f69ee5cf` | 복사 그대로 |
| `src/app.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/src/app.ts` | `99fc81060e7bdacd` | 복사 그대로 |
| `src/commands.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/src/commands.ts` | `b3bfd9edcac86a38` | 복사 그대로 |
| `src/identity.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/src/identity.ts` | `e701235ff8aa612b` | 복사 그대로 |
| `src/lifecycle.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/src/lifecycle.ts` | `57bf6137d2949312` | 복사 그대로 |
| `src/main.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/src/main.ts` | `ad3564773a86b0ce` | 복사 그대로 |
| `src/ports.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/src/ports.ts` | `360064eb06418125` | 복사 그대로 |
| `src/postgres.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/src/postgres.ts` | `4a824f80931d5cf8` | 복사 그대로 |
| `test/api.test.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/test/api.test.ts` | `1b5fd7380b39922c` | 복사 그대로 |
| `test/commands.test.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/test/commands.test.ts` | `7e7fd019bd179d10` | 복사 그대로 |
| `test/integration-evidence.test.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/test/integration-evidence.test.ts` | `245f364dfd06da86` | 복사 그대로 |
| `test/lifecycle-transaction.test.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/test/lifecycle-transaction.test.ts` | `ad4efd3741f0b7ea` | 복사 그대로 |
| `test/lifecycle.test.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/test/lifecycle.test.ts` | `f84370e162d1b130` | 복사 그대로 |
| `test/postgres.test.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/test/postgres.test.ts` | `76ee7840b62b6594` | 복사 그대로 |
| `test/write-transaction.test.ts` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/test/write-transaction.test.ts` | `0ef50c6281c65845` | 복사 그대로 |
| `tsconfig.json` | `canonical/ChurchOS_Canonical_v2.6/services/church-core/tsconfig.json` | `d2ae09a967709400` | 복사 그대로 |
| `db/migrations/V001__foundation.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V001__foundation.sql` | `bc030970bb4f2604` | 복사 그대로 |
| `db/migrations/V002__tenant_membership_identity.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V002__tenant_membership_identity.sql` | `b8f850003fb3189a` | 복사 그대로 |
| `db/migrations/V003__access_community.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V003__access_community.sql` | `3540c5ca64d94d59` | 복사 그대로 |
| `db/migrations/V004__operations_brand.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V004__operations_brand.sql` | `8d25370df673af9b` | 복사 그대로 |
| `db/migrations/V005__integration_audit.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V005__integration_audit.sql` | `bc8414891fdb82c3` | 복사 그대로 |
| `db/migrations/V006__integrity_triggers.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V006__integrity_triggers.sql` | `00f906b84ffa17da` | 복사 그대로 |
| `db/migrations/V007__row_level_security.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V007__row_level_security.sql` | `0d0bd7c1ca30c1ce` | 복사 그대로 |
| `db/migrations/V008__least_privilege_grants.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V008__least_privilege_grants.sql` | `b1cb15a78859e93f` | 복사 그대로 |
| `db/migrations/V009__indexes_and_seed.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V009__indexes_and_seed.sql` | `34c5d03ba44b75cd` | 복사 그대로 |
| `db/migrations/V010__validation_catalog.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V010__validation_catalog.sql` | `096c6bfff3fa79a1` | 복사 그대로 |
| `db/migrations/V011__secure_product_handoff.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V011__secure_product_handoff.sql` | `9ccb495e6b987f59` | 복사 그대로 |
| `db/migrations/V012__runtime_security_and_privacy_fix.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V012__runtime_security_and_privacy_fix.sql` | `9eaeac2579b0f56e` | 복사 그대로 |
| `db/migrations/V013__independent_product_academy.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V013__independent_product_academy.sql` | `0b2c0b5f433187f9` | 복사 그대로 |
| `db/migrations/V014__create_command_receipts.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V014__create_command_receipts.sql` | `f13630222473e846` | 복사 그대로 |
| `db/migrations/V015__lifecycle_receipt_versions.sql` | `canonical/ChurchOS_Canonical_v2.6/db/migrations/V015__lifecycle_receipt_versions.sql` | `e11363e7f398069a` | 복사 그대로 |
| `openapi/church-os-v1.yaml` | `canonical/ChurchOS_Canonical_v2.6/api/openapi/church-os-v1.yaml` | `3301b5c85adbe528` | 복사 그대로 |
