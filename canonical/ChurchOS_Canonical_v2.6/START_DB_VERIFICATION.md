# 실제 DB 검증 실행

현재 상태: 이 패키지를 만든 환경은 root UID만 사용할 수 있어 initdb가 거부되었다. SQL 구문 검증은 통과했지만 DB 신규 설치·권한·복구·Docker 실행은 NOT_RUN이다. 빈 fingerprint와 잘못된 서버 버전도 이제 PASS로 판정하지 않는다.

## Windows에서 실행
Docker Desktop이 이미 설치·실행된 컴퓨터에서 ZIP을 새 폴더로 해제한다. 기존 프로젝트·운영 DB 폴더에 덮어쓰지 않는다. 해제한 ChurchOS_Canonical_v2.2 폴더의 PowerShell에서 실행한다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Run-Database-Verification.ps1
```

이 실행 정책 옵션은 해당 프로세스에만 적용된다. 시스템 실행 정책을 변경하지 않는다.

스크립트는 임의 이름의 Docker Compose 프로젝트를 만들고 전용 임시 PostgreSQL 16과 검증 컨테이너만 사용한다. 기존 DB 연결 문자열을 받지 않으며 호스트에 DB 포트를 공개하지 않는다. 종료 시 해당 프로젝트 컨테이너·볼륨을 정리한다. DB 데이터는 임시 저장소에만 둔다. 최초 실행은 이미지와 검사 의존성을 내려받는다.

결과는 패키지 폴더 옆의 `ChurchOS_Runtime_Evidence` 폴더에 저장한다.

- `launcher-result.json`: 정적·SQL 구문·회귀·DB 실행 각 단계 종료코드
- `db-result.json`: 필수 DB 단계, checksum, 실행 결과
- 합성 데이터만 담은 `.dump`: 복원 검사용 자료

`db-result.json`의 runtime이 PASS이고 launcher도 PASS여야 이번 DB 검증 완료다. 파일이 없거나 FAIL·INCOMPLETE이면 완료가 아니다. 문서나 기존 VALIDATION.json을 수동으로 PASS로 바꾸지 않는다. 테스트가 실패하면 먼저 단계 ID를 기준으로 원인을 분석한다.

이 스크립트의 PowerShell·Docker 실행은 이 환경에서 검증하지 못했다. 새 도구가 있으므로 한 번에 운영에 적용하지 않는다. 이 결과가 통과해도 실제 데이터 이관·서버 API·앱·실기기·파일럿은 별도 검증이다.
