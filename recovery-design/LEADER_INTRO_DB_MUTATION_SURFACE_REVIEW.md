# DB 함수·트리거·권한의 상태변경 경로 조사

2026-10-30 / r92 / STATIC_SQL_REVIEW / PARTIAL_RECOVERY / 실DB 검증 NOT_RUN

## 조사 범위와 근거

[기존쓰기경로 조사](LEADER_INTRO_WRITE_PATH_BASELINE_REVIEW.md)의 WG01/02를 이어 canonical v2.6 [V001~V015 마이그레이션](../canonical/ChurchOS_Canonical_v2.6/db/migrations/), [DB검증 도구](../canonical/ChurchOS_Canonical_v2.6/tools/db_verify.py), [API통합검증 역할구성](../canonical/ChurchOS_Canonical_v2.6/services/church-core/integration/verify.ts), [RLS 자세 검사](../canonical/ChurchOS_Canonical_v2.6/db/security-tests/00_posture_assertions.sql)를 읽고 정적대조했다. 실제DB 카탈로그/실효권한·배포 역할/상속·운영수정 이력은 조회하지 않았다. GitHub 최신동기화·운영침해 재현·새권한 승인 결과가 아니다.

## 상태변경 가능 주체: DB와 앱 권한 구분

V001의 church_os_app/auditor는 NOLOGIN 그룹역할이며 앱사용자 역할 TENANT_ADMIN/PASTOR/LEADER와 다르다. 검증도구는 별도 로그인 역할을 만들고 church_os_app을 부여한다. NOLOGIN 자체가 권한을 사용할 수 없다는 뜻은 아니다. 실제 운영 로그인/역할상속·SET ROLE·소유자는 미확인이다.

V008은 앱역할에 교회업무·접근제어·연동 테이블의 SELECT/INSERT/UPDATE를 준다. V007의 정책은 tenant_id=current_tenant_id() 및 WITH CHECK 교회격리이며 현재 본인·리더직함·세부업무권한·소개동의를 판정하지 않는다. RLS가 ENABLE/FORCE라는 사실만으로 모든 앱 업무권한이 DB에서 검증된다고 해석하지 않는다.

## 직접 DML 경로 목록

아래는 마이그레이션이 앱그룹역할에 부여한 권한이다. API 존재/사용자 승인/현재 로그인 실효권한과 구분한다.

| ID | 대상 | 허용된 변경/후속수정 | 설계에 미치는 영향 |
|---|---|---|---|
| DBW01 | membership/community/community_member | V008 SELECT/INSERT/UPDATE | 소속/공동체/직함 상태를 바꿀 DB경로 존재·API없음과 DB불가를 혼동하지 않음 |
| DBW02 | external_subject_binding/tenant_role/membership_role | V008 SELECT/INSERT/UPDATE | 인증연결/역할/기간 변경 가능·본인소개 권한과 별도 검증 필요 |
| DBW03 | campus/church_event/attendance/care_task/ministry_assignment/brand_config | V008 SELECT/INSERT/UPDATE | 운영원본 변경 가능·일부 버전트리거/제약이 업무행위 권한을 대체하지 않음 |
| DBW04 | integration_connection/external_state_ref/outbox_event/idempotency_record | V008 SELECT/INSERT/UPDATE | 요청/연동 상태 변경 가능·영수증 변경권한은 불변최종결과 정책과 별도 보호 검토 |
| DBW05 | notice/file_asset/notification_delivery | V012 SELECT/INSERT/UPDATE | 공지/파일메타/알림 변경 가능·file_asset owner_type은 NOTICE/EVENT이며 리더사진모델 아님 |
| DBW06 | handoff_grant | V011 쓰기부여 뒤 V012 UPDATE 철회·consumed_at/revoked_at 컬럼 UPDATE만 부여 | 인계권 사용/철회만 수정·불변필드/재개 금지트리거 있음 |
| DBW07 | registered_return_uri | V012 SELECT/INSERT/UPDATE/DELETE | 허용URI 변경의 DB경로 존재·기존FK와 운영관리권한 검토 필요 |
| DBW08 | tenant/system_role_template | V008 SELECT만 부여 | 앱직접 tenant상태수정 권한을 부여한 것으로 쓰지 않음·소유자/운영 별도 |
| DBW09 | audit_event | append_event 함수로 INSERT; V012 앱SELECT 추가·auditor SELECT | 직접UPDATE/DELETE 미부여+트리거 차단·조회목적/최소필드 권한 별도 |

