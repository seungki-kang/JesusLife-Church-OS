# 설계 검토 변경 요약 — GitHub 저장 전 확인본

2026-10-24. 사용자 요청에 따라 확정/OPEN·수정 파일·문서 충돌과 저장 범위를 정리했다. 변경은 문서/기능표이며 서버 구축·코드/DB·다른 제품 수정·원격 저장은 실행하지 않았다.

## 이번에 정리한 내용

| 범위 | 현재 합의 | 남은 경계 |
|---|---|---|
| 교인 가입 | COS-JOIN-001~039: 초대도 담당자 승인·일반 교인만 부여·교회별 소속/역할·연락처 목적/철회·중복/경합 원칙 | COS-JOIN-040 결과 정정 권한은 OPEN. API/상태·세부 절차·실행 증거는 미완료 |
| 교회 개설 | COS-CHURCH-001~040: 교인 가입과 별도 심사. 소속증명서·고유번호증 기본 2종과 미확인 항목의 최소 보완 | 실제 발급/유효성/필드·기관/개별 관계 확인·심사자 자격/선임·운영 채택은 OPEN |
| 공통 계정/SSO | COS-SSO-001~048: 6제품 공통 인증·독립 데이터/권한·교회/서비스/공통 탈퇴·보안 정지·공유/작업 차단·삭제/백업·실패/복구/재가입 | 실제 제공자·식별/세션/토큰/상태 계약·기존 로컬 자료 연결·운영/실행 검증은 후속 과제 |
| 조사 사실 | ChurchOS JWT 검사·너랑나랑/생명일기 로컬 모델·JLPrayer OIDC placeholder를 구분해 기록 | JLBible·JLAcademy 저장소 및 운영 공통 인증 서버 유무는 사용자도 미확인. 구현/운영이 있다고 가정하지 않음 |

기존 로컬 기록은 보존하며 표시 이름·이메일 일치만으로 공통 계정에 자동 연결/병합하지 않는다. 본인 확인·명시 연결·충돌 처리의 구체 계약은 미결이다. 실제 인증 설정/비밀값·개인 원문/DB는 조사하거나 문서에 복제하지 않았다.

## 교회 개설 심사 기준의 정리 수준

- 일반 교단 소속 교회 기본 제출은 교단·노회 소속증명서와 교회 고유번호증이다. 재직·목회자 자격·대표/위임 권한을 확인할 수 없거나 자료가 충돌할 때만 필요한 최소 자료를 추가 요청한다. 재직증명서·신분증을 일괄 필수화하지 않는다.
- 실재성·목회자 자격·대표 권한·신학적 이용 기준을 구분해 사람이 검토한다. 신학 검토자와 최종 승인자는 다르며 자기 개설을 승인할 수 없다. 승인 뒤 최초 관리자 본인 수락도 필요하다.
- 신학 초안 CT-01~06: 성경의 권위·삼위일체·그리스도의 참 하나님/참 인간 되심·십자가/부활·은혜의 구원·성령의 내주/인도/증언을 위한 사역. 사용자 검토 초안 AGREED / DESIGN이며 책임자의 실제 신학 검토·해석/근거·운영 채택/시행일은 미완료다.
- 교단/기관 18개는 후보 목록이다. 공식 운영 허용 목록 배포나 개별 교회 승인·진위 확인 완료가 아니다. 기하성 포함 범위/KAICAM 대응 근거는 기록하되 실제 발급/관계 확인은 남아 있다.
- 독립·신생·해외·미등재 예외, 일반 이의신청 30일 내 1회·독립 재검토, 자료 보호·상태별 보관/삭제까지 설계했다. 유형별 최소 증빙·가림 필드·심사 인력·분쟁/예외/통지 세부·실제 삭제/복원은 남았다.
- 서류 완비·교단 후보 등재·초안 동의만으로 자동 승인하지 않는다. AI/CHGO의 이단 자동 판정·자동 승인/거절을 금지한다. 개인 기도·일기·관계 원문을 심사에 수집하지 않는다.

상세: [교회 개설 심사](../operations/ecosystem-v1/CHURCH_ESTABLISHMENT_REVIEW.md), [신학 문구 초안](../operations/ecosystem-v1/COMMON_THEOLOGICAL_USE_CRITERIA_DRAFT.md), [후보 명단](../operations/ecosystem-v1/INITIAL_DENOMINATION_CANDIDATES.md).

