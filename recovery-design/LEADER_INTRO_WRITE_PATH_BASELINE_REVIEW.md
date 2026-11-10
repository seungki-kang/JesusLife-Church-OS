# 기존 쓰기경로와 리더 소개 보호 후보 대조

2026-10-30 / r91 / STATIC_CODE_BASELINE_REVIEW / PARTIAL_RECOVERY / 실행 NOT_RUN

## 범위와 실제 증거

[r90 저장/버전/경합 후보](LEADER_INTRO_STORAGE_VERSION_RACE_DRAFT.md)를 보존된 canonical v2.6에 대조했다. 이것은 GitHub 최신 코드 조회나 배포환경 검사 결과가 아니다. 현재 누적본의 canonical 파일 바이트를 읽었고 실제 서버/DB/앱은 실행하지 않았다.

- [app.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/app.ts): 현재 요청 인증/목적·소속/역할, create/mutate 경로, ETag/If-Match.
- [ports.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/ports.ts): Kind는 memberships/notices/events, SessionPort의 create/mutate/detail/list/roles/tenant.
- [postgres.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/postgres.ts): PgSession의 create/mutate/roles·PgStore.scoped 트랜잭션.
- [lifecycle.ts](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/lifecycle.ts): 공지/일정 병합·공개판단 계약.
- [V003 공동체/역할 스키마](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V003__access_community.sql): membership_role/community/community_member.

위 서비스 src의 소개/동의철회/사진공개 전용경로와 membership/community_member 갱신 호출을 조사했으나 해당 구현은 확인되지 않았다. 이는 저장소 전체 SQL/배치/관리수정 경로를 빠짐없이 조사했다는 주장이 아니다. 예제 fixture/DB검증 SQL은 운영 쓰기 API로 세지 않는다.

## 실제 쓰기와 보호 연결표

| ID | 현재 코드/경로 | 확인한 보호/동작 | 소개 설계에 필요한 차이 | 상태 |
|---|---|---|---|---|
| WB01 | POST memberships/notices/events | scoped 인증/소속 뒤 TENANT_ADMIN·입력/키검증; create 경로별 멱등잠금/성공영수증 | 본인소개 행위별 권한·관련자원 공통보호 추가; 교인생성은 가입승인/소개생성 아님 | 기존코드 확인/소개적용 없음 |
| WB02 | PATCH notices/events 및 publish/cancel | TENANT_ADMIN·If-Match·멱등키·대상행 FOR UPDATE·버전조건부쓰기 | 소개본인권한/초안공개분리/동의·사진·지정 세대 필요 | 기존코드 확인/소개대체 불가 |
| WB03 | PgSession.roles | external_subject_binding/tenant/membership ACTIVE와 역할 유효기간 조회 | 현재 공동체 참여/실제리더 지정·철회/사진상태 미검증; 이 조회만으로 최종경합 보호 불가 | 현재소속/역할 조회만 확인 |
| WB04 | PgStore.scoped | 안전한 DB역할 점검·BEGIN·로컬 tenant/actor·5초 statement_timeout·COMMIT/ROLLBACK·release | COMMIT불명 처리/내구실패·소개결과투영·확정시각 증거 추가설계 | 트랜잭션 뼈대만 확인 |
| WB05 | community_member | 동일교회 복합참조·공동체/교인 unique·role/status | 현재직함 원본 후보지만 기간별지정 이력/row_version·대체참조/종료/재지정 전이 없음 | 스키마 일부만 존재 |
| WB06 | membership_role | 교회별 role참조와 valid_from/until·unique | 교회역할과 공동체직함·소개공개동의는 다른 근거; 같은것으로 매핑 금지 | 별도권한 스키마 존재 |
| WB07 | LA01~07 소개편집/게시/동의/사진 | 해당 컨트롤러/포트/전용저장소 확인 안 됨 | 본인 범위/동의/사진세대·공통보호·최소감사/결과 계약부터 설계 | 미구현 |
| WB08 | LA08/09 공개소개/본인최소결과/후속발견 | 기존상세는 notices/events; 소개 전용조회 확인 안 됨 | 현재공개·과거결과·후속관계 권한/응답/수명 분리 | 미구현/정책OPEN |
| WB09 | 소속정지/종료·직함종료/재지정·대상변경 | 조사한 src에 해당 전용 갱신경로 확인 안 됨 | 이후생기는 모든경로가 후보S/실제원본 버전계약 참여 필요 | 경로추가조사/미구현 |
| WB10 | 복원/수동수정·외부계정·미디어 | src만으로 운영전체 경로 확인 불가 | 복원격리·최신차단 재적용·우회차단·외부최신성/파일ACL | 운영근거 미확인 |

