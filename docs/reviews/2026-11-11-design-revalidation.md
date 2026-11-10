# ChurchOS 저장 설계 재검증 — 2026-11-11

## 검토 범위와 판정

기준 GitHub main은 `6251fa2`(PR #12 병합)다. 읽기 전용으로 최신 기준을 확보한 뒤 별도 `docs/churchos-design-revalidation` 브랜치에서 문서 수정과 검증 도구를 작성했다. 이번 정적 검토는 링크·파일 형식·결정 순서·인계표 일치와 현재 코드/문서의 주요 상태 대조다. 설계의 모든 의미·신학·보유 정책·외부 제공자 계약을 독립적으로 승인한 것이 아니며 운영 출시를 보증하지 않는다.

처음 확인한 main의 추적 파일은 593개다. Markdown 239개, CSV 59개, JSON 51개, DOCX 27개를 검사했다. DOCX는 ZIP CRC와 주 문서 XML의 구조만 확인했으며 모든 문장과 시각 배치를 전수 검토하지 않았다. 외부 URL은 자동 검사에서 개수만 세고 접근 여부를 검사하지 않는다.

## 수정한 상태 혼동

| 항목 | 수정 |
|---|---|
| README의 v1.3 ‘최신’ 표현 | 과거 인계임을 명시하고 현재 통합 안내로 연결 |
| START_HERE의 정본 표현 | v2.6 구현 스냅샷과 후속 운영/결정 권위를 구분. 설계 검토 중 런타임 자동 착수 금지 |
| 앱 README 테스트 상충 | 사용자 제공 3개 PASS와 이번 환경의 Flutter 미실행을 구분 |
| 구조 안내의 관리자 웹·서비스·DB | 관리자 웹 비활성, 루트 서비스 예약 상태, 실제 구현 위치, 과거 DB/API 계보 구분 |
| 구조 안내의 제품 소유권·공통 ID·관리자 열람 | Academy와 CHGO의 독립 책임을 구분. 내부 생태계 명칭을 인증 서비스 구현으로 오해하지 않게 수정. 허용된 교회 운영 조회와 금지된 개인 영성 조회 구분 |
| 기본 MVP 인계의 오래된 다음 질문·숫자 | 현재 공동체 14작업/162시나리오 연결, 합의된 참여 정책을 다시 묻지 않게 수정 |
| 게이트의 과거 리비전 이력 | 현재 수량을 별도로 제시하고 아래 리비전별 ‘다음’ 문장은 당시 이력임을 명시 |
| 구현 차단표의 GitHub 미확인 | 현재 GitHub 확인과 소실 원문 부분복원 한계를 구분 |

과거 리비전 이력·COS/REC 승인 내용·교재/신학 문구·canonical 해시/마이그레이션은 변경하지 않는다. 기존 정본 CSV의 빈 물리 행은 유효하므로 제거하지 않았다.

## 검증과 재실행

문서 검사기는 [validate_design_docs.py](../../tools/validation/validate_design_docs.py), 실패 사례 테스트는 [test_design_validation.py](../../tests/design/test_design_validation.py)다. 새 [CI 정의](../../.github/workflows/design-documents.yml)는 문서·검사기 변경 시 실행하도록 작성했으나 GitHub 실행 결과는 아직 NOT_RUN이다.

```sh
python -m pip install -r tools/validation/requirements-design.txt
python -m unittest discover -s tests/design -p 'test_*.py'
python tools/validation/validate_design_docs.py
```

검사기는 Git 추적/미추적 비제외 파일을 읽고 Markdown 링크/제목 앵커, CSV 열, JSON 중복 키/비표준 숫자, DOCX 구조, COS/REC 결정 번호, MVP Markdown/CSV 공통 열을 검사한다. 코드 블록 예시를 링크로 오인하지 않으며 외부 네트워크나 DB에 접근하지 않는다. 문서 규칙의 정적 검사이며 모든 권한·수명 규칙을 증명하지 않는다.

| 실제 재실행 | 결과와 범위 |
|---|---|
| canonical tools/validate.py | PASS — 파일 매니페스트·마이그레이션 해시·구조 검증 |
| canonical tools/sql_syntax.py | PASS — PostgreSQL 파서로 SQL 21개 검사. 실제 DB 실행 아님 |
| canonical Python 회귀 | 24개 PASS |
| Node 설치·빌드·회귀 | npm ci(설치 스크립트·audit 제외), TypeScript 빌드 및 80개 테스트 PASS. 별도 임시 복사본에서 실행 |
| E5·B04·C02 기존 검사기 | 정적 검사 PASS. E5·C02 운영 게이트 OPEN 유지 |
| 신규 문서 검사기·실패 사례 | 최종 결과는 [기계 판정](2026-11-11-design-revalidation.json)에 기록 |
| Flutter·실기기·실제 PostgreSQL·SSO·외부 제품·삭제/복구·파일럿 | 이번 작업에서 NOT_RUN |

이번 환경의 실행은 Python 3.12와 Node 24다. 새 CI는 Python 3.13을 지정했으므로 로컬 통과를 원격 CI 실행으로 표시하지 않는다. 기존 npm audit 결과는 과거 검사 시점의 기록이며 이번에 취약점이 없다고 새 판정하지 않았다.

## 해결된 것으로 보지 않는 항목

- 실제 공통 인증 제공자와 여섯 사용자 제품의 SSO·토큰 발급/갱신/철회 연동.
- 직함과 독립된 가입/업무/게시 위임의 서버 구현, 권한 회수 경합과 교회 간 데이터 격리.
- v2.6 PATCH 즉시 변경과 후속 편집본/게시본 분리의 이행. 기존 API를 새 초안 계약으로 사용하지 않는다.
- 소개 철회의 확정 시각·결과 증거·복원 차단, 기록별 보유/삭제/백업 상한과 실제 사본.
- 새 교회 소개 온라인 확인 후보와 REC-005/006 공개 캐시 경계. 기존 7일 단위 미결은 유지.
- 화이트라벨 설정의 실제 게시 API·모바일 적용·설치/교회 연결·콘텐츠 권리·제공자 계약.
- 사람 심사 담당·신학 기준과 교단 후보의 운영 채택. AI가 판정하거나 문서 저장으로 채택하지 않는다.

현재 18개 차단표를 완료로 바꾸지 않는다. 통과한 정적 항목과 실행 전 게이트를 나눠 개발 준비에 사용한다. 다음은 새 품질 기준을 기존 인계와 연결하고, 작은 기능 단위로 화면·행위·현재 권한·입출력·실패·테스트를 함께 확정하는 작업이다.
