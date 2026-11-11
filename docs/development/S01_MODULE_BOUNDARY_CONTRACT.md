# S01 모듈 경계·공통 계약

2026-11-11. 대상: `services/church-core` 0.6.0. [개발 기준](DEVELOPMENT_BLUEPRINT.md) S01(모듈 소유권·공통 경계 계약)의 결과다. 아래 내용은 **현재 코드가 실제로 하는 일**을 정리한 기술 계약이며 COS·REC 정책 결정을 새로 만들지 않는다. 계층 규칙은 CI가 강제하고, 나머지 계약은 코드·테스트·OpenAPI가 근거다.

## 1. 계층과 자동 검사

```
src/
  main.ts                composition root: 설정을 읽고 어댑터를 조립한다
  domain/                업무 규칙. 프레임워크·DB·네트워크를 모른다
    types.ts             공통 용어(Principal, Kind, ManagedKind, MutationAction, CursorKey)
    commands.ts          입력 검증, CommandError, 요청 지문
    lifecycle.ts         공지·일정 상태 전이와 열람 판정
    paging.ts            keyset 커서, 관리 목록 상태 필터
  application/           유스케이스가 쓰는 경계
    ports.ts             IdentityPort·StorePort·SessionPort·AuditPort
    errors.ts            DependencyUnavailable
  adapters/
    http/                NestJS·Fastify 경로, 오류 응답(problems.ts)
    postgres/            SQL, 트랜잭션, RLS 문맥
    oidc/                JWT 검증
```

| 규칙 | 내용 | 강제 |
|---|---|---|
| 방향 | domain → domain만. application → domain·application. 어댑터 → domain·application·자기 폴더. 어댑터끼리 서로 import 금지. `main.ts`만 모두 조립 | `tools/architecture/check.ts` |
| 타입 import | 타입만 가져와도 의존으로 본다 | 같은 검사 |
| 외부 패키지 | domain·application은 `node:crypto`만. http는 Nest/Fastify, postgres는 `pg`, oidc는 `jose`. 새 어댑터는 허용 목록에 먼저 등록 | 같은 검사 |
| 순환 | 금지 (이번에 `commands → ports → lifecycle → commands` 타입 순환을 `domain/types.ts`로 해소) | 같은 검사 |
| 다른 제품 DB | PostgreSQL 어댑터의 SQL은 `church_*` 스키마만 사용 | 같은 검사 (`sql-schema`) |
| 모듈 확장 | 같은 규칙이 `src/modules/<이름>/{domain,application,adapters}`에도 적용. 모듈 사이에는 상대 모듈의 application만 import | 같은 검사 |

CI: `npm test`(규칙 테스트 포함)와 별도 단계 `node dist/tools/architecture/check.js`. 일부러 넣은 위반 세 가지(domain의 `pg`, domain → 어댑터, `jlprayer` 스키마)가 모두 보고되는 것을 확인했다.

### 계층별로 시작하고 모듈 폴더는 아직 만들지 않은 이유
블루프린트는 `modules/<도메인>/{domain,application,adapters}`를 권장하면서 "빈 계층을 만들지 않는다", "여러 책임은 기능을 옮길 때 실제 호출자와 함께 나눈다"고 정했다. 지금 코드는 교회·소속·공지·일정이 하나의 트랜잭션 세션(`SessionPort`)과 하나의 컨트롤러를 공유하고, 교회 모듈은 조회 한 개뿐이다. 지금 모듈 폴더로 쪼개면 거의 빈 폴더가 생긴다. 그래서 계층 경계를 먼저 강제하고, S04(개설·가입·위임)나 S05(편집본/게시본)처럼 한 모듈의 코드가 실제로 커질 때 그 모듈부터 `src/modules/<이름>/`으로 옮긴다. 검사 규칙은 이미 그 경로를 지원한다.

## 2. 코드와 데이터 소유권

[데이터 소유권표](DOMAIN_OWNERSHIP.csv)의 행과 현재 코드의 대응이다. 표에 없는 행(OWN04·05·08–13·16·17)은 아직 코드가 없다.

| 소유권 | 현재 코드 | 테이블 | 쓰기 |
|---|---|---|---|
| OWN01 church | `SessionPort.tenant` (조회) | `church_core.tenant` | 없음 |
| OWN02 membership | 교인 목록·생성 | `church_core.membership` | `POST /memberships` (TENANT_ADMIN) |
| OWN03 access | `SessionPort.roles` (요청마다 현재 역할 조회) | `church_access.external_subject_binding`, `membership_role`, `tenant_role` | 없음 (토큰의 역할은 무시) |
| OWN06 notice | 공지 목록·상세·생성·수정·게시·취소, 관리 목록 | `church_core.notice` | TENANT_ADMIN |
| OWN07 event | 일정 목록·상세·생성·수정·게시·취소, 관리 목록 | `church_core.church_event` | TENANT_ADMIN |
| OWN14 audit | 쓰기 트랜잭션 안의 `church_audit.append_event` | `church_audit.audit_event` | 업무 쓰기와 함께 |
| OWN15 command_support | 멱등 키 영수증 (24시간) | `church_integration.idempotency_record` | 업무 쓰기와 함께 |
| OWN18 identity_provider | OIDC JWT 검증만 (`adapters/oidc`) | 없음 | 없음. 실제 제공자 미정 |

