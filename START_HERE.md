# 개발 시작

현재 정본은 **canonical/ChurchOS_Canonical_v2.6/** 입니다.

1. 해당 폴더의 README.md와 governance/CANONICAL.md를 읽습니다.
2. START_LIFECYCLE.md에 따라 API·DB 검증을 실행합니다.
3. 서비스 개발은 services/church-core에서 진행합니다.

이 문서의 경로는 위 정본 폴더 기준입니다. 루트의 기존 db/migrations/church_os는 별도 과거 계보이며 정본 서비스에 적용하지 않습니다. 기존 운영 DB의 이관은 아직 검증되지 않았습니다.

## 후속 기획·앱 기준

검증된 백엔드 구현은 위 v2.6 경로, 현재 운영 요구사항은 docs/operations/ecosystem-v1/DETAILED_DESIGN_V1.5.md를 따릅니다. 앱은 apps/church-os에 있습니다. 기도·성경의 앱 내 화면은 전문 API 소유권을 유지하고, 관리자 웹은 만들지 않습니다. 에뮬레이터 실행은 설계 정밀화 이후로 미뤘습니다.
