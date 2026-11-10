# 교회 홈·공지·일정 — v2.6 구현 대조

2026-10-28 / SOURCE_REVIEW / canonical 바이트 보존 / 실제 앱·DB 실행 NOT_RUN

근거: [app.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/app.ts), [lifecycle.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/lifecycle.ts), [postgres.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/postgres.ts), [기존 상세 설계 5.2](../docs/operations/ecosystem-v1/DETAILED_DESIGN_V1.5.md#52-공지와-일정).

| 축 | 현재 코드에서 확인 | 후속 계약 주의 |
|---|---|---|
| 인증·소속 | Bearer·대상 교회·목적 CHURCH_OPERATION·현재 유효 소속/역할 검사 | 대기자/비로그인 공개 홈을 이 API로 제공한다고 선언하지 않음 |
| 쓰기 | 생성/수정/게시/cancel은 TENANT_ADMIN | 편집자·게시자 위임은 새 서버 검증 필요. 직함만으로 부여 금지 |
| 일반 목록 | 공지/행사 PUBLISHED 중심, UUID 순서·커서. 관리자도 일반 목록이 초안함은 아님 | 관리 목록·정렬·필터·페이지 계약 별도 |
| 상세 | 관리자 상세는 모든 상태 허용. 비관리자는 공개 조건 충족 시만 | 위임자의 관리 상세 범위 추가 필요. 관리자 상세 권한을 성도 화면에 전용 금지 |
| 공지 대상 | ALL_MEMBERS / LEADERS / STAFF, 현재 역할에 따라 검사 | ALL_MEMBERS는 인터넷 공개 아님. STAFF는 비관리자 중 PASTOR, LEADERS는 정해진 리더/목회자 역할 |
| 공지 게시 시각 | publish action은 PUBLISHED로 바꾸며 미래 publish_at은 일반 열람에서 숨김 | 예약 실행 작업을 구현한 것이 아님. 시각 경과 시 서버 필터로 가시성 변화 |
| 공지 종료 | expires_at<=현재이면 비관리자 목록/상세 제외 | 시간 경과가 DB 상태를 EXPIRED로 바꾸는 배치 구현 아님 |
| 일정 열람 | PUBLISHED이고 community_id null인 일반 일정만. 관리자 상세는 별도 | 공동체 ACL 미구현. 전체 관리 목록이나 공개 외부 일정 API로 해석 금지 |
| 일정 날짜 필터 | starts_at>=from, starts_at<=to. 필터 없으면 과거 게시 행사도 포함 가능 | 기간 교차 행사/진행 중 포함과 종료 경계는 후속 달력 계약 |
| 수정 | PATCH에 공지는 title/body/audience/publishAt/expiresAt/status, 일정은 title/startsAt/endsAt/campusId/status | 일정 kind/timezone/communityId 변경은 현 PATCH 범위 밖 |
| 게시 후 수정 | PUBLISHED 상태의 허용 내용 PATCH가 같은 행을 바꿈. 별도 승인본 스냅샷 없음 | 편집만으로 게시본이 바뀌지 않게 하려면 수정본/게시본 분리 필요 |
| 상태 변경 우회 | PATCH의 status로 DRAFT→PUBLISHED 또는 CANCELLED 전이 가능 | 미래 역할 분리 시 전용 publish/cancel 경로뿐 아니라 PATCH status도 검증 |
| cancel | CANCELLED로 종결, 이후 수정/재게시 차단. PUBLISHED→DRAFT 금지 | “잠시 숨김→재게시”와 물리 삭제는 미구현 |
| 완료/만료 enum | COMPLETED/EXPIRED 같은 상태가 모델에 있어도 mergeMutation은 새 진입을 거절 | 앱 완료 버튼·자동 완료/만료 동작을 구현됐다고 표시하지 않음 |
| 동시 수정·재생 | 상세 ETag, 쓰기 If-Match/멱등 키, 기존 428/412/409. 재생 시 버전 변경이면 REPLAY_SUPERSEDED | 자동 덮어쓰기/새 키 재실행 금지. 신규 최소 결과 조회는 별도 설계 |
| 캐시 | 응답 no-store, 서버 일반 로그 비활성 및 최소 감사 | 기기 원문 영구 캐시·공개 소개7일 정책을 내부 공지/일정으로 확대 금지 |

이 표는 후속 계약의 차이를 확인한 것이며 기존 관리자가 게시물을 수정하는 동작 자체를 새 보안 결함으로 판정한 것이 아니다. 역할 분리 요구를 붙일 때의 보완 지점이다. 기존 OpenAPI·V001~V015·서비스 코드는 수정하지 않았다.
