# ChurchOS 개발 설계 통합 안내

이 문서는 개발자가 현재 적용할 기준과 남은 결정을 찾는 출발점이다. 운영 설계 브랜치의 Git 이력을 보존하고, r175 복원본에서 인계에 필요한 설계와 참조 문서를 선별했다. r175는 일부 소실 자료가 복원되지 않은 보존본이다.

| 무엇을 확인할 때 | 읽을 문서 |
|---|---|
| 제품·계정·교회 권한 | [운영 검토](docs/operations/ecosystem-v1/END_TO_END_OPERATIONS_REVIEW.md), [상세 설계](docs/operations/ecosystem-v1/DETAILED_DESIGN_V1.5.md), [계정·소속 계약](docs/operations/ecosystem-v1/ACCOUNT_MEMBERSHIP_SERVICE_SCOPE_CONTRACT.md) |
| 승인된 결정과 복원된 결정 | [COS 결정 원장](docs/decisions/DESIGN_DECISIONS.md), [REC 결정 원장](recovery-design/RECOVERY_DECISIONS.md) |
| 교회 앱 도입·메뉴 선택 | [담임목사님 중심의 도입과 선택형 교회 앱](recovery-design/WHITE_LABEL_SETTINGS_DISTRIBUTION_DRAFT.md#담임목사님-중심의-도입과-선택형-교회-앱) |
| 교회별 디자인·쉬운 설정·방문 안내 | [화이트라벨 기획·첫 버전 화면 설계 인계](recovery-design/WHITE_LABEL_DESIGN_HANDOFF_2026-11-11.md) |
| 기본 MVP 개발 인계 | [기능별 개발 인계](recovery-design/BASIC_MVP_DEVELOPMENT_HANDOFF.md), [구현 차단표](recovery-design/IMPLEMENTATION_BLOCKER_REGISTER.md), [검증 게이트](recovery-design/DESIGN_HANDOFF_GATES.md) |
| 공동체와 소개 철회 | [공동체 계약 초안](recovery-design/COMMUNITY_LIFECYCLE_CONTRACT_DRAFT.md), [철회 인계 판정](recovery-design/LEADER_INTRO_INTEGRATED_REVIEW_4_HANDOFF_VERDICT.md), [확정 시각·조회 종료 초안](recovery-design/LEADER_INTRO_FINAL_TIME_PROOF_QUERY_BOUNDARY_DRAFT.md) |
| 구현이 실제로 있는 위치 | [canonical v2.6](canonical/ChurchOS_Canonical_v2.6/README.md), [앱](apps/church-os/README.md) |
| 통합 검증·자료 출처 | [자료 범위와 검증 상태](recovery-design/README.md), [T1 격리 실험 상태](recovery-design/t1-basic/README.md) |

## 개발 착수 기준

- ChurchOS는 교회 운영과 화이트라벨 앱의 진입점이다. 공통 계정의 인증, 교회별 소속과 역할, 전문 제품의 원본·동의·권한을 분리한다. 제품별 서버·배포와 API 경계를 유지한다.
- COS의 승인 범위와 REC의 명시적 합의 범위를 우선 확인한다. 복원 문서의 역사적 초안·권고·미결 사항은 승인된 계약으로 승격하지 않는다. 이전 초안과 후속 결정이 다르면 후속 결정의 범위와 근거를 확인하고 불명확한 부분은 구현 전에 해소한다.
- [REC-096~098](recovery-design/RECOVERY_DECISIONS.md#rec-096-단일-의도-키서버-참조읽기-전용-결과-확인)은 새 본인 소개 철회에 한정한다. 단일 의도 키·읽기 전용 결과 확인, 별도 목적 결과 저장, 검증된 최종 확정 시점부터 168시간 조회를 정했다. 기존 일반 API 영수증의 24시간 정책과 마이그레이션은 유지한다.
- 철회 기능의 구현 전에는 정확한 확정 시각, 현재 권한·경합, 결과 조회와 삭제·복구 보호를 검증해야 한다. 앱/DB/SSO 운영 검증과 파일럿은 진행되지 않았다. 준비된 교회 기본 기능은 해당 기능의 차단 조건에 따라 별도로 인계할 수 있다.
