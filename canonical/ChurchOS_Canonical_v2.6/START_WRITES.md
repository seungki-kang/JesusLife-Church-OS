현재 v2.6의 실행 안내는 START_LIFECYCLE.md를 따른다. 이 문서는 이전 단계의 참고 자료다.

# v2.5 교인·공지·일정 작성 API 검증

## 구현한 동작
- POST /api/v1/church/memberships: 교회 소속 레코드 등록. 외부 로그인 계정/binding/관리자 역할은 생성하지 않음.
- POST /api/v1/church/notices: 공지 초안(DRAFT) 생성. 게시 기능은 아직 미구현.
- POST /api/v1/church/events: 일정 초안(DRAFT) 생성. 게시 기능은 아직 미구현.

세 기능은 모두 활성 소속·TENANT_ADMIN·CHURCH_OPERATION 목적을 요구한다. 목회자의 LIMITED 관리 권한은 별도 범위를 결정하기 전까지 허용하지 않는다. 기존 읽기 권한은 유지한다.

## 중복 요청과 감사
Idempotency-Key는 16~128자의 공백 없는 출력 가능한 ASCII 문자열이다. tenant·발급자/subject의 해시·API 경로·키별로 잠근다. 동시 요청은 DB advisory transaction lock으로 직렬화한다. 같은 키와 같은 정규화 입력은 최초 201 응답의 ID·시각을 그대로 반환하고 감사 기록을 추가하지 않는다. 같은 키로 입력을 바꾸면 409다. 역할·소속 검증은 재시도마다 다시 수행한다.

입력 검증 실패와 저장 실패는 캐시하지 않는다. 영수증은 24시간 동안 재사용되며 만료된 키는 409로 거부한다. 키 재사용과 보존기간 정리 job은 아직 구현하지 않았다. 감사 기록과 idempotency 영수증, 업무 데이터는 하나의 DB 트랜잭션으로 확정한다. 감사 저장이 실패하면 업무 데이터도 롤백한다. 감사에는 액션·resource ID·목적·가명 actor·trace만 저장하며 요청/공지 본문은 넣지 않는다. 거부된 요청의 영속 DB 감사는 다음 단계이고 현재 콘솔 최소 메타데이터 기록만 적용한다.

V001~V013 바이트는 보존했다. V014는 기존 idempotency_record에 response_resource_id와 response_created_at을 추가한다. 본문 사본은 저장하지 않고, 재시도 요청이 원본 hash와 같을 때 요청과 저장된 메타데이터로 최초 응답을 재구성한다. 기존 영수증에 새 메타데이터가 없으면 409로 거부한다.

## Windows에서 실행
Docker Desktop을 켠다. ZIP을 D:\JESUSLIFE_ONE\ChurchOS_Canonical_v2.5에 새로 해제한다. 기존 패키지/운영 DB에 덮어쓰지 않는다. 터미널 위치와 관계없이 아래 명령으로 검사한다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\JESUSLIFE_ONE\ChurchOS_Canonical_v2.5\Run-API-Database-Verification.ps1"
```

Node·npm 설치와 테스트는 컨테이너가 처리하므로 npm ci를 별도로 실행하지 않는다. 임시 DB에 V001~V014를 적용해 기존 조회 검증과 작성 검증을 함께 수행한다. 제작 환경의 단위 검사 통과와 실제 Docker 통합 PASS는 별개다. 제작 환경에서는 PostgreSQL을 실행하지 못해 새 통합 검증은 NOT_RUN이다.

결과는 기존 v2.4 증거를 덮어쓰지 않도록 별도 ChurchOS_API_DB_Evidence_v2.5 폴더에 저장한다.

```powershell
Get-Content "D:\JESUSLIFE_ONE\ChurchOS_API_DB_Evidence_v2.5\launcher-result.json"
Get-Content "D:\JESUSLIFE_ONE\ChurchOS_API_DB_Evidence_v2.5\api-db-result.json"
```

전체 필수 단계가 PASS여야 성공이다. 실제 로그인 제공자·앱·게시/수정/삭제·rate limit·거부 감사 영속화·outbox 전달·전문 앱 연결은 아직 미구현/미검증이다. 운영에 배포하지 않는다.