## 남은 OPEN

| 묶음 | 남은 내용 |
|---|---|
| 별도 결정 | COS-JOIN-040: 잘못 확정한 가입 승인/거절의 정정 책임·후속 조치 |
| 인증 실체 | JLBible/JLAcademy 저장소·운영 공통 인증 서버 유무. 실제 공급자/issuer/클라이언트 미확인 |
| 상세 계약 | 토큰/세션·식별/현재 권한·회수/최신성·멱등/경합·복귀/복구·제한 조회·로컬/오프라인/공동 자료 범위 |
| 운영/보관 | 담당자/대행/이해충돌·본인 확인·최소 이력 삭제·장기 실패/예외·관리자 공백 복구·보안 위험 식별 |
| 개설 운영 채택 | 신학 검토/정책 채택·문구 해석·교단 목록 채택·기관별 증빙·심사자 자격/선임·예외/분쟁/통지 상세 |
| 구현·출시 | 제공자/API/다제품/실기기·차단 지연·삭제/백업/복원·운영 대응 검증 NOT_RUN |

48개 공통 정책·40개 개설 결정의 AGREED는 이 정책 묶음의 합의다. 후속 과제 확정이나 제품 구현/출시 완료가 아니다.

## 문서 충돌 확인 및 조치

| 발견/보존할 내용 | 현재 문서 처리 |
|---|---|
| 기본 세 서류 vs 두 서류 | 과거 COS-CHURCH-005/008 보존. 현재 040의 기본 2종/조건부 보완 적용 |
| 합의한 신학 초안을 본문에서 PROPOSED/문구 미결로 표현 | 개설·상세·앱 운영·시나리오·계약 문서를 검토 초안 AGREED / 운영 채택 전으로 맞춤 |
| COS-JOIN-035를 다시 질문하라는 안내 | 현재 AGREED로 바로잡고 정정 040과 구별. 당시 결정 이력은 보존 |
| 후보 초대 수락 즉시 ACTIVE | 역사적 후보 YAML/설계/스냅샷 보존. 현재 계약은 수동 승인 전 교인 권한 없음 |
| 제품/인증 위치 확인 대기 | 사용자 응답에 따라 NOT_VERIFIED. 존재/부재/선정/배포 가정 없음 |
| 47개 합의/048 OPEN인 통합 당시 기록 | 당시 검사 이력은 유지하고 후속 048 확정으로 현재 48개 AGREED임을 명시 |

## GitHub에 저장할 파일

기존 대화 시작 전부터 있던 수정/새 문서를 포함한 현재 작업 트리의 설계 변경이다. 이전 수정을 초기화하거나 별도 제품 코드를 추가하지 않는다.

| 상태 | 파일 | 내용 |
|---|---|---|
| 수정 | [README.md](../../README.md) | 최신 설계/조사/검토 진입점과 상태 |
| 수정 | [GLOSSARY.md](../../GLOSSARY.md) | 교회/계정/서비스/공유·탈퇴/정지 용어 |
| 수정 | [DESIGN_DECISIONS.md](../decisions/DESIGN_DECISIONS.md) | 결정·권위·이유·대안·증거 상태 |
| 수정 | [APP_ONLY_OPERATIONS.md](../operations/ecosystem-v1/APP_ONLY_OPERATIONS.md) | 앱 전용 가입/개설/복구/종료 흐름 |
| 수정 | [CONTRACT_BACKLOG_V1.5.md](../operations/ecosystem-v1/CONTRACT_BACKLOG_V1.5.md) | C01/C02 및 정책/조사 인계 |
| 수정 | [DETAILED_DESIGN_V1.5.md](../operations/ecosystem-v1/DETAILED_DESIGN_V1.5.md) | 현재 정책의 상세 설계 적용 |
| 수정 | [FEATURE_MATRIX_V1.5.csv](../operations/ecosystem-v1/FEATURE_MATRIX_V1.5.csv) | 기존 26개 기능의 정책/완료 기준 |
| 수정 | [OPERATING_SCENARIOS.md](../operations/ecosystem-v1/OPERATING_SCENARIOS.md) | 운영 시나리오 적용 |
| 신규 | [ACCOUNT_MEMBERSHIP_SERVICE_SCOPE_CONTRACT.md](../operations/ecosystem-v1/ACCOUNT_MEMBERSHIP_SERVICE_SCOPE_CONTRACT.md) | 현재 정책·기한·책임·48개 결정 추적표 |
| 신규 | [AUTH_PROVIDER_AND_PRODUCT_INVENTORY.md](../operations/ecosystem-v1/AUTH_PROVIDER_AND_PRODUCT_INVENTORY.md) | 로컬 근거·미확인 제공자/저장소 |
| 신규 | [CHURCH_ESTABLISHMENT_REVIEW.md](../operations/ecosystem-v1/CHURCH_ESTABLISHMENT_REVIEW.md) | 기본 2종·심사/신학/예외·보관·미결 |
| 신규 | [COMMON_AUTH_SSO_REVIEW.md](../operations/ecosystem-v1/COMMON_AUTH_SSO_REVIEW.md) | 인증 구조와 후보/현재 구현 대조 |
| 신규 | [COMMON_THEOLOGICAL_USE_CRITERIA_DRAFT.md](../operations/ecosystem-v1/COMMON_THEOLOGICAL_USE_CRITERIA_DRAFT.md) | 6항목 사용자 검토 초안·운영 채택 전 |
| 신규 | [INITIAL_DENOMINATION_CANDIDATES.md](../operations/ecosystem-v1/INITIAL_DENOMINATION_CANDIDATES.md) | 18개 후보·범위/확인 한계 |
| 신규 | [2026-10-24-auth-policy-consolidation.md](2026-10-24-auth-policy-consolidation.md) | 통합 당시 검사/이력과 후속 048 확정 |
| 신규 | 이 문서 | GitHub 저장 전 요약·파일 목록·한계 |

