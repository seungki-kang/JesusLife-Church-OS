# ChurchOS

앱을 열면 ChurchOS(최종 브랜드명 미정)가 나옵니다. ChurchOS는 교회 운영과 마케팅의 중심 접점이며 앱으로 개발합니다. 너랑나랑·생명일기·JLPrayer·JLBible·JLAcademy·CHGO는 독립 제품으로 설계·개발·배포하고 API로 연결합니다. 지저스라이프 원은 내부 생태계 명칭이며 사용자 화면에 노출하지 않습니다.

## 현재 구현 기준

**[ChurchOS v2.6](canonical/ChurchOS_Canonical_v2.6/README.md)** 은 검증된 백엔드 구현 스냅샷입니다. 후속 제품 운영 방향은 아래 운영 v1.4·상세 v1.5를 따르며, 구현 여부는 기능표로 구분합니다. 먼저 [핵심 사용자 흐름](canonical/ChurchOS_Canonical_v2.6/ux/02_핵심사용자흐름.md)과 [실행 안내](canonical/ChurchOS_Canonical_v2.6/START_LIFECYCLE.md)를 읽으세요.

- 실제 구현 소스: `canonical/ChurchOS_Canonical_v2.6/services/church-core/`
- API 계약: `canonical/ChurchOS_Canonical_v2.6/api/openapi/church-os-v1.yaml`
- 신규 전용 DB 계보: `canonical/ChurchOS_Canonical_v2.6/db/migrations/` (V001–V015)
- 사용자 제공 실행 결과: 2026-10-24 v2.6 / PostgreSQL 16.15 / 63개 검사 PASS. 원본 JSON은 사용자 컴퓨터에 있으며 저장소에 업로드된 증거는 아닙니다.
- 앱 화면·실제 OIDC·외부 제품 연동·운영 배포는 완료되지 않았습니다.

## 앱 구현 시작

[Flutter 앱 0.1.0](apps/church-os/README.md)에 첫 화면과 앱 내 관리자 시연 흐름을 추가했습니다. 실제 API는 미연결입니다. 사용자 제공 위젯 테스트 3개는 PASS이며, 이 환경의 Flutter 실행과 실제 모바일 검증은 NOT_RUN입니다. GitHub Flutter CI는 새로 추가했으며 결과 확인 전입니다. 준비 스크립트는 Android/iOS만 생성합니다.

## 후속 전체 운영 기획

[일곱 제품 운영 시나리오 v1.4](docs/operations/ecosystem-v1/OPERATING_SCENARIOS.md)에 교회 개설부터 개인 활동·교육·철회·탈퇴·장애까지 23개 시나리오와 유지·제거·분리 처분을 정리했습니다. [도입 유형·Academy 참여 교회·전 제품 CHGO 관계](docs/operations/ecosystem-v1/PRODUCT_RELATIONSHIPS.md)를 함께 따릅니다. 신규 제안은 제공자 계약·구현·실행 검증 전이며, v2.6 검증 스냅샷은 변경하지 않습니다.

[성경·찬송·설교·CHGO 나눔지 설계](docs/operations/ecosystem-v1/WORD_AND_SERMONS.md)를 추가했습니다. 현재 후속 설계이며 v2.6에 구현된 기능을 뜻하지 않습니다.

[최신 운영 기준·화면·구현 순서 v1.3](docs/operations/ecosystem-v1/IMPLEMENTATION_HANDOFF.md)를 기준으로 후속 개발합니다. 기도는 앱 내 JLPrayer API 화면, 직접 영상 업로드는 별도 구축 서비스로 분리했습니다.

[앱 전용 운영 기준 v1.4](docs/operations/ecosystem-v1/APP_ONLY_OPERATIONS.md)에 따라 별도 웹 없이 관리자까지 앱에서 업무를 수행하도록 설계합니다. 실제 앱 구현과 검증은 진행 전입니다.

## 상세 설계 단계