다른 제품(OWN19–24)의 데이터는 ChurchOS DB에 없고, SQL 스키마 검사가 접근을 막는다.

## 3. 권한 계약

- 인증: `Authorization: Bearer` JWT, RS256, `iss`·`aud`·`sub`·`exp`·`iat` 필수, 발급 후 15분 이내. 토큰 안의 `tenant`·`roles`는 **권한 근거로 쓰지 않는다**.
- 교회 문맥: 요청마다 `X-Church-Tenant`(UUID)와 `X-Purpose-Code: CHURCH_OPERATION`. 서버는 요청마다 그 교회의 활성 소속·바인딩·유효 역할을 DB에서 다시 읽는다.
- 역할 판정: 소속이 있으면 `MEMBER` + DB 역할. 교인 목록은 `PASTOR`·`TENANT_ADMIN`, 모든 쓰기와 관리 목록은 `TENANT_ADMIN`. 위임 capability는 S04에서 확장한다.
- 공지 대상: `ALL_MEMBERS` 전원, `LEADERS`는 리더 역할·목회자·관리자, `STAFF`는 목회자·관리자. 공동체 제한 일정은 공동체 ACL 구현 전까지 교인 목록에서 제외(관리 목록에는 포함).
- 메뉴 숨김·기능 플래그는 권한을 만들지 않는다. 서버 판정만 유효하다.

## 4. DTO 계약

- 응답 스키마는 `openapi/church-os-v1.yaml`의 닫힌 스키마(`additionalProperties: false`)이며 CI가 문서 유효성과 대표 응답을 검사한다.
- 요청 본문에 정의되지 않은 필드가 있으면 `422 INVALID_BODY`, 정의되지 않은 쿼리 파라미터는 `400 INVALID_QUERY`.
- 시각은 ISO 8601(UTC `Z` 또는 오프셋 포함). 행 버전은 문자열, 수정에는 `If-Match: "rv-<버전>"`.
- 목록은 `{ items, nextCursor }`. `cursor`는 교회·목록에 묶인 불투명 값이다.
- 개인 기도·일기·상담 원문 필드는 어떤 DTO에도 없다.

## 5. 오류 계약

응답은 `application/problem+json`: `{ type, title, status, code, traceId }`. `traceId`로 서버 로그를 찾는다. 메시지·본문은 응답과 로그에 넣지 않는다.

| 상태 | code | 앱에서의 의미 |
|---|---|---|
| 400 | `INVALID_TENANT`·`INVALID_QUERY`·`INVALID_LIMIT`·`INVALID_CURSOR`·`INVALID_DATE`·`INVALID_DATE_RANGE`·`INVALID_STATUS_FILTER`·`INVALID_ID`·`INVALID_IDEMPOTENCY_KEY`·`INVALID_IF_MATCH`, 잘못된 JSON은 `HTTP_ERROR` | 앱 버그 또는 오래된 커서. 커서 오류면 첫 페이지부터 다시 |
| 401 | `UNAUTHORIZED` | 다시 로그인 |
| 403 | `MEMBERSHIP_REQUIRED` | 이 교회의 유효 교인이 아님(가입 대기·종료·해제) |
| 403 | `ROLE_DENIED`·`PURPOSE_DENIED`·`TENANT_MISMATCH` | 권한 없음. 관리 메뉴를 닫고 교인 화면으로 |
| 404 | `NOT_FOUND`, 없는 경로는 `HTTP_ERROR` | 없거나 볼 수 없음(권한 없는 상세도 404) |
| 409 | `IDEMPOTENCY_CONFLICT`·`IDEMPOTENCY_KEY_EXPIRED`·`REPLAY_SUPERSEDED`·`LEGACY_RECEIPT_UNSUPPORTED`·`INVALID_TRANSITION`·`TERMINAL_STATE`·`NO_STATE_CHANGE`·`NOTICE_EXPIRED`·`RESOURCE_CONFLICT` | 쓰기 충돌. 최신 상태를 읽고 사용자에게 확인 |
| 412 | `VERSION_MISMATCH` | 다른 사람이 먼저 수정. 입력은 보존하고 최신본을 다시 읽음 |
| 413·415 | `HTTP_ERROR` | 앱 버그(본문 크기·형식) |
| 422 | `INVALID_BODY`·`INVALID_DATE`·`INVALID_DATE_RANGE`·`INVALID_STATUS`·`INVALID_TIMEZONE`·`INVALID_REFERENCE_OR_VALUE` | 입력값 오류. 해당 입력 칸 안내 |
| 428 | `IF_MATCH_REQUIRED` | 앱 버그(버전 없이 수정) |
| 500 | `INTERNAL_ERROR` | 서버 결함. 자동 재시도하지 않고 traceId와 함께 안내 |
| 503 | `SERVICE_UNAVAILABLE`·`NOT_READY` | 일시 장애. 잠시 후 재시도 가능 |

## 6. 트랜잭션 계약

