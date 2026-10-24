# 공통 인증 제공자·제품별 로그인 현황 조사

2026-10-24. 상태: READ_ONLY_SOURCE_REVIEW / DESIGN. [확정 정책 COS-SSO-001~048](ACCOUNT_MEMBERSHIP_SERVICE_SCOPE_CONTRACT.md)을 구현 계약으로 옮기기 전의 사실 조사다. 공통 인증 제공자·플랫폼을 새로 선택하거나 기존 제품의 코드·DB·설정을 변경하지 않았다.

## 결론과 확인 범위

확인한 로컬 자료에서 실제 공통 인증 제공자의 선정/배포·운영 issuer·등록 클라이언트·여섯 제품 SSO 연결을 입증하는 증거를 찾지 못했다. '미확인'은 외부 서버/다른 저장소에 존재하지 않는다는 뜻이 아니다. ChurchOS JWT 검증 코드, JLPrayer OIDC 설계, 로그인 예제와 공통 인증 서버 구현을 구분한다.

조사한 경로는 `D:/JESUSLIFE_ONE`와 `D:/CHGO-VibeCodeing`의 관련 제품 폴더다. 사용자가 JLBible·JLAcademy 저장소 위치와 운영 중인 공통 인증 서버 유무는 아직 확인되지 않았다고 명시했다. 모두 NOT_VERIFIED로 유지하고 존재·선정·배포·미존재 중 어느 것도 가정하지 않는다. 이번 확인을 근거로 인증 서버를 구축하거나 다른 제품 코드를 수정하지 않는다. 원격 저장소·운영 콘솔·실제 로그인 계정·환경변수 값·실기기·사용자 DB/개인 기록은 열람하지 않았다. 루트 설정 파일 이름과 코드의 설정 변수명만 확인했고 비밀값을 문서/로그에 기록하지 않았다.

| 제품/후보 | 로그인·계정 식별의 확인 사실 | 세션/토큰·권한의 확인 범위 | 현재 판정 |
|---|---|---|---|
| ChurchOS | 앱은 DemoRole/시연 흐름. 서버는 검증된 issuer+subject를 교회별 external_subject_binding과 membership에 연결 | RS256 JWT·issuer/audience·필수 claim·exp/iat/최대 토큰 나이 검사. DB에서 활성 binding/소속/교회와 유효 역할 검사 | 검증 어댑터 구현 있음. 실제 앱 로그인/공통 계정 등록/발급자 연결은 미확인 |
| 너랑나랑 | 프로젝트 지침상 로그인·서버 API는 현재 적용 범위 밖. 앱이 HomePage로 진입. SQLite/SharedPreferences에 기록·참여자 표시 이름 저장 | lib의 Dart 43개에서 지정 인증 SDK/OIDC/HTTP 통합 지표를 찾지 못함. 현재 표시 이름은 인증 식별자가 아님 | 확인한 소스는 로컬 사용 구조. 공통 로그인/원격 API 연결 증거 없음 |
| 생명일기 Flutter | 앱의 기본 LifeDiaryEntryFactory가 ownerUserId를 `local-device-user`로 설정. entry DB에 owner_user_id 필드/소유자별 unique 제약 존재 | SQLite 공유 grant·철회·만료 검사 코드 있음. lib Dart 28개에서 지정 인증 SDK/OIDC/HTTP 통합 지표를 찾지 못함 | 로컬 소유자/공유 모델 있음. 실제 공통 인증·원격 공유/회수 증거 없음 |
| JLPrayer 1.5.1 | P0 OpenAPI에 JESUSLIFE ONE SSO(OIDC)와 authorizationCode 흐름 명세 | URL은 identity.example.invalid placeholder. 로컬 개발은 identity stub. prayer.core/moderation/operator scope와 역할 검사 설계. Gate에 실제 issuer가 파일럿 전 과제로 남음 | 설계/계약 근거. 실제 인증 서비스/파일럿 연결 검증 아님 |
| JLBible | 지정한 로컬 루트와 깊이 2 폴더 이름 조사에서 실행 저장소를 식별하지 못함 | 로그인 SDK·식별자·API audience·토큰/회수/역할 모두 미확인 | NOT_VERIFIED. 구현 없음으로 단정하지 않음 |
| JLAcademy | 지정한 로컬 루트와 깊이 2 폴더 이름 조사에서 실행 저장소를 식별하지 못함 | 위와 동일. CHGO 안의 과거 academy 언급을 독립 제품 구현으로 대체하지 않음 | NOT_VERIFIED. 저장소/운영 범위 확인 필요 |
| identity-core (ChurchOS 소비자 사본) | README만 있는 예약 경계: RESERVED FOR CONTROLLED IMPLEMENTATION | 공통 인증·계정 연결·자료 공유 분리 방향만 있음 | 실행 인증 서버의 증거가 아님 |
| JesusLife-One-API 후보 폴더 | app/main.py의 FastAPI 기본 경로와 /health. 확인한 app Python 2개에서 인증/발급/회원 경로 없음 | 지정 인증 SDK/토큰/HTTP 지표 없음 | 공통 인증 서버로 채택됐다는 증거 없는 기초 API 폴더 |
| login_tdd 후보 폴더 | lib 2개·메모리 users 비교 방식의 AuthService/로그인 화면 | 원격 제공자·토큰 발급·갱신·회수·SSO 클라이언트 없음 | 로컬 로그인 예제. 운영 인증 구현으로 재사용 확정하지 않음 |

