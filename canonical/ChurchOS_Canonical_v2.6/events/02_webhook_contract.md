# Church OS Webhook 계약

## 전달 헤더

- `Content-Type: application/cloudevents+json`
- `X-Church-Webhook-Id`: event UUID
- `X-Church-Webhook-Timestamp`: Unix seconds
- `X-Church-Webhook-Signature`: `v1=` + HMAC-SHA256
- `X-Church-Schema-Version`: payload schema version

서명 대상은 `timestamp + "." + exact_request_body_bytes`다. secret 값은 DB에 평문으로 저장하지 않고 `secret_ref`로 외부 비밀 저장소를 참조한다.

## 수신 검증

1. HTTPS와 허용된 endpoint 확인
2. timestamp 허용오차 5분 이내 확인
3. constant-time 방식으로 서명 검증
4. webhook ID 재사용 여부 확인
5. envelope와 payload JSON Schema 검증
6. client와 tenant binding 확인
7. purpose·scope·consent 정책 적용
8. idempotent 처리 후 2xx 반환

## 재시도

- 2xx: 성공
- 408, 425, 429, 5xx: 지수 backoff와 jitter로 재시도
- 기타 4xx: 기본 재시도하지 않고 격리
- 동일 event ID와 body를 유지
- 최대 횟수 후 QUARANTINED 상태로 전환
- 수동 재처리는 새 delivery attempt만 만들고 domain event를 복제하지 않음

## 개인정보

Webhook에는 생명일기·기도·상담·너랑나랑 원문을 넣지 않는다. URL, 헤더, 로그에도 원문이나 provider token을 넣지 않는다. 전달 이력에는 event ID, endpoint ref, 상태코드, 시각, 지연시간, attempt만 기록한다.