WB01/02의 TENANT_ADMIN을 그대로 복사하면 ‘본인 소개 편집·철회/사진제어’ 합의와 맞지 않는다. 기존관리자경로를 느슨하게 풀어 모든업무에 본인쓰기 권한을 주는 방식도 허용하지 않는다. 소개별 본인/행위/현재근거를 분리 설계해야 한다.

## 공지/일정 잠금이 소개 보호를 대신하지 못하는 이유

create/mutate의 멱등잠금은 tenant+actor+route+key 범위다. 서로 다른 actor/route/key인 게시와 철회/직함종료는 이 잠금만으로 직렬화되지 않는다. mutate의 FOR UPDATE는 해당 notice/event 행이며 현재 공동체직함/동의/사진차단 기록 전체를 보호하는 잠금이 아니다.

roles 조회에는 해당원본을 동시변경과 결속해 보호하는 FOR UPDATE가 보이지 않는다. now() 기반 역할기간 조건과 트랜잭션 시작/커밋 사이 자연만료 문제는 별도다. 이 정적 확인은 현재 코드의 실제 취약점 재현/침해 확인이 아니라 새로운 소개 보장을 그대로 주장할 수 없다는 근거다.

현재공지 PATCH는 게시중 행을 직접 변경할 수 있는 계약을 가진다. 리더 소개의 초안/유효공개본 분리와 사진차단 투영을 공지 status 값만으로 흉내 내지 않는다. 공지/일정 enum/경로를 새소개 전이로 조용히 바꾸지 않는다.

## COMMIT 오류와 실패투영 보완 필요

scoped는 COMMIT 중 오류가 나도 catch에서 ROLLBACK을 호출한다. 이 형태만으로 COMMIT 응답유실 시 실제 미반영이 입증되지 않는다. 실제 서버가 이미 커밋했다면 후속 ROLLBACK 호출은 과거 성공을 되돌렸다는 증거가 아니다. 원오류/롤백오류 구분·최종근거 조회·실행차단 계약을 추가로 설계해야 한다.

기존성공 영수증 24h/만료409·입력충돌·REPLAY_SUPERSEDED는 보존한다. 실패/미확정 최소결과·후속관계·168h조회 및 실제확정시각은 현재코드가 구현했다고 쓰지 않는다. 신규 기능 구현 전 구클라이언트 실패/재생 의미의 호환도 정해야 한다.

## 설계 인계에서 재사용/추가할 것

재사용 검토 가능: 검증된 principal과 tenant/목적 경계, 안전한 DB역할, scoped 연결관리, parameterized SQL, 기존 멱등동일성/버전 계약, 원문 없는 최소감사 구조. 재사용을 확정한 구현 명세는 아니다.

추가설계 필요: 본인소개 행위별 권한·지정/소속 원본과 공통보호·실제 지정이력/버전·동의/사진세대·초안/공개본 참조·확정단위/커밋불명·읽기결과/후속발견·미디어/복원·기산/보유. 새테이블/마이그레이션을 즉시 만들지 않는다.

## 누락경로 조사 게이트

| 게이트 | 확인해야 할 근거 | 현재 판정 |
|---|---|---|
| WG01 | canonical 전체마이그레이션/함수/트리거/권한에서 실제 상태변경 가능주체 | 부분src/V003 조사만·미완료 |
| WG02 | 소속/지정/공개제어의 각원본과 모든애플리케이션·배치·관리쓰기 경로 | 미구현/운영미확인 혼재 |
| WG03 | 외부계정/미디어·복원·정리/삭제 작업의 우회·재공개 차단 | 운영근거 미확인 |
| WG04 | 새소개 후보의 구API/키/버전/역할·마이그레이션 계보 호환 | 설계전대조 필요 |

CA135는 공지/일정/교회역할 기존검사만으로 본인소개/동의/사진/지정 경합 보호를 충족했다고 판정하지 않는 조건이다. CA136은 COMMIT오류 뒤 ROLLBACK 호출만으로 실패확정/자동재시도를 허용하지 않고 구실행/내구결과 증거를 확인하는 조건이다. 모두 실행 NOT_RUN이다.

## 다음 작업

WG01/02를 먼저 조사해 DB 함수/트리거/권한과 실제 상태변경 원본을 목록화한다. 조사 뒤 보호 후보S와 연결할 작업범위를 좁힌다. GitHub 최신파일·외부 Core 상태·운영배포 완료로 확대하지 않는다. 기존 canonical/코드/DDL/Git 이력은 변경하지 않는다.
