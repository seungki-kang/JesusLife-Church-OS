# v2.6.0 — 2026-10-24
- 공지/일정 상세 조회·ETag, PATCH 수정, POST publish/cancel 구현.
- If-Match 누락 428·잘못된 값 400·버전 불일치 412, 종료 상태 변경 409.
- 행 잠금·조건부 UPDATE·성공 감사·버전 영수증을 같은 트랜잭션에 처리.
- 현재 결과 버전이 유지된 재시도만 재생; 이후 수정이 있으면 409 REPLAY_SUPERSEDED.
- V015 버전 메타데이터 열 추가. V001~V014 바이트 보존.
- 새로운 lifecycle HTTP/정책/트랜잭션·실DB 통합 검사 추가.
- 기존 v2.5 사용자 PASS와 새 v2.6 실제 DB NOT_RUN 구분, 증거 폴더 분리.

# v2.5.0 — 2026-10-24
- 교인 등록·공지/일정 초안 생성 POST 3개 구현, 관리자·목적·입력 검증.
- 요청 키별 advisory lock, canonical body hash, issuer-bound actor hash, 최초 201 응답 재생.
- 업무 insert·성공 감사·영수증 원자적 commit/rollback 구현.
- V014 영수증 메타데이터 추가; V001~V013 변경 없음.
- 입력·HTTP·작성/충돌/동시 요청/권한 철회/감사 실패 검증 추가.
- 기존 v2.4의 읽기 통합 사용자 PASS와 새 쓰기 통합 NOT_RUN을 분리.
- 새 증거는 ChurchOS_API_DB_Evidence_v2.5에 저장해 기존 증거 보존.

# v2.4.0 — 2026-10-24
- 실제 TCP HTTP와 PostgreSQL 16 프로토콜을 연결하는 통합 실행기 추가.
- 두 교회·관리자·일반 교인 합성 데이터와 non-owner/non-superuser 앱 DB 로그인 사용.
- 26개 필수 단계: 신규 설치·권한·조회·페이지·동시 교회 요청·회수·pool 문맥 초기화·정리.
- 단계 누락·실패·버전·migration hash 불일치를 거부하는 판정기와 테스트 추가.
- 전용 Docker/PowerShell 실행기, API-DB CI, 증거 파일 추가.
- SQL V001~V013 및 Fastify 5.12.7 고정 유지. 실제 통합 실행은 제작 환경 NOT_RUN.

# v2.3.1 — 2026-10-24
- 사용자 npm audit에서 보고된 Fastify 취약점 대응.
- NestJS 11.2.8 유지, @nestjs/platform-fastify 하위 fastify 5.12.7 override 및 lockfile 갱신.
- 강제 major 업그레이드를 실행하지 않음.
- 잘못된 URL의 비인증 요청이 보호 데이터를 반환하지 않는 회귀 검사 3개 추가.
- 서버 테스트 29개·설계 Python 검사 24개·깨끗한 npm ci 검사.
- npm audit 스냅샷: 전체 의존성 취약점 0개. 향후 advisory 변경에 따라 재검사 필요.
- SQL·API 경계·도메인 구현 범위는 동일. 실제 DB 통합과 외부 OIDC는 NOT_RUN.

# v2.3.0 — 2026-10-24
- ChurchOS 핵심 서버 0.1.0 추가: NestJS·Fastify·DI·RS256 JWT·DB 기반 소속/역할 확인.
- 교회 정보·교인·공지·일정 조회 4개 도메인 endpoint 및 health/live·ready 추가.
- 토큰 역할/교회 주장 무시, 목적 allowlist, 소속 철회·역할 유효기간·게시 대상 정책 적용.
- 파라미터 SQL·transaction-local tenant/actor context·rollback·연결 반환 구현.
- 응답 스키마 Membership/Event/Notice의 closed allOf 충돌 수정(API 1.1.1); 입력 스키마는 변경하지 않음.
- v2.2 사용자 DB 실행 PASS를 별도 출처로 기록, SQL V001~V013 불변.
- 실제 OIDC·서버↔PostgreSQL 통합·쓰기·rate limit·영속 감사·앱 검증은 미완료.

# v2.2.0 — 2026-10-24
- PostgreSQL 16.2 확보 및 initdb 시도: root 실행 거부로 실제 DB NOT_RUN.
- PostgreSQL 16.1 grammar parser로 SQL 19개 파일 검사.
- 빈 백업 fingerprint·잘못된 서버 버전도 통과할 수 있던 증거 판정 로직 보완.
- 전용 Docker Compose·PowerShell 실행기·결과 수집 진입점 추가(실행 NOT_RUN).
- DB 접속 timeout 기본 5초 추가. SQL·증거 음성 회귀 검사 확대.
- 기존 제품 방향과 V001~V013 바이트 보존; v2.1 원본 ZIP 포함.

# v2.1.0 — 2026-10-24
- v2.0 전체 내용과 원본 ZIP을 포함한 누적 정본.
- 기존 저장소와 ZIP의 DB 계보·해시 비교; 배포 DB 이력 UNKNOWN 명시.
- 전용 임시 PostgreSQL 16 신규 설치·보안·합성 데이터 백업 복원 검증 도구 추가.
- 필수 단계 누락·skip·실패·복원 불일치·해시 변경을 실패로 처리하는 회귀 검사 추가.
- PostgreSQL 16 CI workflow 추가. GitHub 실행과 실제 DB 실행은 NOT_RUN.

# v2.0.0 — 2026-10-24
- ChurchOS를 사용자의 첫 앱·교회 운영·마케팅 중심으로 확정.
- 일곱 제품의 독립 설계·개발·DB 소유·배포와 API 연결 명시.
- JLAcademy를 제품 경계·API enum·이벤트·Today·앱 화면·후속 SQL에 추가.
- 지저스라이프 원은 내부 생태계 명칭으로 한정하고 화면 전제 제거.
- 관리자 웹·PWA·Headless 배포 계획을 앱 역할별 화면으로 통합.
- 과거 보고서·중복 논리 DDL·이전 검증기·원본 저장소 재분류 도구 제거.
- V001~V012 바이트 보존, V013 추가. 원격 Git 이력과 원본 ZIP 보존.
- 정본 설계 상태와 미검증 런타임·출시 상태 분리.
