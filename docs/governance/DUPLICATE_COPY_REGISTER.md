# 중복 사본 원장

2026-11-11. 저장소 정리 기록이며 실행 검증 상태를 바꾸지 않는다.

같은 자료가 여러 폴더에 있으면 한쪽만 고쳐져 내용이 달라진다. 저장소 규칙상 역사 자료를 삭제해 충돌을 숨기지 않으므로, 사본은 지우지 않고 [원장 CSV](DUPLICATE_COPY_REGISTER.csv)에 원본과 관계를 기록한다.

## 규칙

- 변경은 `source_of_truth` 파일에만 한다. 사본을 기준으로 개발·검증하지 않는다.
- `IDENTICAL` 사본은 원본과 바이트가 같아야 한다. 원본을 바꾸면 같은 PR에서 사본도 맞추거나, 사본 보존이 목적이면 관계를 `STALE`로 바꾸고 사유를 쓴다.
- `STALE` 사본은 과거 버전이다. 참조하거나 갱신하지 않는다.
- 새 사본을 만들 때는 이 원장에 먼저 등록한다. 등록되지 않은 동일 파일은 검사에서 실패한다.

## 현재 등록 내용

| 묶음 | 원본 | 사본 | 상태 |
|---|---|---|---|
| B-04 인계 패키지 | `docs/handoff/packages/CHGO_B-04_…_1.0/` | `tests/contract/CHGO_B-04_…_1.0/` | 6개 동일, 증거 매니페스트 템플릿 1개는 사본이 1.0으로 뒤처짐(STALE). 사본은 어디서도 참조되지 않음 |
| B-02 마이그레이션 V001–V010 | `docs/handoff/packages/B-02_PostgreSQL_Clean_Execution_Pack_2.0/migrations/` (E5 CI 실행 경로) | `db/migrations/church_os/` | 10개 동일 |
| B-02 검증 SQL V011·V012 | 같은 B-02 팩 | `db/validation/`, `tests/contract/DEV-002A_Contract_Test_SQL_Pack_2.0.sql` | 3개 동일 |

검사 제외: Flutter가 생성한 Android/iOS 플랫폼 템플릿, 바이트 보존 대상인 `canonical/` 스냅샷, `.gitkeep`, 이미지.

## 검증

`python tools/validation/validate_duplicate_copies.py`가 설계 문서 CI에서 실행된다. 바이트 비교만 하며 어느 사본이 정책적으로 옳은지는 판단하지 않는다.
