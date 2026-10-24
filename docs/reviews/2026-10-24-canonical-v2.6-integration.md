# v2.6 저장소 통합 기록 — 2026-10-24

사용자가 오류와 통합 가능성을 확인한 뒤 main 반영을 요청했습니다.

## 통합 방식

v2.6 ZIP의 155개 파일을 canonical/ChurchOS_Canonical_v2.6/에 그대로 배치합니다. ZIP 정본 매니페스트와 마이그레이션 바이트를 유지하고, 빌드 산출물과 node_modules는 제외합니다. 루트 README와 START_HERE는 현재 개발 경로를 안내합니다. 기존 파일은 삭제하거나 덮어쓰지 않습니다(위 두 진입 문서 제외).

루트 db/migrations/church_os와 정본 db/migrations는 V001부터 내용과 명칭이 다른 독립 계보입니다. 단일 DB에 혼합 적용할 수 없습니다. 기존 DB 이관·배포 변경은 이번 통합 범위가 아닙니다. 기존 운영 절차는 과거 계보 전용이며, 정본 서비스에는 정본 실행 절차를 사용합니다.

## 검증 근거

사용자 제공 PowerShell 출력: artifact ChurchOS_Canonical_v2.6, runtime PASS, postgres_version_num 160015, checks 63, 비PASS 목록 없음. 원본 실행 JSON은 사용자 컴퓨터에 있으며 여기에서 독립적으로 수집·재검증하지 않았습니다. 기존 VALIDATION.json의 NOT_RUN은 패키지 작성 당시 환경 기준으로 그대로 보존합니다. 이후 사용자 실행 결과와 구분합니다.

새 GitHub Actions는 정본 정적/문법/Python/Node 검증 및 일회성 Docker API·DB 63개 검증을 수행합니다. workflow 추가 자체는 실행 성공을 의미하지 않습니다. 로컬 정적·회귀 검사와 사용자 제공 실제 DB 실행 결과를 근거로 소스 통합을 판단합니다. GitHub Actions 실행 상태는 별도 확인이 필요하며 실패 시 수정합니다.

## 남은 범위

Flutter UI, 실제 인증 제공자, 독립 제품 API 연결, 운영 환경·기존 DB 이관은 별도 구현과 검증이 필요합니다. 제품 정본 승격은 운영 출시 승인이 아닙니다.
