# ChurchOS Flutter 앱 0.1.0

앱 전용 운영 기준에 맞춘 최초 화면 흐름이다. 홈·말씀·기도·교회생활·내정보, 데모 역할별 교회 관리, 선택형 Academy를 제공한다. 한국어·Material 3이며 웹 플랫폼을 생성하지 않는다.

## 현재 구현과 제한

- 실제 로그인·서버 API·저장·기도·성경·찬송·영상·앱 이동은 연결하지 않았다. 각 화면에 시연 상태를 명시한다.
- 모든 상세 화면은 설명 화면이다. 실제 기능이 작동하는 것으로 취급하지 않는다.
- 교인/목회자/관리자 선택은 시연용이다. 실제 인증·권한 부여 기능이 아니다.
- 데모 교회 전환 시 역할·Academy 선택을 초기화한다. 실제 다중 교회 데이터 격리 검증을 대신하지 않는다.
- 교회 관리에서 개인 일기·기도·관계 원문 조회를 제공하지 않는다.
- Flutter SDK가 없는 작성 환경에서 analyze/test/Android/iOS 실행은 NOT_RUN이다. 검증 전 소스이며 v2.6 백엔드 PASS와 구분한다.

## Windows에서 준비

저장소 루트에서:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\apps\church-os\Prepare-Mobile.ps1
```

스크립트는 설치된 Flutter로 임시 프로젝트를 생성하고 누락된 Android/iOS 플랫폼 폴더만 복사한다. 기존 lib/test/pubspec은 덮어쓰지 않는다. 이어 pub get, analyze, widget test를 실행하며 실패하면 중단한다. 플랫폼 기본 식별자는 개발용 `com.zoenx.churchos_app`이며 실제 출시·화이트라벨 식별자는 별도 확정한다. 별도 관리자 웹은 생성하지 않는다.

성공 후:

```powershell
Set-Location .\apps\church-os
flutter devices
flutter run -d <모바일기기ID>
```

Android 에뮬레이터 또는 연결된 Android 기기가 필요하다. Windows에서는 iOS 앱을 빌드·실행할 수 없으며 macOS/Xcode에서 별도 검증한다. 기기가 없으면 준비·테스트만 진행하고 런타임 PASS로 표시하지 않는다.

## 검증 항목

test/app_test.dart에 앱 내 기도 동선의 데모 표시, 교인 화면의 관리자 메뉴 제외/역할 시연, 교회 전환의 관리자/Academy 상태 초기화 세 가지 위젯 테스트를 추가했다. 실제 실행 결과는 아직 없다.

다음 작업은 실제 인증과 v2.6 공지·일정 조회 연결이다. UI 시연 역할 선택을 운영 인증으로 재사용하지 않는다. 제공자 준비 후 JLPrayer/JLBible 앱 내 API 화면을 연결한다.