DBW01~05에 DELETE/TRUNCATE가 부여됐다고 확대하지 않는다. DELETE 권한이 없어도 UPDATE로 상태를 바꾸는 경로는 남는다. 표는 모든 운영권한을 확정하는 카탈로그가 아니라 명시적 마이그레이션 권한의 누적대조다. 역할추가/소유권/운영수정이 있으면 실제카탈로그를 다시 확인해야 한다.

## 함수와 자동변경 목록

V001~015에서 정의한 최종 함수 이름은 아래 8종이며 jsonb_has_forbidden_key는 V012에서 재정의된다. 함수본문 텍스트를 읽은 결과이지 실제 설치/EXECUTE 성공 검증은 아니다.

| 함수 | 실행 성격/효과 | 보호하는 것/보호하지 않는 것 |
|---|---|---|
| current_tenant_id | invoker·세션설정 읽기 | 서버수립 컨텍스트 사용·DB에서 사용자 JWT를 재인증하지 않음 |
| current_actor_ref | invoker·세션설정 읽기 | 행위자 참조·소속/권한 증명 자체 아님 |
| touch_row | invoker·BEFORE UPDATE, updated_at/row_version 증가·brand_config version 증가 | 버전갱신·권한/업무상태전이/직함종료 보장 아님 |
| jsonb_has_forbidden_key | invoker·JSON키 재귀검사 | V012 별칭/Q문항키 차단·모든 자연어 개인정보 검출기 아님 |
| guard_outbox_payload | invoker·금지키면 예외 | outbox payload INSERT/UPDATE 보호·일반업무원문 전반 보호함수 아님 |
| deny_audit_mutation | invoker·예외 | audit UPDATE/DELETE 차단·TRUNCATE/소유자DDL 우회까지 보장하지 않음 |
| append_event | SECURITY DEFINER·최소감사 INSERT | tenant/actor 컨텍스트 존재·decision 허용값 검사·업무권한/원문 자동마스킹/소개변경 함수 아님 |
| guard_handoff_mutation | invoker·불변필드/consumed·revoked 재개 차단 | 인계권 변경제약·소개철회/사진세대 보호와 별개 |

append_event는 고정 search_path·PUBLIC EXECUTE 회수·앱 EXECUTE 부여가 있다. 함수 SECURITY DEFINER를 이유로 모든 RLS를 항상 우회한다고 말할 수 없다. 실제함수 소유자/FORCE RLS/소유역할특성과 적용컨텍스트를 확인해야 한다. 사용자입력 actor/tenant를 믿을 수 있는 API컨텍스트로 바꾸는 책임도 별도다.

## 동적 트리거와 버전 갱신 대상

V006의 루프는 touch_row 트리거를 tenant/campus/membership/community/church_event/care_task/ministry_assignment/brand_config/integration_connection/external_state_ref/outbox_event 11개 테이블에 만든다. V012 notice_touch 1개, outbox_guard/audit_append_only/handoff_immutable 각각 1개를 합쳐 마이그레이션 정의상 트리거 대상은 15개다. 실제 pg_trigger 수를 조회한 결과가 아니다.

