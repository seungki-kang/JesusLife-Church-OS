# ChurchOS Core 0.4.0 — 첫 서버 구현

NestJS·Fastify·TypeScript로 만든 조회 API 시작점이다. 운영 출시 상태가 아니다.

## 실행한 검증
실제 Nest/Fastify HTTP 요청을 inject해 RS256 서명·issuer·audience·만료 검증, DB 소속 포트에 의한 교회/역할 판정, 철회·교회 불일치·잘못된 입력 거부를 검사했다. 테스트는 합성 저장소와 로컬 생성 서명키를 사용한다. PostgreSQL 어댑터는 트랜잭션 제어를 대역으로 검사했다. 실제 PostgreSQL↔서버 통합과 외부 OIDC 제공자 연결은 NOT_RUN이다.

## Windows에서 첫 확인
이 폴더에서 실행한다. Node 24가 필요하며 첫 npm ci는 의존성을 다운로드한다.

```powershell
npm ci
npm test
```

테스트는 실제 로그인 계정이나 운영 DB 없이 실행된다. 기존 v2.2 폴더를 덮어쓰지 말고 새 v2.3.1 폴더에서 실행한다.

## 구현한 경로
- GET /health/live: 프로세스 생존
- GET /health/ready: DB 역할·연결 상태만 검사
- GET /api/v1/church/tenants/:tenantId: 승인된 교회 정보
- GET /api/v1/church/memberships: 목회자/교회관리자 교인 목록
- GET /api/v1/church/notices: 게시·기간·대상 권한을 만족하는 공지
- GET /api/v1/church/events: 게시된 교회 공용 일정; 공동체 제한 일정은 ACL 구현 전 제외

네 개 도메인 조회는 전체 OpenAPI 구현 중 일부다. v2.5에서 작성 3개 경로를 추가했으며 v2.6에서는 공지·일정 상세/수정/게시/취소도 구현했다. 삭제 및 나머지 경로는 미구현(404)이다. 인증 없는 health는 운영 진단 경로이며 공개 도메인 계약과 분리한다.

## 인증·권한
Bearer JWT는 RS256만 허용하고 iss/aud/sub/exp/iat를 요구한다. 최대 발급 후 15분과 5초 시각 오차를 적용한다. URL과 서명키는 서버 설정에서만 제공한다. 토큰의 tenant/roles는 권한 근거로 사용하지 않는다. 각 요청은 현재 활성 교회·ACTIVE 소속·활성 binding·역할 유효기간을 조회한다. X-Church-Tenant는 요청 대상일 뿐이다. 현재 목적 allowlist는 CHURCH_OPERATION 하나다. 교인 목록은 PASTOR/TENANT_ADMIN 역할을 요구한다.

StorePort·IdentityPort·AuditPort를 교체 가능한 provider로 주입한다. 실제 PgStore는 파라미터 SQL과 transaction-local set_config를 사용하고 실패하면 rollback 후 connection을 반환한다. superuser·BYPASSRLS·교회 테이블 소유 계정은 거부한다. DB 로그인에는 필요한 church_os_app 권한이 있어야 하며 migration owner 계정을 사용하면 안 된다.

## 실제 서버 실행 전 설정
DATABASE_URL, OIDC_ISSUER, OIDC_AUDIENCE, OIDC_JWKS_URL을 비밀 관리 방식으로 주입한다. OIDC 두 URL은 HTTPS여야 한다. 실제 계정 발급자·토큰 audience는 아직 결정/연결하지 않았다. 환경변수가 없으면 시작을 거부하며 mock 인증으로 대체하지 않는다.

```powershell
npm run build
npm start
```

기본 바인딩은 127.0.0.1:3000이다. 외부 네트워크 노출은 포함하지 않는다. 토큰·비밀번호·원문을 Git·로그에 기록하지 않는다. 콘솔 AUDIT는 traceId·route template·HTTP status만 기록한다. v2.5 성공 작성의 영속 감사는 PgSession 트랜잭션 안에서 별도 저장한다. 거부 감사의 영속화는 다음 단계다.

## 남은 작업
실제 DB 통합 테스트, 외부 OIDC sandbox, 관리자 역할 운영 승인, 등록·쓰기 API와 멱등성·감사 트랜잭션, rate limit, 공동체 ACL, migration runner, OIDC/DB readiness 확대, 앱·실기기·여섯 전문 제품 연동을 구현해야 한다. 기존 DB 테스트 PASS를 이 서버의 DB 연결 PASS로 승계하지 않는다.

## 보안 의존성 고정
package.json의 overrides는 @nestjs/platform-fastify가 사용하는 Fastify를 5.12.7로 지정한다. 전체 NestJS 12 전환이 아닌, 같은 Fastify 5 계열의 제한된 override다. 이 코드 범위의 테스트 통과는 모든 NestJS 기능의 upstream 호환성 보증을 뜻하지 않는다. lockfile과 override를 함께 유지하고 npm ci·npm audit·npm test를 실행한다.

## v2.4 통합 실행
패키지 루트의 START_API_DB.md를 따른다. npm test는 기존 HTTP·저장소 대역 검사와 통합 증거 판정기 검사를 실행한다. 실제 DB 통합은 별도 Docker 실행기로만 검증하며 자동 skip하지 않는다. 로컬 RSA 서명키를 사용하므로 실제 OIDC 제공자 연결 완료는 아니다.

## v2.5 쓰기 구현
START_WRITES.md와 src/commands.ts, PgSession.create를 따른다. 세 POST는 TENANT_ADMIN만 허용하고 공지/일정은 DRAFT만 생성한다. Idempotency-Key는 성공 응답만 재생한다. 실제 DB 통합은 새 Docker 검사 결과 전까지 NOT_RUN이다.

## v2.6 Lifecycle
현재 동작과 실행 절차는 START_LIFECYCLE.md를 따른다. detail GET ETag → If-Match 및 요청 키 → PATCH 또는 POST publish/cancel 순서다. 큰 버전 값은 문자열로 유지한다. 내용 스냅샷 없이 최종 버전만 영수증에 기록하며 superseded replay는 409다. 본문 이력 복원은 미구현이다.
