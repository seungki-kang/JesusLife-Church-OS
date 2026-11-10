# 출석·봉사·후속 업무 — 기존 구현·합의 대조

2026-10-28 / SOURCE_REVIEW / PARTIAL_RECOVERY / 실제 DB·앱 실행 NOT_RUN

근거: [S03/S04 운영 시나리오](../docs/operations/ecosystem-v1/OPERATING_SCENARIOS.md), [V003](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V003__access_community.sql), [V004](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V004__operations_brand.sql), [V012](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V012__runtime_security_and_privacy_fix.sql), [V007 RLS](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V007__row_level_security.sql), [실제 라우트](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/app.ts), [REC 색인](RECOVERY_DECISIONS.md).

| 영역 | 실제 코드/원문에서 확인 | 후속 보완 |
|---|---|---|
| 전용 API | app.ts에 attendance/ministry_assignment/care_task 업무 라우트 없음 | DB/스펙 존재를 실행 API/앱 완료로 표시하지 않음 |
| 출석 대상 | attendance는 tenant/event/membership FK, 동일 조합 unique | 같은 교회 무결성과 대상 자격/현재 담당 권한은 별개. 방문자·외부인 처리 미확정 |
| 출석 상태 | 존재하는 출석 행과 occurred_at, SELF/LEADER/QR/IMPORT 방식 | 미기록=결석 아님. 출석 취소/정정 이력·버전·거절/미확정 상태 별도 계약 |
| 출석 경합 | 현 attendance에는 row_version이 없음 | 일반 ETag/If-Match를 그대로 지원한다고 주장하지 않음. 후속 동시 정정 계약 필요 |
| 봉사 배치 | 공동체/교인 FK, PROPOSED/ACCEPTED/ACTIVE/ENDED/DECLINED, starts_on/nullable ends_on | 날짜만 있는 과거 모델과 업무 권한의 정확한 시각/수락/취소/만료 모델 대조 필요 |
| 봉사 근거 | VOLUNTEERED/GIFT/SKILL/EXPERIENCE/AVAILABILITY/COMMUNITY_NEED/LEADER_DISCERNMENT 코드 | 개인 영성 평가/CHGO 자동 추천 근거 아님. 허용 코드·최소 목적·접근 검토 |
| 후속 업무 | 대상 교인·담당 교인·범주/우선순위·상태·purpose_code·기한·row_version | 대상/담당/연락 권한과 상태 전이를 API에서 검증해야 함 |
| 후속 메모 | V004의 operational_note는 V012에서 기존 값 NULL 처리, NULL 강제 | 오래된 500자 칼럼만 보고 자유 메모 UI를 추가하면 안 됨 |
| 후속 코드 | WELCOME_CALL/CONTACT_ATTEMPTED/VISIT_SCHEDULED/REFERRED/NO_RESPONSE/OTHER_NO_TEXT | OTHER_NO_TEXT도 별도 설명·첨부·음성 입력 허가 아님 |
| 소속/RLS | 같은 교회 FK·tenant RLS 있음 | RLS tenant 격리는 담당자별/대상별/필드별 권한을 완성하지 않음 |
| 기존 운영 합의 | 신청≠현장 출석, 출석 정정 권한/사유/이력, 봉사 본인 수락/거절 | API·QR·본인 출석·대량 가져오기는 방식 코드만으로 지원 완료 아님 |
| 복원 정책 | REC-010/011/019 행사 후 정정·4개 사유·최대168h; REC 업무 위임 | 수락 제안 유효168h와 실제 행사 정정 권한168h를 구분 |

현재 문서는 후속 설계의 출발점이다. 과거 마이그레이션·상태 enum·정본 ID를 수정하지 않는다. 새 DDL이 필요하면 별도 계보/후속 마이그레이션과 계약/검증을 함께 설계한다. 운영 자료를 실행·열람·삭제하지 않았다.
