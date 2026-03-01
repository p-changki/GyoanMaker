# Express + Gemini(/generate) Backend Implementation Plan (Node 20)

## TL;DR

> **목표**: 기존 Next.js 프런트 레포(`/Users/changkipark/Desktop/GyoanMaker`)에 **별도 프로세스의 Node.js + Express 백엔드**를 추가하고, `POST /generate`로 `@google/genai`를 통해 `gemini-3.1-pro-preview` 호출.
>
> **지금 시작 가능?** 가능. 최종 `systemInstruction` 텍스트가 없어도 **서버/검증/배포 골격은 100% 구현 가능**. 다만 프롬프트 품질/정책은 최종 텍스트가 있어야 확정.

**Feasibility Verdict (요약)**

- 시작 가능(YES): API 서버/계약/검증/에러처리/순차 처리/도커/Cloud Run 준비는 프롬프트 텍스트 없이도 진행 가능.
- 부분 블로킹(부분): `systemInstruction` 최종 문구 제공 전에는 “출력 품질/정책” 검증이 불가(기능적 동작 검증은 가능).
- 주요 리스크(중요): "Vertex AI" 표기와 달리 요구 baseline이 `GoogleGenAI({ apiKey })`라 **API Key 기반(Gemini Developer API 스타일)**로 해석될 가능성. (계획 내에 완충 전략 포함)

---

## Context (Repo Fact)

- Next.js App Router 템플릿 레포. 현재 생성 플로우는 백엔드 호출 없이 mock 기반(`src/lib/mockData.ts`).
- Node: `.nvmrc` = `20.9.0`, root `package.json` engines: `>=20.9`.
- Root `package.json`에는 `"type":"module"` 없음(= CJS 기본). 기존 Next 관련 `.js` 설정 파일들이 있어 repo-wide ESM 전환은 금지(가드레일).
- `package-lock.json` 존재(= npm 사용).
- `.env.example` 존재(커밋됨), `.env.local` 존재(커밋 대상 아님). `.env.example`는 현재 `NEXT_PUBLIC_*` 위주.
- `Dockerfile` 없음.

---

## Scope

**IN (반드시 포함)**

- Express 서버(루트 `server.js`) + `POST /generate`
- 요청/응답 계약 준수
- 입력 검증(타입/빈 문자열/최대 20)
- 순차 처리(기본) + **bounded parallel(3~5) 확장 경로**를 위한 전략 인터페이스
- CORS `*`(현재), env var 기반 설정, 도커/Cloud Run 준비

**OUT (이번 범위 아님)**

- DB/auth/queue/작업자(worker)/스트리밍 응답(SSE)
- 프롬프트 최종 문구 설계/정책 확정(텍스트 제공 전까지는 placeholder)

---

## Deliverables (Concrete Files)

- `server.js` (Express entry)
- `package.json` (deps + scripts)
- `.env.example` (backend env placeholder 추가)
- `Dockerfile` (Cloud Run용 최소)
- Optional helper modules (권장, 1~3개로 제한)
  - `server/validation.js`
  - `server/processor.js` (sequential + bounded-parallel strategy)
  - `server/gemini.js` (SDK client + generateOne wrapper)
- Optional (권장): `.dockerignore` (이미지 사이즈/빌드속도 개선)

---

## API Contract: `POST /generate`

**Request**

- Method/Path: `POST /generate`
- Headers:
  - `Content-Type: application/json`
- Body:

```json
{ "passages": ["string", "string"] }
```

**Validation Rules (서버 강제)**

- `passages`는 필수
- `passages`는 배열
- 길이: `1..20` (20 초과 즉시 400)
- 각 항목: string
- 빈 문자열 정책(권장 기본값): `trim()` 후 길이 0이면 400 ("빈 입력"을 모델로 보내지 않음)
- (권장 기본값) 각 passage 최대 길이 제한: 예) 5,000 chars (초과 시 400)
  - 이유: Cloud Run 요청/응답 시간 + 비용 폭주 방지. 필요 시 env로 상향.

