# 공동체 가입·이동·리더·명단·종료 — 구현 기준 대조

2026-10-29 / SOURCE_REVIEW / PARTIAL_RECOVERY / 실제 API·DB·앱 실행 NOT_RUN

근거: [V003](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V003__access_community.sql), [V006](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V006__integrity_triggers.sql), [V007](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V007__row_level_security.sql), [app.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/app.ts), [postgres.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/postgres.ts), [상세 설계 권한표](../docs/operations/ecosystem-v1/DETAILED_DESIGN_V1.5.md), [일반 업무 결정](RECOVERY_DECISIONS.md).

| 대상 | 확인된 기존 구조 | 후속 차이 |
|---|---|---|
| 공동체 | GROUP/CELL/DEPARTMENT/TEAM/MINISTRY, name1~160, ACTIVE/ARCHIVED, parent_id, row_version | 종류만으로 주공동체/복수 참여/승인 정책을 정한 것 아님 |
| 계층 | 같은 tenant의 부모 FK·자기 자신 부모 금지 | 다단계 순환/깊이 제한/부모 변경·범위 전파를 보장하는 정책 아님 |
| 구성원 | tenant/community/membership FK, 조합 unique, MEMBER/LEADER/ASSISTANT, ACTIVE/INACTIVE | 신청/배정 제안·본인 수락·거절·철회·이동 이력은 별도 필요 |
| 구성원 동시성 | community_member에 row_version·이력기간 칼럼 없음. V006 touch 목록에도 없음 | 공동체 자체 ETag와 개인 참여/이동/권한 버전을 같다고 가정하지 않음 |
| 역할 | community_member.member_role과 별도 membership_role 테이블 | LEADER/ASSISTANT 값을 관리자/연락/심사/게시 권한으로 자동 변환하지 않음 |
| FK/RLS | 같은교회 참조 + tenant RLS | 현재 유효소속·담당공동체·필드별 ACL·연락 동의는 별도 검사 |
| API | app.ts에 공동체/구성원 전용 관리·가입·이동 라우트 없음 | DB/예시가 사용자 사용 가능한 기능이라는 뜻 아님 |
| 일정 | 일반 일정 조회는 community_id null만 포함, 비관리자 상세도 제한 | 공동체 대상 일정 ACL 구현 전 모든 교인에게 풀어주지 않음 |
| 명단 | 상세 설계는 리더에게 맡은 공동체 최소 범위, 연락은 명시 업무위임/본인 선택 | 공동체 가입만으로 구성원 전체명단/연락처 열람 자동 허용 아님 |
| 일반 업무 위임 | REC 지정·수락·범위·기간·해제 원칙 | 리더 직함/공동체 참여기간에 일반업무 최대1년을 자동 적용하지 않음 |

기존 마이그레이션·canonical·앱/서버·COS/REC는 변경하지 않았다. 아래 상세 초안은 데이터 구조와 실제 운영 정책 사이의 차이를 메우는 인계이며, 새 API·DDL·역할이 구현됐다는 선언이 아니다.