[상세 개발 설계 v1.5](docs/operations/ecosystem-v1/DETAILED_DESIGN_V1.5.md), [26개 기능표](docs/operations/ecosystem-v1/FEATURE_MATRIX_V1.5.csv), [14개 연동 계약 백로그](docs/operations/ecosystem-v1/CONTRACT_BACKLOG_V1.5.md)를 추가했습니다. 사용자 제공 Flutter 위젯 테스트는 3개 PASS이며, 실제 모바일 실행·로그인·전문 제품 연결과 신규 기능은 미완료입니다. 개발은 설계 정밀화 우선으로 진행합니다.

## 기존 자료 보존

루트의 기존 `docs/`, `api/`, `db/` 등은 과거 자료와 기존 DB 계보로 보존합니다. 현재 제품 방향은 후속 운영 v1.4·상세 v1.5가 우선하고, v2.6은 구현 상태와 과거 검증 근거로 보존합니다. 과거 API·DB가 현재 구현과 호환된다는 뜻은 아닙니다. 기존 DB와 정본 DB는 계보가 다르므로 마이그레이션을 합치거나 덮어쓰지 않습니다. 자세한 경계는 [통합 기록](docs/reviews/2026-10-24-canonical-v2.6-integration.md)을 따릅니다.

기존 CHGO 분리 이력: [Repository split record](docs/governance/Repository_Split_Record_2026-10-17.md).

## Codex 작업 지침과 스킬

[AGENTS.md](AGENTS.md)와 [단계별 스킬 정책](docs/development/SKILL_USAGE.md)을 따릅니다. `.agents/skills/grill-with-docs`에 ChurchOS 맞춤 설계 인터뷰 스킬을 추가했습니다. 용어는 [GLOSSARY.md](GLOSSARY.md), 결정은 [설계 결정 기록](docs/decisions/DESIGN_DECISIONS.md)에 누적합니다.


[교회 개설 심사 설계](docs/operations/ecosystem-v1/CHURCH_ESTABLISHMENT_REVIEW.md)는 교인 가입 승인과 별도로 교회 실재성·목회자 자격·대표 권한·서비스 이용 허용 기준을 검토합니다. 플랫폼 운영팀의 사전 심사와 AI·CHGO 이단 자동 판정 금지를 명시했으며 신학 문구는 사용자 검토 초안 합의이며 운영 채택·담당자 자격/선임 등은 후속 과제입니다. 구현·실행 검증 NOT_RUN.

[공통 인증·SSO 구조 검토](docs/operations/ecosystem-v1/COMMON_AUTH_SSO_REVIEW.md)에 여섯 제품 공통 계정 확정 사항, 기존 후보 계약·v2.6 검증 어댑터·시연 앱의 범위와 차이를 정리했습니다. 실제 6개 제품 SSO 연동은 검증 전입니다. [현재 정책·기한·책임표](docs/operations/ecosystem-v1/ACCOUNT_MEMBERSHIP_SERVICE_SCOPE_CONTRACT.md)에 COS-SSO-001~048의 설계 합의를 통합했습니다. 검증된 미해소 공통 보안 위험이 확인되는 재가입은 완료를 보류하고 지정 보안 담당자가 확인합니다. 실제 제공자/API/운영 검증은 구현 전 과제입니다.

[공통 인증 정책 통합 검토](docs/reviews/2026-10-24-auth-policy-consolidation.md)에 중복/상태 모순 정리 결과·검사 범위·남은 결정과 구현 전 과제를 기록했습니다.

[공통 인증 제공자·제품별 로그인 현황](docs/operations/ecosystem-v1/AUTH_PROVIDER_AND_PRODUCT_INVENTORY.md)에 로컬 저장소 조사 근거와 인증 연결 과제를 정리했습니다. 실제 공통 제공자는 미확인이며 기존 로컬 기록 연결·제품별 토큰/권한 계약을 먼저 확인합니다. 코드 변경·실제 연동 검증은 수행하지 않았습니다.

[설계 검토 변경 요약·GitHub 저장 전 확인본](docs/reviews/2026-10-24-design-review-save-summary.md)에 확정/OPEN·교회 개설 기준·수정 파일·검증/저장 범위를 모았습니다. JLBible·JLAcademy 저장소와 운영 공통 인증 서버 유무는 미확인으로 유지합니다.