**Response (성공)**

- Status: `200`

```json
{
  "results": [
    { "index": 0, "outputText": "..." },
    { "index": 1, "outputText": "..." }
  ]
}
```

- `results.length === passages.length`
- `index`는 **입력 순서 기반**으로 고정(순차/병렬 모두 동일)

**Error Response (표준화 권장)**

- Body shape (고정):

```json
{ "error": { "code": "STRING", "message": "STRING" } }
```

- Status mapping (권장):
  - `400 INVALID_REQUEST`: 스키마/길이/빈 문자열/타입 오류
  - `415 UNSUPPORTED_MEDIA_TYPE`: `Content-Type`이 JSON이 아님
  - `500 CONFIG_MISSING`: 서버 시작 시 필수 env 누락(가능하면 부팅 단계에서 fail-fast)
  - `502 UPSTREAM_ERROR`: 모델 SDK 호출 실패(네트워크/권한/모델 불가)
  - `504 UPSTREAM_TIMEOUT`: (선택) 업스트림 타임아웃을 구분할 경우

---

## Processing Design

### 1) Sequential First (기본)

- 처리 흐름: 입력 배열을 `index=0..n-1`로 순회하며 **한 번에 하나씩** 모델 호출 → 결과 누적.
- 장점: 비용/쿼터/SDK 제한/타임아웃 리스크를 가장 단순하게 관리.

### 2) Clean Extension Path: Bounded Parallel (limit 3~5)

**전략 인터페이스(계획상 구조)**

- `processSequential(passages, generateOne) -> results[]`
- `processBoundedParallel(passages, generateOne, limit) -> results[]`
- 공통 계약:
  - 결과는 `{ index, outputText }`로 반환
  - 어떤 처리 방식이든 **index 기반으로 deterministic mapping**
  - limit는 3~5 범위에서 env로 조절 가능(예: `GEN_CONCURRENCY=3`)

**확장 가드레일**

- 병렬 처리 도입 시에도 응답 정렬은 `index`로 재정렬
- per-item 실패 정책은 현재 계약상 응답에 담을 자리가 없으므로 “전체 실패” 유지(추후 계약 변경 시에만 부분 성공 지원)

---

## Security Checklist (MUST)

- Secrets: `process.env`만 사용. 코드/리포에 키 하드코딩 금지.
- `.env.local`은 커밋 금지(현 상태 유지). `.env.example`에는 placeholder만.
- 입력 검증: 스키마 + 길이 + 빈 문자열 정책 강제.
- JSON body limit 설정(예: 200kb) + `Content-Type` 검사.
- CORS: `*` 허용은 임시. `credentials: false` 고정.
- 로그/에러: 키/원문 passage/SDK raw payload 누출 금지(필요 시 길이만 로깅).
- (미래 메모) 프로덕션 전 `Origin allowlist` + rate limit(요청 폭주 방지) 고려.

---

## Local Run / Docker / Cloud Run Readiness

### Local Run (목표 커맨드)

```bash
npm i
GOOGLE_CLOUD_API_KEY=... PORT=4000 node server.js
```

권장(편의): `dotenv`로 `.env.local` 로드(계획에 포함).

### Docker (로컬 검증)

```bash
docker build -t gyoan-api .
docker run --rm -p 8080:8080 -e PORT=8080 -e GOOGLE_CLOUD_API_KEY=... gyoan-api
```

### Cloud Run (준비 체크리스트)

- Container listens on `$PORT` (Cloud Run sets it; 기본 8080)
- No filesystem secrets; use Cloud Run env vars / Secret Manager
- 적절한 request timeout 설정(순차 20개 호출 시 지연 가능)
- 최소 권한 원칙(만약 Vertex IAM을 쓸 경우 서비스 계정 권한 설계 필요)

Cloud Run 배포 커맨드(예시, 프로젝트/리전/레지스트리 값은 환경에 맞게 치환)

