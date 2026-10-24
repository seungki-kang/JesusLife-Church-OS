# 공통 인증·통합 로그인 구조 검토

2026-10-24. 상태 DESIGN. 근거: [COS-SSO-001](../../decisions/DESIGN_DECISIONS.md#cos-sso-001). 저장소 파일 열람을 통한 설계/구현 대조이며 실제 SSO 실행 검증이 아니다. 교회 개설 심사보다 공통 인증 구조 검토를 우선한다. 개설 기본 두 서류·조건부 보완 합의(COS-CHURCH-040)는 유지한다.

## 확정한 구조

ChurchOS·너랑나랑·생명일기·JLPrayer·JLBible·JLAcademy는 공통 계정과 SSO를 사용한다. 제품별 계정을 매번 새로 만드는 방식이 아니다. 제품은 독립 개발·배포하고 업무 데이터와 권한의 정본을 각각 소유한다. 공통 인증은 제품 DB 통합이나 개인 원문 중앙 수집을 뜻하지 않는다. CHGO는 독립 엔진이며 이번 사용자 SSO 범위에 추가하지 않는다.

| 구분 | 의미 | 자동으로 발생하지 않는 것 |
|---|---|---|
| 공통 계정 가입 | 공통 인증에 사용할 개인 계정 생성 | 모든 서비스 이용 시작·교회 소속·역할·개인 기록 공유 |
| 서비스 이용 시작 | 해당 제품의 이용 요건·필요 안내/약관을 거친 이용 관계 | 다른 서비스 활성화·기록 공유 |
| 교회 개설 승인 | ChurchOS에서 교회 조직 개설을 승인 | 최초 관리자 본인 수락 생략·개인 제품 권한 부여 |
| 교인 가입 승인 | 특정 교회의 일반 교인 소속 승인 | 추가 역할·다른 교회 소속·전문 제품 권한 |
| 역할 부여 | 특정 서비스·교회의 업무 범위 부여 | 다른 서비스 관리자 권한·개인 원문 열람 |
| 개인 기록 공유 동의 | 해당 제품의 대상·목적·범위에 따른 별도 공유 선택 | 공통 로그인이나 교회 관리 권한에 의한 포괄 열람 |

이 상태들은 독립적으로 검증한다. 계정·서비스 이용·공유 동의의 UI와 기록도 구별하며 이용 시작 동의를 개인 기록 공유 동의로 합치지 않는다. ChurchOS는 생명일기 원문·작성 여부·회차를 받지 않는 기존 경계를 유지한다.

## ChurchOS 안의 연동 흐름

1. 사용자가 ChurchOS에서 특정 제품 기능을 연다.
2. 유효한 공통 인증 세션을 활용해 대상 서비스용 인증 절차를 진행하고 불필요한 자격 증명 재입력을 줄인다. 대상 서비스 이용이 시작되지 않았거나 추가 안내·권한 선택이 필요하면 해당 절차를 보여준다.
3. 대상 API를 대상으로 발급된 토큰을 사용한다. ChurchOS용 토큰을 다른 API에 그대로 재사용하거나 공통 세션 자체를 모든 API의 접근 허가로 취급하지 않는다.
4. 각 API는 신뢰하는 발급자·서명·대상·유효성 및 현재 서비스 접근 권한을 검증한다. 교회 소속·역할·공유 권한은 해당 서비스가 필요한 범위에서 별도로 확인한다.
5. 인증 만료·추가 인증 필요·서비스 미이용·권한 없음·공유 철회·제공자 장애를 구분해 안내한다. 실패를 자동 승인·개인 기록 없음으로 처리하지 않는다.

유효 세션이 있어도 필요한 추가 인증까지 생략한다고 보장하지 않는다. 대상 토큰을 얻는 구체 방식, 앱 직접 호출/gateway, 세션 공유 방식·클라이언트/복귀 주소·만료/갱신·안전한 보관은 후속 계약이다. 제품 간 비밀번호·장기 토큰 전달이나 새 임의 인증 API를 이번 문서로 정하지 않는다.

## 기존 근거와 부족한 부분

| 근거 | 이미 있는 내용 | 한계·부족한 부분 |
|---|---|---|
| [기존 공통 계정 후보 설계](../../architecture/CHGO_Shared_Identity_Membership_and_Product_Consent_Contract_1.0.md) | Global User와 Product Profile, 교회 소속·동의·공유 분리, API 경계, 자동 병합 금지 | CANDIDATE. 동일한 sub 공개 방식·중앙 권한 서비스 표현은 현재 계약 확정으로 보지 않는다. 제품별 권한 정본·매핑·탈퇴 실행 계약 보완 필요 |
| [후보 YAML](../../../api/contracts/shared-identity-membership-consent-v1.yaml) | 등록·세션·제품 목록·소속·동의·grant 경로 및 불변규칙 초안 | 1.0.0-candidate. 핵심 요청/응답 schema·보안 방식·오류·토큰 audience/권한/세션 갱신·정지/탈퇴 전파 상세 부족. 실제 배포 API 아님 |
| [Identity Core](../../../services/identity-core/README.md) | 공통 인증과 독립된 계정 연결/자료 공유 방향 | RESERVED FOR CONTROLLED IMPLEMENTATION. 이 디렉터리의 README만으로 실행 서비스 존재를 입증하지 못함 |
| [C01](CONTRACT_BACKLOG_V1.5.md), [B11·운영 경계](OPERATING_SCENARIOS.md), [상세 설계](DETAILED_DESIGN_V1.5.md) | 공통 인증 기반·issuer+subject·제품별 audience·세션·동의·JLPrayer 대상 토큰 | 실제 발급자·앱 SSO·제품별 토큰 획득/갱신/철회 계약 미완료 |
| [v2.6 identity.ts](../../../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/identity.ts) | RS256 JWT, issuer/audience·필수 claim·만료/발급 시각 검증, 원격 JWKS 어댑터. 토큰의 역할/교회 claim은 무시 | ChurchOS API 검증 어댑터다. 공통 계정 등록·로그인 UI·다른 제품 토큰 발급·전 제품 세션 관리 구현이 아님 |
| [v2.6 app.ts](../../../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/app.ts), [postgres.ts](../../../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/postgres.ts) | 요청 시 인증 후 선택 교회의 활성 binding/소속/교회·역할 유효기간을 DB로 검증 | ChurchOS 범위. 공통 계정 정지·삭제의 전파나 다른 다섯 제품의 접근 검증을 입증하지 못함 |
| [v2.6 OpenAPI](../../../canonical/ChurchOS_Canonical_v2.6/api/openapi/church-os-v1.yaml) | churchOidc 보안 정의 | discovery URL은 example.invalid placeholder. 실제 제공자 연결 증거 아님 |
| [v2.6 API 테스트 소스](../../../canonical/ChurchOS_Canonical_v2.6/services/church-core/test/api.test.ts) | 잘못된 aud/iss·만료·위조 토큰·역할 claim 승격·철회 binding 차단 사례 | 로컬 키·테스트 대역 사용. 이번 실행 NOT_RUN이며 실제 제공자/6제품 SSO PASS 아님 |
| [Flutter main.dart](../../../apps/church-os/lib/main.dart) | 역할·교회 전환과 연동 화면 시연 | DemoRole과 데모 상태. 실제 인증·조회/저장·제품 이동 연결 없음 |

첫 구조 검토의 확인 범위는 이 저장소였다. 후속 [제공자·제품 로그인 현황 조사](AUTH_PROVIDER_AND_PRODUCT_INVENTORY.md)에서는 너랑나랑·생명일기 로컬 소스와 JLPrayer 설계까지 대조했다. JLBible·JLAcademy 실행 저장소와 실제 인증 제공자 설정·운영 세션·제공자 계약은 미확인이며 구현 부재로 단정하지 않는다. v2.6 과거 실행 근거를 이번 공통 SSO의 검증 결과로 재사용하지 않는다.

## 기존 후보와 현재 정책의 차이

- 후보 문서의 초대 수락→소속 ACTIVE 및 YAML의 Membership activated 응답은 현재의 모든 교인 가입 담당자 승인 원칙과 다르다. 초대 수락만으로 교인 권한을 부여하지 않는 COS-JOIN-001이 우선한다. 후보·적용된 마이그레이션·v2.6 스냅샷은 보존한다. 현재 업무 규칙은 [가입 승인·탈퇴/정지 설계 계약](ACCOUNT_MEMBERSHIP_SERVICE_SCOPE_CONTRACT.md)에 반영했다. 구체 HTTP/schema 상태 매핑은 후속 개정 사항이다.
- 후보의 공통 토큰 최소 claim 설명만으로 API 대상 제한이 충족되지 않는다. C01에 따라 각 대상 API용 토큰과 현재 서비스 권한을 함께 검증해야 한다.
- 후보의 Vault grant 경로를 ChurchOS의 일기 원문 접근 API로 해석하지 않는다. 공유는 해당 제품 정본에서 검증하며 ChurchOS의 생명일기 수집 금지 경계를 유지한다.
- 후보의 전 제품 삭제 방향은 현재 COS-SSO-019~032의 본인 확정·서비스별 정본 처리·기한·부분 실패 정책으로 구체화했다. 후보 문구만으로 삭제 완료를 주장하지 않는다.

## 현재 정책과 구현 전 과제

탈퇴·정지·공유·삭제·복구의 주요 정책은 COS-SSO-001~048로 설계 합의했다. [현재 정책·기한·책임·결정 추적표](ACCOUNT_MEMBERSHIP_SERVICE_SCOPE_CONTRACT.md)를 적용한다. COS-SSO-048도 사용자 동의로 확정했으며 검증된 미해소 위험 재가입은 완료 전에 보안 담당자가 확인한다. 실제 제공자·토큰/세션·식별/상태 매핑·제품별 데이터 경계·운영 담당자·실행 증거 등은 같은 문서의 구현 전 과제로 관리한다.

이 문서는 인증 구조와 기존 구현 근거의 검토 기록이다. 반복 인터뷰 요약은 현재 계약표로 통합했고 선택 이유·대안·당시 미결 이력은 [결정 기록](../../decisions/DESIGN_DECISIONS.md)에 그대로 보존했다. 실제 다제품 인증·모바일 복귀·삭제/차단/복원 실행 검증은 NOT_RUN이다.