너랑나랑/생명일기 확인 범위의 pubspec.yaml에도 인증/HTTP 통합 의존성이 없었다. 이 파일/문자열 조사만으로 모든 운영 구성의 부재나 보안 적합성을 판정하지 않는다. 생명일기 JS 폴더는 별도 로컬 CLI 기록 프로그램으로 확인했으며 Flutter 앱의 최신 인증/서버로 취급하지 않았다.

## 읽기 근거

같은 저장소 근거는 링크로, 다른 로컬 프로젝트는 재확인 가능한 절대 경로·행으로 기록한다. 다른 프로젝트의 배포 정본/승인으로 승격하지 않는다.

| 근거 ID | 위치 | 의미 |
|---|---|---|
| CO-01 | [identity.ts](../../../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/identity.ts) | JWT 검사와 원격 JWKS 어댑터. 역할/교회 claim 대신 issuer/subject 반환 |
| CO-02 | [main.ts](../../../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/main.ts) | OIDC_ISSUER/OIDC_AUDIENCE/OIDC_JWKS_URL 변수 필요. 실제 값·제공자 설정 확인 안 함 |
| CO-03 | [postgres.ts](../../../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/postgres.ts), [V002](../../../canonical/ChurchOS_Canonical_v2.6/db/migrations/V002__tenant_membership_identity.sql) | 교회별 binding/소속/역할 연결. 공통 계정 정지 전파 구현 증거와는 다름 |
| CO-04 | [OpenAPI](../../../canonical/ChurchOS_Canonical_v2.6/api/openapi/church-os-v1.yaml), [API 테스트 소스](../../../canonical/ChurchOS_Canonical_v2.6/services/church-core/test/api.test.ts) | discovery placeholder와 로컬 키/대역 기반 issuer/audience/만료/권한 차단 사례 |
| CO-05 | [앱 의존성](../../../apps/church-os/pubspec.yaml), [앱 진입](../../../apps/church-os/lib/main.dart), [identity-core](../../../services/identity-core/README.md) | 시연 앱과 예약된 인증 경계 |
| NN-01 | `D:/CHGO-VibeCodeing/neorang_narang_app/docs/governance/PROJECT_CONTEXT.md:6` | 로그인·서버 API가 현재 범위 밖임을 명시 |
| NN-02 | `D:/CHGO-VibeCodeing/neorang_narang_app/lib/app.dart:15` | 로그인 화면 대신 HomePage 진입 |
| NN-03 | `D:/CHGO-VibeCodeing/neorang_narang_app/lib/database/app_database.dart:36`, `lib/repositories/participant_preferences.dart:3` | 로컬 표시 이름·기록 저장. 인증 소유자 매핑 아님 |
| LD-01 | `D:/CHGO-VibeCodeing/CHGO-Life-Diary-Flutter/lib/data/life_diary_entry_factory.dart:5`, `lib/app/life_diary_app_shell.dart:6` | 기본 로컬 소유자를 실제 앱이 사용 |
| LD-02 | `D:/CHGO-VibeCodeing/CHGO-Life-Diary-Flutter/lib/data/life_diary_database.dart:81` | owner_user_id와 소유자/시즌/회차 unique 제약 |
| LD-03 | `D:/CHGO-VibeCodeing/CHGO-Life-Diary-Flutter/lib/data/life_diary_consent_store.dart:15` | 로컬 grant/철회/만료 검사. 네트워크 공유 검증 아님 |
| LD-04 | `D:/CHGO-VibeCodeing/CHGO-Life-Diary-Flutter/contracts/README.md` | 앱이 생명일기 정본이며 이전 계약과 실제 앱 스키마 구분 |
| PR-01 | `D:/JESUSLIFE_ONE/JLPrayer_1.5.1/17_Development_Specs/api/JLPrayer_OpenAPI_0.2.yaml:2915` | OIDC 방향·authorizationCode·placeholder·scope |
| PR-02 | `D:/JESUSLIFE_ONE/JLPrayer_1.5.1/17_Development_Specs/DEVELOPMENT_ENTRY_GATE_1.0.md:27` | Real JESUSLIFE ONE Identity issuer/URL가 파일럿 전 과제 |
| PR-03 | `D:/JESUSLIFE_ONE/JLPrayer_1.5.1/17_Development_Specs/repository/FIRST_VERTICAL_SLICE_0.1.md:8` | 로컬 identity stub을 쓰는 첫 구현 계획. 실제 구현 증거가 아님 |
| EX-01 | `D:/CHGO-VibeCodeing/JesusLife-One-API/app/main.py:10` | 기본·헬스 확인 경로 |
| EX-02 | `D:/CHGO-VibeCodeing/login_tdd/lib/auth_service.dart:1`, `lib/main.dart` | 메모리 비교 로그인 예제. 예제 자격 정보는 문서에 복제하지 않음 |

