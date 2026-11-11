# S02 인증 검증·교회 문맥 — 합성 제공자 범위

2026-11-11. 대상: `services/church-core` 0.7.0. 상태: **합성(시험용) 제공자 범위 PASS, 실제 제공자 연결 BLOCKED**(B01·B02). 이 문서는 [S01 경계 계약](S01_MODULE_BOUNDARY_CONTRACT.md)의 권한·기기 문맥 계약을 실제 동작으로 연결한 결과다. 새 COS 정책을 만들지 않으며, 여러 교회 소속과 활성 교회 하나 선택은 [COS-JOIN-021](../decisions/DESIGN_DECISIONS.md#cos-join-021)을 따른다.

## 1. 무엇이 생겼나

| 항목 | 내용 |
|---|---|
| `GET /api/v1/church/me/churches` | 로그인한 본인이 속한 교회 목록(활성 교회만, 소속 `ACTIVE`·`PENDING`, 역할은 `ACTIVE`일 때만). 교회 헤더가 필요 없다. 앱의 교회 선택 화면 입력 |
| V017 본인 조회 정책 | 서버가 검증한 issuer·subject를 이 요청의 트랜잭션에만 설정하고, 그 사람에게 묶인 연결·소속·역할·교회 행만 **읽기 전용**으로 연다. 교회 문맥은 설정하지 않으므로 공지·일정·다른 사람 정보는 0건이다. 쓰기 정책은 추가하지 않았다 |
| 제공자 모드 분리 | `IDENTITY_MODE=oidc`(기본, 실제 제공자) / `synthetic`(개발 전용) |
| 합성 제공자 도구 | 로컬 키 생성·15분 토큰 발급 CLI, 시험 교회·시험 인물 시드, Docker 개발 스택 |

## 2. 실제 제공자와 합성 제공자를 섞지 않는 장치

| 장치 | 동작 |
|---|---|
| 예약된 issuer | 합성 토큰의 issuer는 `https://synthetic-identity.churchos.invalid`로 고정. `.invalid`는 실제로 존재할 수 없는 도메인이다 |
| 실제 모드 거부 | `oidc` 모드는 `.invalid` issuer·JWKS를 거부한다. HTTPS만 허용 |
| 운영 거부 | `CHURCHOS_ENV=production`이면 서버·토큰 CLI·DB 설정 도구 모두 합성 모드를 거부한다 |
| 표시 | 합성 모드의 모든 응답에 `X-Identity-Mode: SYNTHETIC`, `/health/ready`에 `identity`. 앱은 이 값을 보고 "시험용 로그인" 표시를 해야 한다(S03) |
| 시험 데이터 | 교회 이름에 "(시험)", 사람은 `synthetic-*` subject만. DB 이름은 `churchos_dev*`만 허용 |
| 공개 키만 | 서버는 공개 키 JWKS 파일만 읽고, 비밀 키가 섞이면 시작하지 않는다 |
| 권한 | 두 모드 모두 토큰의 교회·역할 값은 무시하고 DB의 현재 소속·역할로만 판정한다(블루프린트의 "UI 데모 역할을 운영 권한으로 사용" 금지) |

## 3. 검증한 시나리오 (실제 PostgreSQL 16, 통합 검사 77개 중 S02 6개 + 기존 1개 보강)

| 검사 | 확인 내용 |
|---|---|
| `my-churches-multi` | 두 교회 소속자는 두 교회를 이름순으로 보고, 교회별 역할이 다르다 |
| `my-churches-pending` | 가입 대기는 목록에 `PENDING`·역할 없음, 교회 안 요청은 `403 MEMBERSHIP_REQUIRED` |
| `my-churches-excluded` | 연결 해제·종료된 소속·정지된 교회·소속 없는 사람은 목록에 없다. 해제된 사람의 교회 요청은 403 |
| `my-churches-own-only` | 다른 사람의 교회는 보이지 않는다. 다른 audience 토큰은 401 |
| `subject-context-read-only` | 본인 조회 문맥에서 본인 연결만 보이고 공지·일정은 0건, 다른 교회 소속 수정 0건·생성 거부 |
| `church-switch` | 같은 토큰으로 교회를 바꾸면 각 교회 데이터만 보인다. B 관리자는 A 관리 목록에서 403. A의 커서는 B에서 400 |
| `pool-context-reset`(보강) | 커넥션 풀에 issuer·subject 설정이 남지 않는다 |

변이 확인: 본인 조회 정책을 `for all`(쓰기 허용)로 바꾸면 `subject-context-read-only`에서 실패한다. 개발 스택은 이 환경에서 실제 서버로 실행해 위 시나리오와 운영 모드 거부를 확인했고, Docker 구성은 CI(`church-core.yml`)에서 실행한다.

## 4. 내 PC에서 실행하기 (Windows, Docker Desktop)

`services/church-core` 폴더에서:

```powershell
docker compose -f tools/dev/compose.yaml up --build -d
docker compose -f tools/dev/compose.yaml run --rm setup node dist/tools/synthetic-identity/cli.js subjects
$token = docker compose -f tools/dev/compose.yaml run --rm -T setup node dist/tools/synthetic-identity/cli.js token synthetic-member --dir /keys
curl.exe -s http://127.0.0.1:3000/api/v1/church/me/churches -H "authorization: Bearer $token" -H "x-purpose-code: CHURCH_OPERATION"
```

- API는 `http://127.0.0.1:3000`(내 PC에서만 접근). Android 에뮬레이터에서는 `http://10.0.2.2:3000`.
- 토큰은 15분 유효. 만료되면 다시 발급한다.
- 시험 데이터를 처음 상태로: `docker compose -f tools/dev/compose.yaml down --volumes` 후 다시 `up`.
- 시험 인물: `synthetic-admin`(은혜교회 관리자), `synthetic-pastor`, `synthetic-member`(두 교회), `synthetic-pending`, `synthetic-revoked`, `synthetic-hope-admin`, `synthetic-stranger`.

## 5. 남은 것 (BLOCKED)

| 항목 | 막힌 이유 | 필요한 결정 |
|---|---|---|
| 실제 공통 인증 제공자 연결 | B01: issuer·subject·계정 연결 계약 미정 | 제공자 선택과 식별 계약 |
| 계정 연결(초대·가입 승인으로 바인딩 생성) | B01 "임의 계정 연결 금지", S04 범위 | 초대·승인 흐름 |
| 철회 반영 시간·최종 권한 경합 | B02: 상태 최신성·60초 적용 범위 | 제공자별 차단 계약 |

현재 서버는 요청마다 DB에서 권한을 다시 읽으므로, DB에서 연결을 해제하면 **다음 요청부터** 바로 403이 된다(토큰 만료를 기다리지 않음). 제공자 쪽 계정 정지·삭제 신호를 받는 경로는 B02 결정 후 만든다. S03(앱 연결)은 합성 제공자로 진행할 수 있다.
