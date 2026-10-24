현재 v2.6의 실행 안내는 START_LIFECYCLE.md를 따른다. 이 문서는 이전 단계의 참고 자료다.

# 다음 확인: 서버 테스트

v2.2 DB 검증은 사용자 Docker 환경에서 PASS 확인했다. v2.3.1은 같은 SQL V001~V013을 유지하고 서버 0.1.0을 추가했다. 조회 API·인증·권한의 첫 구현이며 전체 기능 완성이 아니다.

1. ZIP을 새 ChurchOS_Canonical_v2.3.1 폴더에 해제한다.
2. VS Code에서 새 폴더를 연다.
3. 터미널에서 실행한다.

```powershell
cd .\services\church-core
npm ci
npm audit
npm test
```

종료된 출력 결과를 확인한다. Docker 재설치나 기존 DB 재적용은 필요하지 않다. 이 테스트는 합성 저장소·로컬 서명키를 사용한다. 실제 계정·DB가 없어도 가능하다.

그다음은 실제 PostgreSQL과 이 API 서버를 함께 실행하는 통합 검사다. 전체 운영·앱 테스트 완료로 표시하지 않는다. 외부에 공개하거나 운영 DB에 연결하지 않는다.