현재 관찰 위치: ChurchOS HEAD `cebe9b1` + 기존 문서 수정, 너랑나랑 main `9d2bbae`(작업 트리 변경 없음), 생명일기 main `05996c7` + 미추적 오류 로그 3개/아키텍처 문서 폴더 존재. 생명일기의 미추적 로그 내용은 열람하지 않았으며 정리/삭제하지 않았다. 위 관찰은 해당 시점 로컬 상태이지 원격 최신성/운영 배포를 보증하지 않는다.

## 공통 계약으로 옮기기 전 확인할 차이

| 발견 | 계약에 필요한 확인/설계 | 지금 하지 않는 것 |
|---|---|---|
| 표시 이름/로컬 소유자와 공통 계정 식별이 다름 | 제품별 안정적 소유자·공통 계정 연결과 기존 기기 자료의 본인 명시 연결/충돌 처리. 생명일기 unique 키·너랑나랑 함께 사용 기록의 소유 범위 확인 | 표시 이름/이메일 일치만으로 자동 연결·계정 병합·기존 owner 일괄 치환·기기 기록을 첫 로그인 사용자에게 자동 귀속 |
| ChurchOS는 교회 소속이 있는 사용자의 업무 API 중심 | 공통 계정 생성·서비스 시작·교회 가입 대기·승인 이후 접근의 별도 상태/권한 계약. 초대도 수동 승인 유지 | 활성 membership 전제 API를 일반 공통 가입/가입 대기 API로 가정 |
| v2.6은 서명/issuer/audience/시간·DB 교회 권한 검사 | 공통 계정 현재 정지/종료와 서비스별 상태/공유/작업을 제품 API가 검증할 방법. 최대 60초 차단·최신성·회수 증거 | maxTokenAge 15m 또는 JWKS 검증만으로 60초 전파/세션 회수 충족 주장 |
| JLPrayer는 identity stub·placeholder | 실제 발급자/클라이언트·PKCE 등 모바일 인증 절차 검토·API별 audience·scope와 현재 역할/동의 검사 | placeholder에 운영 의미 부여·교회 역할을 전체 scope로 자동 확대 |
| 로컬 consent/삭제·복구 모델과 공통 종료 정책 간 차이 | 로컬/오프라인 단말과 서버 정본의 처리/완료 증거, 미접속 단말/백업·최소 이력·재이용 분리 계약 | 원격 서비스가 모든 오프라인 사본을 7일 안에 삭제했다고 보장 |
| 실제 제공자 미확인 | 제공자 운영 주체·계정/테넌트·지역·지원 기능·비밀 외부 관리·장애 대응 확인 | 임의 공급자 선정·계정 생성/배포·가격/지원 단정 |

