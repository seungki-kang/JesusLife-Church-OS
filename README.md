# ChurchOS

앱을 열면 ChurchOS(최종 브랜드명 미정)가 나옵니다. ChurchOS는 교회 운영과 마케팅의 중심 접점이며 앱으로 개발합니다. 너랑나랑·생명일기·JLPrayer·JLBible·JLAcademy·CHGO는 독립 제품으로 설계·개발·배포하고 API로 연결합니다. 지저스라이프 원은 내부 생태계 명칭이며 사용자 화면에 노출하지 않습니다.

## 현재 개발 정본

**[ChurchOS 정본 v2.6](canonical/ChurchOS_Canonical_v2.6/README.md)** 을 개발 기준으로 사용합니다. 먼저 [핵심 사용자 흐름](canonical/ChurchOS_Canonical_v2.6/ux/02_핵심사용자흐름.md)과 [실행 안내](canonical/ChurchOS_Canonical_v2.6/START_LIFECYCLE.md)를 읽으세요.

- 실제 구현 소스: `canonical/ChurchOS_Canonical_v2.6/services/church-core/`
- API 계약: `canonical/ChurchOS_Canonical_v2.6/api/openapi/church-os-v1.yaml`
- 신규 전용 DB 계보: `canonical/ChurchOS_Canonical_v2.6/db/migrations/` (V001–V015)
- 사용자 제공 실행 결과: 2026-10-24 v2.6 / PostgreSQL 16.15 / 63개 검사 PASS. 원본 JSON은 사용자 컴퓨터에 있으며 저장소에 업로드된 증거는 아닙니다.
- 앱 화면·실제 OIDC·외부 제품 연동·운영 배포는 완료되지 않았습니다.

## 앱 구현 시작

[Flutter 앱 0.1.0](apps/church-os/README.md)에 첫 화면과 앱 내 관리자 시연 흐름을 추가했습니다. 실제 API는 미연결이고 Flutter 분석·테스트·실기기 검증은 NOT_RUN입니다. 준비 스크립트는 Android/iOS만 생성합니다.

## 후속 전체 운영 기획

[일곱 제품 운영 시나리오 v1.4](docs/operations/ecosystem-v1/OPERATING_SCENARIOS.md)에 교회 개설부터 개인 활동·교육·철회·탈퇴·장애까지 23개 시나리오와 유지·제거·분리 처분을 정리했습니다. [도입 유형·Academy 참여 교회·전 제품 CHGO 관계](docs/operations/ecosystem-v1/PRODUCT_RELATIONSHIPS.md)를 함께 따릅니다. 신규 제안은 제공자 계약·구현·실행 검증 전이며, v2.6 검증 스냅샷은 변경하지 않습니다.

[성경·찬송·설교·CHGO 나눔지 설계](docs/operations/ecosystem-v1/WORD_AND_SERMONS.md)를 추가했습니다. 현재 후속 설계이며 v2.6에 구현된 기능을 뜻하지 않습니다.

[최신 운영 기준·화면·구현 순서 v1.3](docs/operations/ecosystem-v1/IMPLEMENTATION_HANDOFF.md)를 기준으로 후속 개발합니다. 기도는 앱 내 JLPrayer API 화면, 직접 영상 업로드는 별도 구축 서비스로 분리했습니다.

[앱 전용 운영 기준 v1.4](docs/operations/ecosystem-v1/APP_ONLY_OPERATIONS.md)에 따라 별도 웹 없이 관리자까지 앱에서 업무를 수행하도록 설계합니다. 실제 앱 구현과 검증은 진행 전입니다.

## 상세 설계 단계

[상세 개발 설계 v1.5](docs/operations/ecosystem-v1/DETAILED_DESIGN_V1.5.md), [26개 기능표](docs/operations/ecosystem-v1/FEATURE_MATRIX_V1.5.csv), [14개 연동 계약 백로그](docs/operations/ecosystem-v1/CONTRACT_BACKLOG_V1.5.md)를 추가했습니다. 사용자 제공 Flutter 위젯 테스트는 3개 PASS이며, 실제 모바일 실행·로그인·전문 제품 연결과 신규 기능은 미완료입니다. 개발은 설계 정밀화 우선으로 진행합니다.

## 기존 자료 보존

루트의 기존 `docs/`, `api/`, `db/` 등은 과거 자료와 기존 DB 계보로 보존합니다. 제품 방향은 v2.6이 우선합니다. 과거 API·DB가 현재 구현과 호환된다는 뜻은 아닙니다. 기존 DB와 정본 DB는 계보가 다르므로 마이그레이션을 합치거나 덮어쓰지 않습니다. 자세한 경계는 [통합 기록](docs/reviews/2026-10-24-canonical-v2.6-integration.md)을 따릅니다.

기존 CHGO 분리 이력: [Repository split record](docs/governance/Repository_Split_Record_2026-10-17.md).
