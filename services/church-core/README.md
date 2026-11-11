# ChurchOS church-core (활성 백엔드)

ChurchOS 백엔드의 **단일 활성 소스**다. 후속 기능과 버그 수정은 이 폴더에서만 한다. `canonical/ChurchOS_Canonical_v2.6/`은 검증 스냅샷으로 보존하며 고치지 않는다. 어디서 무엇을 가져왔는지는 [파생 기록](PROVENANCE.md)에 있다.

운영 출시 상태가 아니다. 실제 공통 인증 제공자·앱 연결·운영 배포는 NOT_RUN이다. 구현 범위·인증·권한 규칙은 v2.6과 같으며 [v2.6 서버 설명](../../canonical/ChurchOS_Canonical_v2.6/services/church-core/README.md)과 [lifecycle 안내](../../canonical/ChurchOS_Canonical_v2.6/START_LIFECYCLE.md)를 참고한다. 개발 위치·모듈 경계는 [코드 개발 전 통합 기준](../../docs/development/DEVELOPMENT_BLUEPRINT.md)을 따른다.

## 구성

| 경로 | 내용 |
|---|---|
| `src/` | NestJS·Fastify 서버 (IdentityPort·StorePort·AuditPort) |
| `test/` | 서버 단위·HTTP 테스트 (`npm test`) |
| `integration/` | 실제 PostgreSQL 16 통합 검증 63개 검사 |
| `db/migrations/` | 이 서비스 전용 DB 계보 V001–V015. 루트 `db/`의 과거 계보와 섞지 않는다 |
| `openapi/` | API 계약 `church-os-v1.yaml` |
| `contract/` | OpenAPI 응답 스키마 검사 (Python) |
| `tools/api-db/` | Docker 기반 일회용 API+DB 검증 실행기 |

## 실행

Node 24가 필요하다.

```powershell
npm ci
npm test
```

실제 PostgreSQL 통합 검증 (Docker 필요, 이 폴더에서):

```powershell
docker compose -p church-core-verify -f tools/api-db/compose.yaml up --build --abort-on-container-exit --exit-code-from verify
docker compose -p church-core-verify -f tools/api-db/compose.yaml down --volumes --remove-orphans
```

결과는 `.evidence/api-db-result.json`에 저장되며 커밋하지 않는다. CI는 같은 검증을 실행하고 결과를 artifact로 올린다.

## 서버 설정

필수: `DATABASE_URL`, `OIDC_ISSUER`, `OIDC_AUDIENCE`, `OIDC_JWKS_URL` (OIDC URL은 HTTPS). 선택: `PORT`(기본 3000), `HOST`(기본 `127.0.0.1`). 비밀값은 비밀 관리 방식으로 주입하고 Git·로그에 남기지 않는다.

## 변경 규칙

- PR 전에 `npm run format`, `npm run lint`, `npm test`를 실행한다. CI는 `format:check`와 `lint`가 실패하면 멈춘다.
- `src/`의 `any`는 현재 19개가 상한이다(`package.json`의 `--max-warnings`). 새로 추가하지 않고, 코드를 고칠 때 줄인 만큼 상한도 낮춘다.
- 마이그레이션은 적용된 파일을 고치지 않고 V016부터 새 파일로 추가한다.
- API 변경은 `openapi/church-os-v1.yaml`과 테스트를 같은 PR에서 바꾼다.
- PASS는 실제 실행 근거가 있을 때만 쓴다.