```bash
# 1) 이미지 빌드/푸시 (Cloud Build)
gcloud builds submit --tag "REGION-docker.pkg.dev/PROJECT/REPO/gyoan-api:latest"

# 2) Cloud Run 배포 (Secret Manager 권장)
gcloud run deploy "gyoan-api" \
  --image "REGION-docker.pkg.dev/PROJECT/REPO/gyoan-api:latest" \
  --region "REGION" \
  --set-env-vars "PORT=8080" \
  --set-secrets "GOOGLE_CLOUD_API_KEY=GOOGLE_CLOUD_API_KEY:latest"
```

---

## Implementation Now vs Blocked

### A) 지금 바로 구현 가능한 것

- Express 서버 + `POST /generate` + validation + error contract + sequential processor
- bounded parallel 확장 포인트(전략 인터페이스 + 구현 스켈레톤, 기본은 sequential)
- SDK wiring(`@google/genai`), env 구성, CORS `*`
- Dockerfile + (선택) .dockerignore
- curl 기반 QA, Docker/Cloud Run 실행 검증

### B) 최종 systemInstruction 텍스트 없으면 막히는 것

- `systemInstruction` 최종 문구 확정 및 품질/정책 검증
- 프롬프트 버전 관리/검수 프로세스(조직 정책에 따라)

---

## Execution Strategy (Parallel Waves)

Wave 1 (foundation, 즉시 병렬 가능)

- T1 계약/에러/검증 정책 문서화(서버 내부 상수로 반영)
- T2 `package.json` deps/scripts 계획 및 설치 커맨드 확정
- T3 `.env.example` 확장 + 로컬 실행 표준 확정
- T4 Dockerfile(+선택 .dockerignore) 초안
- T5 SDK/Vertex-vs-API-key 리스크 완충(최소 검증 절차 포함)

Wave 2 (core implementation)

- T6 validation 모듈
- T7 processor 모듈(sequential + bounded parallel 인터페이스)
- T8 gemini 호출 래퍼 모듈(`@google/genai` + systemInstruction placeholder)
- T9 `server.js`(Express) 라우팅/미들웨어/에러핸들러

Wave 3 (verification + readiness)

- T10 로컬 curl QA + Docker run QA + Cloud Run 배포 리허설 체크리스트

---

## TODOs (Executable Task List)

> 각 작업은 1~3개 파일을 목표로 쪼갬. (작업자는 이 문서만 보고 실행 가능해야 함)

- [ ] T1. API 계약/검증/에러 정책 확정(서버 상수로 표현)

  **What to do**:
  - 계약을 코드 상수로 표현할 항목 확정: max 20, 빈 문자열 정책, (권장) max chars, json body limit, error code 리스트.
  - “전체 실패(all-or-nothing)” 정책을 문서/코드 구조에 반영.

  **Files**: `server/validation.js` (또는 `server/constants.js` 1개로 합쳐도 됨)

  **QA Scenarios (agent-executable)**:

  ```
  Scenario: Validation boundary list is explicit
    Evidence: .sisyphus/evidence/t1-policy.txt
  ```

- [ ] T2. `package.json` 백엔드 deps/scripts 추가 계획 및 설치

  **What to do**:
  - deps 추가(권장): `express`, `cors`, `dotenv`, `@google/genai`, (검증) `zod` 또는 동급
  - scripts 추가(권장):
    - `server`: `node server.js`
    - `dev:server`: (선택) `node server.js` (nodemon은 optional)
  - 기존 Next 스크립트/빌드에 영향 없게 유지.

  **Files**: `package.json`

  **Commands**:
  - `npm i express cors dotenv @google/genai zod`

  **QA Scenarios**:

  ```
  Scenario: Dependencies installed
    Steps: npm i
    Expected: npm exits 0, package-lock.json updated
    Evidence: .sisyphus/evidence/t2-npm-install.txt
  ```

