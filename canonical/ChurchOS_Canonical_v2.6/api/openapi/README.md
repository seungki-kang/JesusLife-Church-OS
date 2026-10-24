# Church OS OpenAPI v1 Candidate

`church-os-v1.yaml`은 Church OS가 직접 소유하는 교회 운영 API의 첫 독립 기준선이다.

## 포함

- tenant, membership, community
- worship/event, attendance
- care workflow, ministry assignment
- member Today, pastor aggregate Overview
- bounded white-label configuration
- 전문 앱 연결 상태와 1회용 handoff

## 제외

- Life Diary Vault CRUD와 7문항 원문
- JLPrayer 기도·간증·상담 원문
- JLBible 본문 및 통독 온톨로지 정본
- CHGO Evidence·Reasoning 내부 API
- JesusLife Canonical 변경 API

서버 URL과 OIDC discovery URL은 승인 전 placeholder이며 실제 배포값이 아니다. 이 문서는 Candidate이고 runtime evidence가 아니다.

