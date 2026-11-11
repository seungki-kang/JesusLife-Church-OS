# 공지·일정 목록 정렬과 관리용 목록 — 계약 제안

2026-11-11. 상태: 결정 1 **AGREED** ([COS-CHURCH-042](../decisions/DESIGN_DECISIONS.md#cos-church-042), 안 A), 결정 2 **PROPOSED**. 구현·실행 NOT_RUN. 이 문서는 COS·REC 결정을 대신하지 않으며, 결정이 나면 [결정 원장](../decisions/DESIGN_DECISIONS.md)에 기록한 뒤 구현한다.

S03(공지·일정 읽기의 모바일 수직 연결) 전에 정해야 할 두 가지를 다룬다. 편집본/게시본 분리(S05)·고정글·읽음 통계·달력 화면 세부는 다루지 않는다.

## 1. 현재 동작 (services/church-core)

| 항목 | 현재 | 문제 |
|---|---|---|
| 일정 목록 정렬 | `order by id` | id는 `gen_random_uuid()`라 순서가 무작위. 이번 주 예배와 지난달 행사가 섞인다 |
| 공지 목록 정렬 | `order by id` | 최신 공지가 위에 온다는 보장이 없다 |
| 일정 기본 범위 | `from`/`to`가 없으면 지난 일정 포함 전체 | 앱 첫 화면에 끝난 행사가 계속 노출된다 |
| 커서 | `{tenant, kind, after:id}`를 base64url로 인코딩 | id 순서에만 맞는 형식 |
| 관리자 초안 찾기 | 목록은 게시(`PUBLISHED`)만 반환. 상세는 관리자에게 모든 상태 허용 | 만든 직후 id를 잃으면 초안을 다시 찾을 방법이 없다 |
| 교인 목록 정렬 | `order by id` | 이번 범위 밖(관리 화면 결정 시 함께 검토) |

OpenAPI는 정렬을 정의하지 않고 `cursor`를 길이 512 이하 문자열로만 정의한다. 커서 내부 형식을 바꿔도 계약상 클라이언트가 해석하면 안 되는 값이므로 호환 문제는 작다. 실제 앱은 아직 API에 연결되지 않았다.

관련 설계: [홈·공지·일정 앱 계약 초안](../../recovery-design/HOME_NOTICE_EVENT_FLOW_DRAFT.md)의 CT02(사용자용 정렬/페이지), CT04(교회 시간대·날짜 범위), CT06(관리 목록·초안함은 일반 게시 목록과 분리). [개발 기준](DEVELOPMENT_BLUEPRINT.md) §6의 "미리보기 API와 공개 API 분리".

## 2. 결정 1 — 목록 정렬과 기본 범위

> 2026-11-11 사용자가 안 A를 선택했다. 기록: [COS-CHURCH-042](../decisions/DESIGN_DECISIONS.md#cos-church-042).

### 제안

| 목록 | 정렬 | 기본 범위 |
|---|---|---|
| 일정 `GET /events` | 시작 시각 오름차순, 같으면 id (`starts_at, id`) | `from`이 없으면 **아직 끝나지 않은 일정**(종료 시각, 없으면 시작 시각이 지금 이후) |
| 공지 `GET /notices` | 게시 시각 내림차순, 같으면 id 내림차순 (`publish_at desc, id desc`) | 지금과 같음: 게시 중이고 만료되지 않은 공지 |

- 일정에서 `from`을 주면 지금처럼 그 시각 이후 시작하는 일정을 준다. 지난 일정은 `from`을 과거로 주어 조회한다.
- 커서는 마지막 항목의 정렬 키와 id를 담는 keyset 방식으로 바꾼다(`{tenant, kind, sort, after:[키, id]}`). 정렬 키가 같은 항목도 빠지거나 중복되지 않는다.
- 공지에 `(tenant_id, publish_at desc, id desc)` 인덱스를 새 마이그레이션 V016으로 추가한다. 일정은 기존 `ix_event_time(tenant_id, starts_at)`을 쓴다.

### 대안

| 안 | 내용 | 평가 |
|---|---|---|
| A (제안) | 위 표 | 교회 앱의 기본 기대(다가오는 일정, 최신 공지)에 맞음 |
| B | 정렬만 바꾸고 일정 기본 범위는 전체 유지 | 변경이 가장 작지만 첫 화면에 지난 행사가 쌓임 |
| C | `sort` 파라미터로 클라이언트가 선택 | 유연하지만 정렬마다 인덱스·커서·테스트가 늘어남. 필요가 생기면 나중에 추가 가능 |

### 영향
- 코드: `PgSession.list`의 SQL과 커서 인코딩/검증, 단위 테스트.
- DB: V016 인덱스 1개(적용된 V001–V015는 고치지 않음).
- OpenAPI: 두 목록의 `description`에 정렬·기본 범위 명시.
- 통합 검사: 일정·공지 정렬 순서와 다음 페이지 경계 검사를 추가. 기존 `public-events-only` 검사의 시드 일정은 고정 날짜 `2026-11-01`이라 이미 지난 일정이다. 안 A에서는 기본 목록에서 빠지므로 시드를 실행 시각 기준 미래 날짜로 바꾸고, 지난 일정이 기본 목록에서 빠지는 검사를 따로 추가한다.
- 이전 형식 커서는 배포 후 `400 INVALID_CURSOR`가 된다. 연결된 앱이 없어 실사용 영향은 없다.

## 3. 결정 2 — 관리자용 공지·일정 목록

### 제안
일반 목록과 **분리된 관리 경로**를 추가한다.

- `GET /api/v1/church/manage/notices`, `GET /api/v1/church/manage/events`
- 권한: 지금의 쓰기 권한과 같은 `TENANT_ADMIN`. 위임된 편집 담당(capability)은 S04 접근 계약에서 확장한다.
- 필터: `status`(여러 값 가능, 기본은 `DRAFT,PUBLISHED`), `cursor`, `limit`.
- 정렬: 최근 수정 순 (`updated_at desc, id desc`).
- 응답: 관리 요약만. 공지는 `id, status, title, audience, publishAt, expiresAt, updatedAt, rowVersion`, 일정은 `id, status, kind, title, startsAt, endsAt, timezone, updatedAt, rowVersion`. **본문은 목록에 넣지 않고 상세 API로 연다.**
- 공개·교인용 목록과 캐시 정책을 공유하지 않는다(`cache-control: no-store` 유지).

### 대안

| 안 | 내용 | 평가 |
|---|---|---|
| A (제안) | 분리된 `/manage/*` 경로 | CT06·"미리보기와 공개 API 분리" 원칙과 맞음. S05에서 수정본 구조가 생겨도 같은 경로에 `pendingRevision` 같은 필드를 더하면 됨 |
| B | 기존 목록에 관리자용 `status` 필터 추가 | 경로는 적지만 교인 목록과 관리 목록의 권한·캐시·필드가 한 API에 섞임. CT06과 충돌 |
| C | S05 편집본/게시본 구조 확정까지 보류 | 설계 재작업은 없지만, 그동안 관리자는 만든 초안을 다시 찾을 수 없음 |

### 영향
- 코드: 컨트롤러 경로 2개, `SessionPort.manageList`, SQL 2개, 단위·HTTP 테스트.
- DB: `(tenant_id, updated_at desc, id desc)` 인덱스 2개를 V016에 함께 추가.
- OpenAPI: 경로 2개와 관리 요약 스키마 2개.
- 통합 검사: 관리자만 초안이 보이고, 교인·다른 교회는 `403`/빈 결과, 본문이 목록에 없음을 확인.
- 이 결정은 편집본/게시본 저장 구조, 게시 전 검토 의무, 위임 capability 이름을 정하지 않는다.

## 4. 결정 후 진행 순서

1. 결정을 결정 원장에 기록한다.
2. V016 마이그레이션 → 목록 SQL·커서 → 관리 경로 → OpenAPI → 단위·통합 검사를 한 PR로 구현한다.
3. 실제 PostgreSQL 16 통합 검사로 확인한 뒤 S03 앱 연결을 시작한다.

## 5. 결정해야 할 질문

1. ~~목록 정렬·기본 범위~~ → 안 A로 결정 (COS-CHURCH-042).
2. 관리자 목록: 안 A(분리된 `/manage/*` 경로, `TENANT_ADMIN`, 최근 수정 순, 본문 제외)로 할까요?