- [ ] T3. `.env.example` 확장(백엔드 키 placeholder + 포트)

  **What to do**:
  - `.env.example`에 아래 placeholder 추가(하드코딩 금지):
    - `GOOGLE_CLOUD_API_KEY=`
    - `PORT=4000`
    - (선택) `GEN_CONCURRENCY=3` (기본 sequential이면 없어도 됨)
  - README의 `NEXT_PUBLIC_API_BASE_URL` 예시(4000)와 불일치 없게 정리.

  **Files**: `.env.example`

  **QA Scenarios**:

  ```
  Scenario: .env.example contains backend placeholders only
    Expected: no real secrets, only empty values
    Evidence: .sisyphus/evidence/t3-env-example-review.txt
  ```

- [ ] T4. Dockerfile(Cloud Run 최소) 추가

  **What to do**:
  - Node 20 기반 이미지
  - `npm ci` (lockfile 사용) + `node server.js` 실행
  - `EXPOSE 8080` + `PORT` 사용
  - (권장) `.dockerignore`로 `.next/`, `node_modules/`, `.env*` 제외

  **Files**: `Dockerfile` (+ optional `.dockerignore`)

  **QA Scenarios**:

  ```
  Scenario: Docker image builds
    Steps: docker build -t gyoan-api .
    Expected: build succeeds
    Evidence: .sisyphus/evidence/t4-docker-build.txt
  ```

- [ ] T5. SDK/인증 모드 리스크 완충(최소 검증 절차)

  **What to do**:
  - 요구사항 baseline은 유지: `GoogleGenAI({ apiKey: process.env.GOOGLE_CLOUD_API_KEY })`.
  - 단, "Vertex AI"로 운영해야 한다면 IAM/ADC 기반 전환이 필요할 수 있음을 명시(이번 구현은 key 기반으로 우선).
  - 구현 전 검증(실행자 단계): 로컬에서 1회 호출이 실제로 성공하는지 확인.

  **Files**: (코드 변경 최소화 원칙) `server/gemini.js`에 진단용 error mapping만 포함

  **QA Scenarios**:

  ```
  Scenario: Single model call succeeds with provided key
    Preconditions: GOOGLE_CLOUD_API_KEY is set
    Steps: curl POST /generate with 1 passage
    Expected: 200 with results[0].outputText non-empty
    Evidence: .sisyphus/evidence/t5-single-call.json
  ```

- [ ] T6. Validation 모듈 구현(요청 스키마 + 정책)

  **What to do**:
  - `{ passages: string[] }` 스키마 검증
  - max 20 enforce
  - 빈 문자열 처리(권장): trim 후 empty reject
  - (권장) passage max chars + json body limit 수치 확정

  **Files**: `server/validation.js`

  **QA Scenarios**:

  ```
  Scenario: Rejects invalid body
    Steps: curl -i POST /generate with {}
    Expected: 400, error.code=INVALID_REQUEST
    Evidence: .sisyphus/evidence/t6-invalid-400.txt
  ```

- [ ] T7. Processor 전략 인터페이스 + sequential 구현 (+ bounded parallel 확장점)

  **What to do**:
  - `processSequential()` 구현(기본 경로)
  - `processBoundedParallel(limit)`는 구현하거나(권장) 최소 스켈레톤으로 두되, API 응답은 동일 contract 유지
  - 어떤 경우에도 `{ index, outputText }` 매핑이 입력 순서와 1:1

  **Files**: `server/processor.js`

  **QA Scenarios**:

  ```
  Scenario: Deterministic index mapping
    Steps: call /generate with 2 passages
    Expected: results contain index 0 and 1, and results are sorted by index
    Evidence: .sisyphus/evidence/t7-index-mapping.json
  ```