community_member·membership_role·external_subject_binding·tenant_role에는 이 루프의 touch_row가 없다. community에 row_version이 있다는 사실을 community_member의 리더지정 버전으로 대신 쓰지 않는다. attendance/파일메타/알림/영수증에도 위루프 버전갱신이 적용된다고 가정하지 않는다. 트리거 명시/동적대상을 모두 읽어 판단했으며 코드검색에서 create trigger 문자열 개수만 세지 않았다.

V012의 트리거관련 EXECUTE GRANT와 주석은 이행 기록이다. 트리거 호출/함수 EXECUTE의 실제 동작 판정은 설치/역할/트리거 정의 및 실DB 확인 없이 주석만으로 단정하지 않는다. 이번 조사에서 새 실행 권한을 추가하지 않았다.

## 후속 마이그레이션의 영향

V011 handoff_grant·RLS/권한, V012의 handoff 컬럼제한/불변트리거·공지/파일/알림·등록URI를 누적 반영했다. V013은 Academy 제공자 제약을 확장하지만 LIFE_DIARY/CHGO 개인상태를 external_state_ref에 다시 허용하지 않는다. V014/015는 성공영수증 자원/생성시각/행버전 메타를 추가하며 새소개/동의/사진·실패최종성/후속연결 보호를 구현하지 않는다.

V012의 마이그레이션 내부 데이터정리/NO FORCE→FORCE 복구와 검증fixture/seed 쓰기는 런타임 일반사용자 업무 API가 아니다. 소유자·마이그레이션역할·backup BYPASSRLS는 검증도구에서 보이지만 앱운영로그인과 동일시하지 않는다. 운영에서는 별도 증거가 필요하다.

## 기존 후보S와 연결해야 할 지점

DBW01/02의 직접상태변경은 앱 새소개경로의 멱등락과 다른경로다. 최신소속/지정·공개동의/사진차단 검사를 소개함수에만 넣고 직접UPDATE를 그대로 두면 공통보호가 강제되지 않을 수 있다. 해결 후보는 (A) 제한된 변경명령/DB함수와 최소권한 또는 (B) 모든허용쓰기 경로가 동일보호/조건부쓰기 규칙을 적용하고 우회가능 권한을 통제하는 방식이다. 둘 다 미선정이며 새 SECURITY DEFINER 함수가 안전성을 자동보장하지 않는다.

DB함수로 제한한다면 현재본인/교회/업무목적/지정/동의/버전 및 안전한 search_path·소유자/EXECUTE·직접DML 제거범위·기존API 호환·복원/정리경로를 함께 설계해야 한다. 권한회수부터 실행하거나 canonical을 고치지 않는다. 관리자 무제한 직접SQL을 새운영기능으로 승인하지 않는다.

## 실DB 검증 전 남는 확인

실제 pg_roles/pg_auth_members·pg_class 소유권·pg_proc ACL/보안모드/search_path·pg_policy·pg_trigger와 실제권한을 대조해야 한다. 런타임 로그인/역할상속/기존 PUBLIC 기본권한·운영추가권한·마이그레이션 drift는 아직 미확인이다. 기존자세검사는 23개 보호테이블 ENABLE/FORCE 여부 등을 확인하도록 작성됐으나 새소개 업무권한/경합검증을 대신하지 않는다. 과거PASS를 이번실행 PASS로 승계하지 않는다.

CA137은 앱DB그룹역할·앱사용자역할/RLS교회격리·직접DML 차이를, CA138은 후속GRANT/REVOKE/동적트리거·특권함수/운영우회/지정버전 공백을 검증할 인계조건이다. 실제DB 실행 NOT_RUN이다.

다음은 직접DML 제한/전용변경명령 두 후보의 기존API 호환과 최소권한 이행표를 설계하는 단계다. WG01은 마이그레이션정적목록까지 진행했고 실제카탈로그/운영 drift 미확인, WG02는 런타임외 배치/운영경로 추가확인이 남았다. 설계완료/보안취약점 재현/침해를 주장하지 않는다.
