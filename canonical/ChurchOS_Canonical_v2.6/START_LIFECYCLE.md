# v2.6 공지·일정 상세/수정/게시/취소

## 이번 구현
- GET /api/v1/church/notices/{noticeId}, GET /api/v1/church/events/{eventId}: 권한을 검사한 상세 조회와 ETag
- PATCH 위 상세 경로: 입력 검증·현재 버전 확인·수정
- POST 위 상세 경로 뒤 /publish 또는 /cancel: 게시·취소(200)
- 기존 교인·공지·일정 생성과 목록 조회 유지

관리자는 자기 교회의 초안·게시·취소 자료를 조회하고, 일반 교인은 공개 조건을 충족한 게시 자료만 조회한다. 비공개/타 교회 자료는 404이며, 요청 교회에 소속되지 않은 계정은 403이다. 공동체 제한 일정의 교인 조회는 ACL 구현 전까지 차단한다. 모든 변경은 현재 TENANT_ADMIN만 허용한다.

## 동시 수정 방지
상세 GET의 ETag가 `"rv-2"`라면 수정·게시·취소에 `If-Match: "rv-2"`와 Idempotency-Key를 보낸다. 버전 값은 큰 정수의 정밀도 손실을 막기 위해 문자열이다. If-Match 누락은 428, 잘못된/약한/와일드카드 값은 400, 이전 버전은 412다. 실패한 요청은 버전·업무 데이터·성공 감사·영수증을 변경하지 않는다.

DRAFT→PUBLISHED→CANCELLED, DRAFT→CANCELLED를 허용한다. 게시 후 내용 수정은 관리자에게 허용하며 새 버전이 즉시 공개될 수 있다. CANCELLED는 종료 상태이므로 수정·재게시할 수 없다. COMPLETED/EXPIRED 수동 전환은 아직 지원하지 않는다. 미래 publishAt을 가진 공지는 게시 상태라도 그 시각 전까지 교인에게 숨긴다. 이미 만료된 공지의 게시는 거부한다.

## 중복 요청과 감사
변경·성공 감사·영수증을 하나의 DB 트랜잭션으로 확정한다. 감사 저장 실패 시 변경과 버전 증가도 롤백된다. 서로 다른 키로 같은 버전을 동시에 수정하면 하나만 성공한다.

같은 키·입력·If-Match 재시도는 직전 결과 버전이 아직 현재일 때만 동일 응답/ETag를 반환한다. 그 후 다른 수정이 있었다면 409 REPLAY_SUPERSEDED를 반환하고 상세를 다시 조회하게 한다. 공지 본문을 중복 요청 테이블/감사 로그에 스냅샷으로 저장하지 않는다. 생성 API의 기존 201 재생 규칙은 그대로 유지한다.

감사 이력은 생성·수정·게시·취소의 메타데이터다. 이전 본문 복원·내용 비교·변경 이력 조회 화면/API는 아직 구현하지 않았다. 관리자 초안 목록 조회, 실제 OIDC 제공자, 앱, rate limit, 거부 감사 영속화, 전문 제품 연동도 별도 작업이다.

## Windows에서 통합 검사
Docker Desktop을 켠다. ZIP을 새 D:\JESUSLIFE_ONE\ChurchOS_Canonical_v2.6 폴더로 해제한다. 기존 폴더나 운영 DB에 덮어쓰지 않는다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\JESUSLIFE_ONE\ChurchOS_Canonical_v2.6\Run-API-Database-Verification.ps1"
```

컨테이너가 Node·의존성·서버 빌드와 테스트를 처리한다. 별도 npm ci는 필요 없다. 합성 데이터와 시험 RSA 서명키를 사용하며 운영 계정/DB에는 연결하지 않는다.

V001~V014는 보존했다. V015는 idempotency_record에 response_row_version만 추가한다. 보호 테이블 수는 기존 23개와 같다. 기존 v2.5 PASS를 새 lifecycle 통합 PASS로 승계하지 않는다.

이번 필수 통합 단계는 63개다. 결과 폴더는 이전 결과를 보존하도록 ChurchOS_API_DB_Evidence_v2.6으로 분리했다.

```powershell
$r = Get-Content "D:\JESUSLIFE_ONE\ChurchOS_API_DB_Evidence_v2.6\api-db-result.json" -Raw | ConvertFrom-Json
$r | Select-Object artifact,runtime,postgres_version_num
"전체 검사: $($r.checks.Count)"
$r.checks | Where-Object { $_.status -ne "PASS" } | Format-Table id,status
```

전체 실행기의 launcher-result.json도 PASS여야 통과다. 제작 환경에서는 새 PostgreSQL/Docker 통합을 실행하지 못했으므로 NOT_RUN이다. 실패하면 failed_check/failure_code와 마지막 로그를 확인하고 재시도를 반복하지 않는다.