- [ ] T8. Gemini 호출 래퍼(`@google/genai`) + systemInstruction placeholder

  **What to do**:
  - `GoogleGenAI({ apiKey: process.env.GOOGLE_CLOUD_API_KEY })`로 client 생성
  - 모델: `gemini-3.1-pro-preview`
  - `systemInstruction`은 서버 상수 placeholder로 주입(최종 텍스트 교체만으로 업데이트 가능하게)
  - SDK 오류를 `UPSTREAM_ERROR`로 매핑(메시지는 sanitize)

  **Files**: `server/gemini.js`

  **QA Scenarios**:

  ```
  Scenario: Missing key fails fast
    Preconditions: GOOGLE_CLOUD_API_KEY unset
    Steps: start server
    Expected: process exits non-zero with CONFIG_MISSING (or equivalent)
    Evidence: .sisyphus/evidence/t8-missing-key.txt
  ```

- [ ] T9. `server.js` Express entry + `POST /generate` 라우트 + 에러 핸들링

  **What to do**:
  - 미들웨어: `express.json({ limit })`, CORS `*`, Content-Type 검사
  - Route: `POST /generate`
  - 기본 처리: sequential processor 사용
  - 응답: `{ results: [...] }` + status 200
  - 에러: 정책대로 status + `{ error: { code, message } }`
  - listen: `0.0.0.0` + `process.env.PORT || 4000`
  - 로컬 편의: `dotenv`로 `.env.local` 로드(존재 시)

  **Files**: `server.js`

  **QA Scenarios**:

  ```
  Scenario: Happy path
    Steps: curl POST /generate with 2 passages
    Expected: 200 + results length 2
    Evidence: .sisyphus/evidence/t9-happy.json

  Scenario: CORS preflight
    Steps: curl -i -X OPTIONS /generate with Origin + Access-Control-Request-Method
    Expected: 204/200 with Access-Control-Allow-Origin: *
    Evidence: .sisyphus/evidence/t9-cors.txt
  ```

- [ ] T10. End-to-end verification (Local + Docker) + Cloud Run 배포 리허설 체크

  **What to do**:
  - 로컬 실행 커맨드/환경 표준화
  - curl QA(성공/실패 케이스)
  - Docker build/run QA
  - Cloud Run readiness checklist 확인(포트/환경변수/timeout)

  **Commands (검증용)**:

  ```bash
  npm i
  GOOGLE_CLOUD_API_KEY=... PORT=4000 node server.js

  curl -i -X POST http://localhost:4000/generate -H "Content-Type: application/json" -d '{"passages":["A","B"]}'
  curl -i -X POST http://localhost:4000/generate -H "Content-Type: application/json" -d '{}'
  curl -i -X POST http://localhost:4000/generate -H "Content-Type: application/json" -d '{"passages":"x"}'

  docker build -t gyoan-api .
  docker run --rm -p 8080:8080 -e PORT=8080 -e GOOGLE_CLOUD_API_KEY=... gyoan-api
  curl -i -X POST http://localhost:8080/generate -H "Content-Type: application/json" -d '{"passages":["A"]}'
  ```

  **QA Scenarios**:

  ```
  Scenario: Docker run works on PORT=8080
    Expected: 200 response from container
    Evidence: .sisyphus/evidence/t10-docker-run.txt
  ```

---

## Risks / Open Questions + Recommended Defaults

**R1 (Critical)**: Vertex AI vs API-key mismatch

- 질문: 실제 운영 목표가 Vertex IAM인가, API key 기반 호출인가?
- 권장 기본값(즉시 구현용): 요구사항대로 `GOOGLE_CLOUD_API_KEY` 기반으로 먼저 구현(로컬/개발 검증), 추후 Vertex IAM 전환은 별도 작업으로 분리.

**R2 (Latency/Timeout)**: 20 passages 순차 호출 시 지연

- 권장 기본값: 기본은 sequential 유지 + Cloud Run timeout 여유 있게 설정(예: 300s) + passage 길이 제한.

**R3 (계약 제약)**: per-item 실패를 응답에 표현 불가

- 권장 기본값: 전체 실패. 부분 성공이 필요하면 계약을 `results[].error` 포함 형태로 확장하는 별도 RFC 필요.

**R4 (Module system)**: ESM 전환 유혹

- 권장 기본값: repo-wide `type: module` 변경 금지. `server.js`는 CJS로 유지.