- 인증된 요청은 하나의 DB 트랜잭션에서 처리한다: `BEGIN` → 트랜잭션 범위 `church.tenant_id`·`church.actor_ref`·`statement_timeout=5s` 설정(RLS 문맥) → 역할 조회 → 업무 → `COMMIT`. 실패하면 `ROLLBACK`, ROLLBACK마저 실패하면 커넥션을 폐기한다.
- DB 로그인 역할은 superuser·BYPASSRLS·테이블 소유자가 아니어야 한다(성공 결과 30초 재사용, 실패는 즉시 503).
- 쓰기: `Idempotency-Key`(16–128자) 필수. 같은 교회·사용자·경로·키에 advisory lock → 영수증 확인 → 업무 변경 → 업무 감사 append → 영수증 저장이 한 트랜잭션이다. 감사 기록이 실패하면 업무 변경도 되돌린다.
- 수정·게시·취소는 `If-Match` 낙관적 잠금. 영수증은 24시간이며 결과 조회(REC-097의 168시간)와 별개다.
- 외부 제품 호출·알림은 이 트랜잭션에 넣지 않는다(아직 구현 없음, 블루프린트 §6).

## 7. 기기·교회 문맥 계약 (앱 쪽 규칙)

S03에서 앱이 지켜야 할 규칙이다. 서버는 요청마다 권한을 다시 판정하므로, 앱의 목적은 **이전 교회나 이전 권한의 화면을 잘못 보여주지 않는 것**이다.

- 모든 요청에 현재 선택된 교회의 `X-Church-Tenant`를 보낸다. 교회를 바꾸면 이전 교회의 목록·상세 캐시와 커서를 버리고, 진행 중이던 요청의 응답은 도착해도 화면에 반영하지 않는다.
- 커서는 해당 교회·목록에서만 쓴다. `400 INVALID_CURSOR`면 첫 페이지부터 다시 읽는다.
- `401`이면 보호된 화면 내용을 먼저 숨기고 다시 로그인하게 한다. `403 MEMBERSHIP_REQUIRED`면 교인 전용 카드를 숨기고 소속 상태를 안내한다.
- 관리 메뉴 표시는 서버가 관리 목록에 `200`을 준 경우에만 유지한다. `403 ROLE_DENIED`가 오면 관리 화면을 닫는다.
- 실패를 빈 목록으로 꾸미지 않는다. 빈 목록(`items: []`), 권한 없음, 일시 장애, 미연결을 서로 다르게 보여준다.
- 오프라인 상태의 관리자 쓰기 대기열은 만들지 않는다(초안 CT07).

## 8. 화면 상태 명세 (S03 대상 화면)

| 화면 | 호출 | 상태 | 표시 | 사용자 행동 |
|---|---|---|---|---|
| 공지 목록 | `GET /notices` | 로딩 | 목록 자리 표시 | — |
| | | 200, 항목 있음 | 최신 게시 순, 아래로 스크롤 시 `nextCursor`로 다음 페이지 | 항목 → 상세 |
| | | 200, `items: []` | "게시된 공지가 없습니다" | 새로고침 |
| | | 401 / 403 | 3·7절 규칙 (내용 숨김 후 로그인·소속 안내) | 로그인 / 안내 확인 |
| | | 503·네트워크 오류 | "잠시 후 다시 시도해 주세요" + 이전 내용은 같은 교회일 때만 흐리게 유지 | 다시 시도 |
| | | 500 | "문제가 발생했습니다" + traceId 일부 | 문의 |
| 공지 상세 | `GET /notices/{id}` | 200 | 제목·본문·게시/종료 시각 | 뒤로 → 목록 위치 유지 |
| | | 404 | "볼 수 없는 공지입니다"(철회·만료·권한 해제 포함) | 목록으로 |
| 일정 목록 | `GET /events` | 200 | 시작 시각 순, 기본은 끝나지 않은 일정. 시각은 일정의 `timezone`으로 표시 | 항목 → 상세, "지난 일정" → `from` 지정 |
| | | `items: []` | "예정된 일정이 없습니다" | 지난 일정 보기 |
| | | 오류 | 공지 목록과 같음 | |
| 일정 상세 | `GET /events/{id}` | 200 / 404 | 일시·종류·상태. 취소된 일정은 교인에게 404 | 목록으로 |
| 관리 목록 | `GET /manage/notices`, `/manage/events` | 200 | 최근 수정 순, 상태 배지(초안·게시), 상태 필터 | 항목 → 상세(관리자는 모든 상태 열람) |
| | | 403 `ROLE_DENIED` | 관리 화면 닫고 교인 화면으로 | — |

공통: 교회 전환 시 모든 화면 상태를 로딩으로 초기화한다. 오류 문구에 서버 메시지를 그대로 보여주지 않는다(서버는 보내지도 않는다).

## 9. 이번 범위 밖

- 실제 공통 인증 제공자 연결과 시험용 제공자 구성: S02.
- 앱 코드: S03. 이 문서 7·8절이 S03의 입력이다.
- 위임 capability, 편집본/게시본, 공동체 ACL: S04·S05·S07.
