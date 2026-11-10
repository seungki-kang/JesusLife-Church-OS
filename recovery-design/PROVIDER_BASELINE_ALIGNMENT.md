# 전문 제품 연결 — 기존 계약과 후속 요구의 차이

2026-10-28 / SOURCE_REVIEW / PARTIAL_RECOVERY / 실제 제공자 연동 NOT_RUN

근거: [제품 관계](../docs/operations/ecosystem-v1/PRODUCT_RELATIONSHIPS.md), [구현 인계](../docs/operations/ecosystem-v1/IMPLEMENTATION_HANDOFF.md), [말씀 운영](../docs/operations/ecosystem-v1/WORD_AND_SERMONS.md), [인증 현황](../docs/operations/ecosystem-v1/AUTH_PROVIDER_AND_PRODUCT_INVENTORY.md), [계정·소속·서비스 계약](../docs/operations/ecosystem-v1/ACCOUNT_MEMBERSHIP_SERVICE_SCOPE_CONTRACT.md), [v2.6 경계 계약](../canonical/ChurchOS_Canonical_v2.6/contracts/01_통합경계계약.md), [제공자 상태표](../canonical/ChurchOS_Canonical_v2.6/contracts/integrations.yaml).

| 대상 | 확인된 기준 | 후속 계약으로 메울 차이 |
|---|---|---|
| 전체 | v2.6 모두 CONSUMER_REQUIREMENT_ONLY·runtime NOT_RUN·공유DB 없음 | 소비자 요구를 제공자 승인·구현·운영 성공으로 읽지 않음 |
| JLPrayer | v2.6 공개 캠페인/최소 요약/handoff. 후속 인계에는 본인 수첩 read/write·교회 기도·기도방 기능 후보 | 개인 수첩을 앱 화면에서 읽는 후속 요구와 기존 비공개 원문 금지를 구분. 본인용 임시 화면 전달만 별도 명시 계약, 교회 DB/로그/관리자로 확대 금지 |
| JLBible | v2.6 계획/오늘읽기 ref·허용 진도·handoff. 후속 말씀 문서는 앱내 성경/찬송 | 실제 콘텐츠 API·판본·표시/검색/가사/악보/음원/캐시 권리 미확인. 열람을 통독 완료로 바꾸지 않음 |
| 설교/CHGO | v2.6 CHGO 최소10명 공동체 집계. 후속 말씀 문서는 교회 허용 설교 버전·근거/개념·별도 생성 | 개인 집계 API를 설교 원고 업로드 API로 재사용하지 않음. 교회 콘텐츠 처리 계약과 집계 계약 분리 |
| Academy | 강좌ref·공개 요약·동의된 수강 상태 요구 | 교회 도입/개인 수강/실천/수료 서로 다른 근거. 실제 최신 저장소·운영 API 미확인 |
| 너랑나랑 | 허용된 초대/세션 상태/handoff 요구; 과거 인증 조사 소스는 로컬 기록 중심 | 실제 현재 API·SSO 존재 여부 일반화 금지. 표시 이름/이메일로 소유자 자동 연결 금지 |
| 생명일기 | 일회용 handoff만, 개인 상태 수신 금지 | 작성 여부·회차·날짜·코칭 상태를 Academy 참여 이유로 ChurchOS에 추가하지 않음 |
| 인증 | JWT 검증 어댑터와 실제 발급/갱신/철회 연결은 다름 | 공통 계정이 제품 이용/개인 공유 권한을 자동 부여하지 않음 |
| 앱 이동 | 단회·최대10분·정확한 등록 return URI·교회/주체/제공자/capability 결속 요구 | 실제 앱 링크·복귀·리플레이 방지 미검증. 수명은 일반 업무 조회168시간과 다름 |

위 차이는 기존 canonical을 고쳐 없애지 않는다. 제공자와 버전별 기능·데이터·권한·폐기/호환을 합의하기 전에는 미준비 기능을 준비 중으로 표시한다. 최신 외부 저장소·배포 서버를 이번에 조사한 결과가 아니며, 과거 현황 조사 시점의 한계를 유지한다.
