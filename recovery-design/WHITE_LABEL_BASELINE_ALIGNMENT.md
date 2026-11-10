# 화이트라벨·배포·업데이트 — 현재 구현 대조

2026-10-28 / SOURCE_REVIEW / PARTIAL_RECOVERY / 실제 앱·배포 실행 NOT_RUN

근거: [화이트라벨 정책](../canonical/ChurchOS_Canonical_v2.6/white-label/01_화이트라벨정책.md), [브랜드 스키마](../canonical/ChurchOS_Canonical_v2.6/white-label/brand-config.schema.json), [DB V004](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V004__operations_brand.sql), [V012](../canonical/ChurchOS_Canonical_v2.6/db/migrations/V012__runtime_security_and_privacy_fix.sql), [앱 소스](../apps/church-os/lib/main.dart), [현재 API](../canonical/ChurchOS_Canonical_v2.6/services/church-core/src/app.ts), [모바일 CI 정의](../.github/workflows/mobile-foundation.yml).

| 축 | 직접 확인 | 후속 차이 |
|---|---|---|
| 배포 유형 | INSTANT/DEDICATED_NATIVE, 같은 코드/API, 교회별 소스 포크 금지 | 실제 빌드/스토어/운영 계정·배포 자동화 완료 아님 |
| 표시/색상 | schemaVersion1.0, churchName/appLabel·logo/icon asset ref·6개 HEX 색상 | 앱 실제 소비·색 대비·이미지 권리/소유/안전성은 미검증 |
| 메뉴/모듈 | TODAY/CHURCH/COMMUNITY/MINISTRY/ME 중3~5, church/community/ministry/integrations bool | 현재 앱 홈/말씀/기도/교회생활/내정보와 의미 매핑 필요. 문자열 치환으로 동일 계약이라 가정하지 않음 |
| 언어/시간대 | 스키마 ko-KR/ja-JP/en-US/es-MX, timezone 문자열 길이만 검사 | 실제 UI는 ko만. 지원 언어 존재/시간대 유효성/번역 범위 검증 별도 |
| 도메인 | customDomain은 선택 hostname 값 | DNS 소유 확인·HTTPS·앱 링크/로그인 복귀 동작 구현 증거 아님. 관리자 웹 필수화 아님 |
| DB 브랜드 | brand_config·활성1건 unique·version/row_version·config문서 있음 | 현재 config DB check는 주요 shape, 전체 JSON schema/의미/자산/권한을 보장하지 않음 |
| 자산 | 브랜드 스키마 opaque asset ref | V012 file_asset owner_type은 NOTICE/EVENT. 로고 자산 권한/업로드가 완성됐다고 가정하지 않음 |
| 앱 실행 | MaterialApp title/색/Locale ko·교회 시연·DemoRole·Academy 토글 | 운영용 원격 설정·실제 역할/연결 미구현. 토글은 계약/권한 아님 |
| 네이티브 리소스 | Android applicationId com.zoenx.churchos_app, label churchos_app; iOS 표시명 Churchos App | 교회별 앱 식별자/설치 이름·아이콘·서명은 별도 배포 산출물 필요 |
| 서버 라우트 | 현재 app.ts에 브랜드 조회/수정/설정 게시/롤백 라우트 없음 | tenant 조회만으로 브랜드 편집/설정 배포 기능을 구현했다고 선언하지 않음 |
| CI | Flutter3.47.4 pub lock/analyze/widget test 정의 | Android/iOS 배포 빌드·서명·스토어 업로드·심사·단계 배포 검증 아님 |
| 내부 명칭 | 지저스라이프 원 사용자 표시 금지 정책 | 문자열 형식 검증만으로 금지 명칭/오류·로그인·시작 화면 전체 검사가 되지 않음 |

원본 schema·예제·canonical·앱 코드·CI를 고치지 않았다. 아래 설계는 그 차이를 후속 계약으로 메우는 초안이며 심사·배포 자격·외부 서비스 정책 충족을 주장하지 않는다.
