# 구현 전 ADR 대기 목록

다음 항목은 경계를 바꾸지 않지만 구현 기술과 운영비에 영향을 주므로 코드 착수 전에 ADR로 결정한다.

| ADR | 결정 항목 | 기본 추천 | 승인 전 상태 |
|---|---|---|---|
| ADR-001 | 백엔드 언어·프레임워크 | Node.js·TypeScript·NestJS·Fastify | ACCEPTED_CANDIDATE |
| ADR-002 | DB migration runner | checksum·locking·history 지원 도구 | OPEN |
| ADR-003 | OIDC provider | 내부 공통 인증·계정 기반 표준 claims 계약 우선 | EXTERNAL BLOCKED |
| ADR-004 | policy engine | 초기 application policy, 추후 OPA 검토 | OPEN |
| ADR-005 | queue | PostgreSQL outbox worker로 시작 | CANDIDATE |
| ADR-006 | cache | Today 60초 tenant/member/version key | CANDIDATE |
| ADR-007 | secret manager | cloud-neutral adapter | OPEN |
| ADR-008 | observability | OpenTelemetry trace·metric·structured log | CANDIDATE |
| ADR-009 | file storage | object storage adapter와 malware scan | OPEN |
| ADR-010 | deployment | 단일 서버 시작 가능, stateless scale 준비 | OPEN |

ChurchOS 기술 선택은 ADR-001을 따르며 domain module, API, DB, event, privacy 경계는 변경하지 않는다.

