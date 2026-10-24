현재 v2.6의 실행 안내는 START_LIFECYCLE.md를 따른다. 이 문서는 이전 단계의 참고 자료다.

현재 정본 v2.5의 실행 안내는 START_WRITES.md를 따른다. 아래는 v2.4 읽기 통합 범위의 역사적 안내다.

# API와 PostgreSQL 통합 검증

이 패키지는 기존 제품 방향·DB V001~V013·Fastify 5.12.7 보안 수정을 유지한다. 검증 도구를 추가했으며 이 제작 환경에서 실제 Docker/DB 통합은 실행하지 않았다.

## Windows 실행
1. Docker Desktop을 실행해 Engine running 상태로 둔다.
2. ZIP을 D:\JESUSLIFE_ONE\ChurchOS_Canonical_v2.4 에 새로 해제한다.
3. VS Code 터미널에서 **패키지 루트**로 이동한다. 이번 명령은 services/church-core에서 실행하지 않는다.

```powershell
Set-Location "D:\JESUSLIFE_ONE\ChurchOS_Canonical_v2.4"
Test-Path .\Run-API-Database-Verification.ps1
```

True가 나오면 실행한다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Run-API-Database-Verification.ps1
```

컨테이너가 Node·의존성을 준비하므로 호스트 npm ci는 별도로 필요하지 않다. 기존 Docker/WSL을 재설치할 필요도 없다.

## 실행 범위
- 기존 서버·판정기 테스트 → 독립 PostgreSQL 16 임시 DB 생성 → V001~V013 신규 설치
- DBA 권한은 합성 데이터·역할 준비에만 사용하고 요청 API는 non-superuser·non-BYPASSRLS·비소유자 앱 로그인으로 접속
- 서명된 로컬 시험 JWT → 실제 loopback HTTP 요청 → DB 소속/binding/역할 조회 → 데이터 반환
- A/B 교회 격리·일반 교인의 명단 접근 차단·공지 대상·게시 기간·공동체 제한 일정 배제
- 날짜 필터·페이지 이동·동시 요청·역할 만료·소속 비활성·binding 철회·교회 중단·위조 JWT 차단
- pool 크기 1로 연결을 재사용하고 transaction-local context가 남지 않는지 확인
- 서버 종료·임시 DB/역할·해당 Compose 프로젝트만 정리

실제 로그인 제공자·원격 네트워크·TLS·쓰기 API·여섯 제품 연동은 이 검사 대상이 아니다. 기존 DB 백업 복원 검사는 v2.2에서 사용자 PASS로 확인한 별도 결과이며 이번에는 중복 수행하지 않는다.

## 결과
패키지 옆의 ChurchOS_API_DB_Evidence 폴더에 launcher-result.json과 api-db-result.json이 저장된다. 두 파일의 runtime이 PASS여야 전체 통합 검사 성공이다. 필수 검사가 누락되거나 실패하면 INCOMPLETE와 비정상 종료코드를 반환한다. 과거 PASS 파일은 새 실행 전에 제거하므로 실패한 실행을 과거 결과로 통과시키지 않는다. Docker 이미지 빌드 단계에서 실패하면 새 결과가 없을 수 있으므로 반드시 터미널 종료 결과도 확인한다.

종료 후 결과를 읽는다.

```powershell
Get-Content ..\ChurchOS_API_DB_Evidence\launcher-result.json
Get-Content ..\ChurchOS_API_DB_Evidence\api-db-result.json
```

실패하면 재실행을 반복하지 않고 failed_check·failure_code 및 마지막 터미널 로그를 확인한다. 운영 DB 연결 정보는 사용하지 않는다.