## 저장 준비

- 로컬 브랜치: `docs/membership-approval-review`. HEAD와 로컬 `origin/main`은 `cebe9b1`. upstream은 없으며 미커밋 설계 변경을 준비하는 단계다. 원격 fetch는 하지 않아 GitHub 최신 상태가 같다고 단정하지 않는다.
- 대상: `seungki-kang/JesusLife-Church-OS`. 제안 제목: **Document church establishment review and shared account policies**.
- 제안 설명: 교회 개설을 기본 두 서류와 조건부 보완으로 정리하고 신학 초안/운영 채택을 구분한다. 공통 인증·권한·탈퇴/정지 48개 설계 합의와 미확인 제공자/제품 현황을 통합하며 기존 로컬 기록의 자동 계정 연결을 금지한다. 문서 정적 검사·실제 연동 미실행·후속 OPEN을 구분한다.
- 문서/CSV만 포함한다. `canonical/`, `api/`, `db/`, `apps/`, `services/`, 다른 제품 저장소, 비밀값/사용자 원문은 저장 대상이 아니다.
- 사용자의 '먼저 변경 요약' 요청에 따라 staging·커밋·push·PR 생성/병합은 실행하지 않았다. 요약 확인 후 저장 요청 범위에 맞춰 명시 파일만 추가하고 원격 저장/CI를 확인한다. 성공을 미리 주장하지 않는다.

## 검증 범위

문서 경로/앵커·결정 ID/상태·26개 기능 CSV 구조·예상 저장 파일 범위·비밀 형식의 한정 정적 검색과 `git diff --check`를 확인한다. 실행 결과는 이번 응답에 보고한다. 로컬 링크 검사는 외부 교단 사이트 재검증이나 실제 증명서 진위 확인이 아니다.

실제 공통 인증·다제품 로그인·토큰 회수/차단·삭제/복원/백업·Flutter·실기기·제공자 연동·GitHub CI는 이번에 실행하지 않았으므로 NOT_RUN이다. 과거 사용자 제공 PASS나 기존 워크플로 파일을 이번 실행 증거로 바꾸지 않는다.

### 이번 실행 결과

- PASS / 문서 정적 검사: 저장 대상 16개(수정 8·신규 8), 로컬 링크 739개·앵커 194개, 결정 ID 중복 없음·JOIN 39 AGREED/1 OPEN·CHURCH 40 AGREED·SSO 48 AGREED, CSV 26개 고유 기능/9개 열.
- PASS: git diff --check. 한정된 비밀 형식 검색에서 의심 형식 0건. 이는 모든 민감정보의 부재를 보증하는 검사가 아니다.
- Git index에 추가된 파일 0개. 코드/DB/다른 제품 변경·원격 fetch/push/PR/CI는 이번에 수행하지 않음. 실행/연동 검증 NOT_RUN.