기존 로컬 기록은 보존하며 표시 이름이나 이메일 일치만으로 공통 계정에 자동 연결하지 않는다. 안전한 본인 확인·명시 연결·충돌 처리의 구체 계약은 미결이다. 기존 기록의 계정 연결과 로컬/오프라인 범위는 새 설계 제안/확인 과제이며 이번 조사로 마이그레이션을 승인·구현한 것이 아니다. 현재 48개 정책 합의와 독립 제품 정본/생명일기 수집 금지를 유지한다.

## 공급자 확인 체크표

상태는 아래 모두 NOT_VERIFIED다. 후보별 문서/설정·실행 근거를 받아 동일 표로 비교한 뒤 선택한다. SDK나 화면에 로그인이라는 이름이 있다는 이유로 PASS로 표시하지 않는다.

| 확인 항목 | 필요한 근거 |
|---|---|
| 선정/운영 실체 | 실제 운영 주체·승인된 공급자/설치 위치·issuer/discovery·등록 클라이언트. 비밀값 제외 |
| 모바일 반복 로그인 최소화 | 각 앱 클라이언트·복귀 경로·안전한 코드 흐름·유효 세션 재활용·필요한 추가 인증·계정 전환 |
| 서비스별 API 토큰 | audience/허용 scope·issuer/서명/시간 검증·클라이언트/제품 분리·안전한 저장/갱신 |
| 계정/로컬 자료 연결 | 안정적 식별·제품별 매핑·명시 연결·충돌/복구·기존 기록 보존·재가입 분리 |
| 정지/종료·회수 | 현재 상태 전달·기존 세션/갱신·접근 차단·60초 상한·상태 공급 장애/최신성·외부 로그인 해제 지원 |
| 권한 경계 | 서비스 시작/교회 승인/역할/공유 분리·현재 서버 권한·계정/교회 전환·최종 확정 전 재검증 |
| 종료·자료/백업 | 운영본 7일·백업 잔존30일 지원·최소 참조/이력·복구 재삭제·부분 실패·확인 경로·로컬/오프라인 범위 |
| 운영 준비 | 안전한 본인 확인·분실/탈취 복구·역할 지정·감사·민감 로그 제외·이의신청·운영 인력/지원·제공자 계약 |

## 다음 산출물과 이번 종료 조건

이번 사실 조사 문서는 완료했다. JLBible·JLAcademy와 별도 운영 인증의 위치/현황은 사용자 확인에 따라 미확인으로 남긴다. 이후 근거가 확보되면 같은 인벤토리를 갱신한다. 현재 정보만으로 공급자를 선택하거나 새 제품 의사결정 인터뷰를 늘리지 않는다.

후속 산출물은 C01의 제공자별 기능 대조와 인증/식별 매핑 계약, C02의 가입 대기→수동 승인 계약이다. 새 사용자 기준의 작은 검증 흐름은 '공통 로그인 → ChurchOS 가입 대기 → 담당자 승인'이며, 실제 제공자/토큰 획득과 권한 차단 근거를 확인하기 전 성공으로 표시하지 않는다. 기존 로컬 기록의 연결은 별도 보존 설계를 먼저 해야 한다.

## 검증과 한계

- 소스/설계 파일 열람 및 한정된 인증/네트워크 통합 지표 검색: 수행. 검색의 미검출만으로 서비스 전체 부재를 판정하지 않음.
- 다른 저장소 수정·계정/실제 설정 값 열람·개인 DB 조회·의존성 설치·원격 push/PR/배포: 수행하지 않음.
- 기존 의존성/Flutter 실행·앱 로그인·제공자 연결·토큰 발급/갱신/회수·60초 차단·자료 연결/삭제/복원: NOT_RUN.
- 너랑나랑은 프로젝트 AGENTS와 neorang-narang-dev 스킬의 관련 지침을 읽고 현재 구조만 조사했다. 초기에 루트에서 찾지 못한 PROJECT_CONTEXT/CHECKLIST는 실제 docs/governance 경로에서 확인했다. git -C 경로 사용 시 소유권 경고가 있었으나 전역 safe.directory를 바꾸지 않았고 해당 작업 디렉터리의 읽기 명령으로 확인했다.
