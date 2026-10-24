# ChurchOS 정본 v2.6 — 2026-10-24

ChurchOS는 사용자가 처음 여는 교회 운영 중심 앱이다. 너랑나랑·생명일기·JLPrayer·JLBible·JLAcademy·CHGO는 각각 독립 설계·데이터·배포를 유지하고 API로 연결한다. 지저스라이프 원은 사용자 화면에 노출하지 않는다. 최종 앱 이름은 미정이다.

## 이번 실행
START_LIFECYCLE.md를 따른다. 공지·일정 상세 조회, ETag/If-Match 수정, 게시·취소 기능을 추가했다. 중복 요청·버전 충돌·성공 감사·롤백을 검사한다. 이전 START_* 문서는 역사적 참고다.

## 설계 읽는 순서
1. governance/CANONICAL.md — 정본과 소유권
2. specs/01_제품정의와경계.md — 독립 제품 경계
3. architecture/01_백엔드서비스구조.md — 서버 내부 모듈과 API
4. contracts/01_통합경계계약.md — 전문 제품 소비 계약
5. api/openapi/church-os-v1.yaml — 현재 API 1.3.0
6. START_LIFECYCLE.md — 실제 동작 범위와 검증 실행
7. VALIDATION.json·CHANGELOG.md — 검증 출처·미실행 범위·변경

## 현재 상태
v2.5의 서버–DB 조회/생성 41단계는 사용자 환경에서 PASS로 확인했다. v2.6에서는 서버 테스트 80개와 제작 환경의 정적 검사를 실행했다. 새 lifecycle/실제 PostgreSQL 통합은 Docker 재실행 전까지 NOT_RUN이다. 이전 통과를 새 버전에 자동 승계하지 않는다.

V001~V014는 변경하지 않았고 V015에 변경 결과 버전 메타데이터만 추가했다. 기존 배포 DB나 다른 migration 계보에 덮어쓰지 않는다. 이번 실행기는 별도 임시 DB만 사용한다. 실제 OIDC·앱·실기기·전문 제품 연결·운영 데이터 이관·출시는 아직 별도 검증이다. GitHub main은 변경하지 않았다.

## 정적 검사
python -m pip install -r requirements-dev.txt
python tools/validate.py
python tools/sql_syntax.py
python -m unittest discover -s tests -p 'test_*.py'

매니페스트 경로는 패키지 루트 기준이다. node_modules·dist·__pycache__는 생성물이므로 정본 해시에서 제외한다. 원문과 비밀·토큰을 로그·감사·이벤트에 복제하지 않는다.
