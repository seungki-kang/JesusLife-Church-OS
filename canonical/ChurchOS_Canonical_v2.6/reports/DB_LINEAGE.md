# DB 계보 확인 — v2.1

검사 대상은 이 환경에 확보된 로컬 저장소 커밋 `ca095327a6568f590eba0938a9b458bb6e02a0b1`과 정본 v2.0 ZIP이다. 원격 최신 상태와 사용자 컴퓨터·배포 DB에는 접근하지 않았다.

- 기존 저장소: church_os V001~V010 (별도 validation V011~V012는 migration과 구별)
- 정본 ZIP: V001~V013
- 두 계보는 V001 이름과 SQL 구조가 다르므로 동일 migration history에 섞거나 같은 버전 번호로 대체할 수 없다.
- 정본 V001~V012는 최초 v1.9 ZIP의 바이트와 일치한다. V013은 JLAcademy provider 확장이다.
- 배포·공유 DB 적용 여부: UNKNOWN. 운영 전환 승인: BLOCKED_PENDING_DEPLOYED_HISTORY.

## 다음 판단
일회성 새 전용 DB에서만 정본 계보를 신규 설치한다. 기존 DB가 있으면 먼저 읽기 전용으로 server version, migration history, 스키마·테이블 목록·행 수·RLS·권한을 수집하고 개인정보 없이 비교한다. 실제 데이터 이관은 별도 forward migration과 복구 검증 후 진행한다. 이번 작업은 기존 DB를 삭제·교체하지 않는다.

자세한 파일별 해시는 db_lineage.csv에 있다.
