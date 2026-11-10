# v2.6 중복 방지 구현과 후속 조회 설계 대조

> 현재성 안내: 부분 합의·과거 제안·기술 초안을 구분합니다. [결정 색인](RECOVERY_DECISIONS.md)과 [현재 상태](../START_RECOVERY_CURRENT.md)을 함께 읽으세요. 상단 AGREED가 모든 기술 항목의 승인을 뜻하지 않습니다.

2026-10-28 / SOURCE_REVIEW / canonical 수정 없음 / 실행 NOT_RUN

## 직접 확인한 소스

- [postgres.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/postgres.ts): create/mutate에서 tenant+actor+route+key advisory transaction lock, 기존 영수증 확인, 업무/감사/영수증을 같은 트랜잭션으로 처리.
- [commands.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/commands.ts): issuer+subject의 actorRef, 입력 fingerprint. 기존 구현은 일반 해시이며 새 보호 방식 구현을 주장하지 않음.
- [app.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/app.ts): Idempotency-Key와 X-Church-Tenant 검증, 자원별 경로, 기존 권한·If-Match.
- [DB 통합 검사 소스](../canonical/ChurchOS_Canonical_v2.6/services/church-core/integration/verify.ts): expired-key-rejected, 감사 실패 롤백 등. 소스 존재와 이번 실행 PASS는 다름.
- [V005](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V005__integration_audit.sql), [V014](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V014__create_command_receipts.sql), [V015](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V015__lifecycle_receipt_versions.sql): 기존 표/영수증 계보.

## 기존 동작과 차이

| 축 | 실제 v2.6 | 후속 설계에서 필요한 것 |
|---|---|---|
| 요청 | 자원별 경로 + 헤더 키 | 기본 유지. 본문 request_id/범용 쓰기는 철회된 기술 후보 |
| 중복 범위 | tenant+actor_ref+route_key+idempotency_key | 검증된 계정 매핑·경로별 구분 보존. 제품/전역 키 변경은 미승인 |
| 수명 | insert의 now()+24 hours는 성공 응답 재생 유효기간 | 물리 보유기간 아님. 조회 168h와 분리 필요 |
| 만료 | 행이 남아 있으면 409 IDEMPOTENCY_KEY_EXPIRED | 삭제 뒤 키 재사용 안전성은 미해결. 24h 자동 삭제 정책 아님 |
| 성공 재생 | 생성 201 영수증; 수정 200은 row_version 일치 필요, 변경됐다면 REPLAY_SUPERSEDED | 최소 상태 조회는 현재 원문 재생과 분리할 필요 |
| 실패/처리 중 | 실패는 롤백, 성공 영수증 중심. 영속 처리 중 상태 없음 | 실제 접수 증거·거절 확정·조사 상태 계약은 신규 |
| 시간 | DB now()/created_at은 트랜잭션 시간 문맥 | 실제 최초 접수와 최종 확정 시각으로 자동 대체하지 않음 |
| 접근 | 쓰기 경로의 현재 권한 확인을 거침 | 역할만 끝난 유효 교인의 본인 최소 읽기 조회는 신규 |

24시간을 336시간으로 바꾸는 것만으로는 충분하지 않다. 미확정이 168h 뒤 실제 확정될 수 있으므로 접수부터 고정 336h 보유도 모든 경우의 최종 168h를 보장하지 못한다. 실제 사건별 조회 기한과 별도 저장 근거를 설계해야 한다.

## 권장 후속 방향 — DRAFT

기존 헤더/영수증/자원별 쓰기를 기준으로, 다섯 항목만 노출하는 읽기 전용 조회 투영을 연결한다. 테이블 분리나 영수증 단순 연장을 아직 선택한 것은 아니다. 기존 저장 원자성·오류·키 범위 유지, 영수증/조회 참조 연결, 최초 접수·실제 확정 증거, 상태 거절/미확정 보유, 삭제/백업/복원의 실행 차단을 함께 설계한다.

기록이 없다는 이유만으로 새 실행을 안전하다고 판정하지 않는다. 요청 재전송은 결과 확인용 읽기 API 대체가 아니다. 현재 canonical은 변경하지 않았고 후속 정책을 지원하도록 구현됐다고 주장하지 않는다.

## 확인 번호와 경로별 멱등 키 — r27 보완

v2.6의 중복 판정 범위는 tenant+actor_ref+**route_key**+idempotency_key다. 같은 키 값이 다른 경로에서 별개 요청으로 정상 처리될 수 있다. 따라서 멱등 키 값을 그대로 사용자 확인 번호로 쓰면, 그 번호 하나로 조회 대상이 하나로 정해지지 않는다. 키에는 무작위성 요구도 없다(16~128 인쇄 가능 ASCII).

권장안(DRAFT, 미승인): 서버가 영수증 행(tenant+actor_ref+route_key+idempotency_key)마다 추측하기 어려운 별도 불투명 확인 ID를 발급하고, 조회는 그 ID와 현재 계정·선택 교회·소속 검증으로만 허용한다. 멱등 키는 쓰기 재시도용으로만 남긴다. 이 방향의 채택 여부·발급 시점·보유는 결정 전이다.

## r28 연결 계약 참고

[송신 전 기기 참조와 서버 확인 ID](SUBMISSION_RECEIPT_BINDING_DRAFT.md)를 함께 적용한다. 서버 확인 ID가 없는 응답 유실은 새 쓰기나 새 키 발급으로 해결하지 않는다. 연결 ID·정확한 경로 범위·영속 접수·읽기 연결의 구체 방식은 DRAFT다. 다섯 공개 항목 합의에 기기 내부 필드를 추가 공개하지 않는다.
