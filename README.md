# 🚀 GyoanMaker

_▶ [🇰🇷 한국어 버전은 아래에 있습니다. (Korean version below)](#-gyoanmaker-교안-메이커---한국어)_

An AI educational material compiler that analyzes English passages using **Google Gemini 2.5 Pro** and automatically generates a **high-quality, pixel-perfect printable UI** identical to real academy-distributed PDF handouts.

## 🌟 Key Features

### 1. Pixel-Perfect UI Rendering

- Perfectly matches the layout of the original lecture handout (65% English : 35% Korean ratio).
- Automatically publishes circular badges for numbers, avatar overlap designs, and a 4-column vocabulary table (Core Vocabulary | Meaning | Synonyms | Antonyms).
- Responsive 3-column layout (Nav / Canvas / Control Panel) using Tailwind CSS.

### 2. Advanced Prompt Engineering

- Extracts high-difficulty vocabulary and diverse synonyms/antonyms at the **TEPS / CSAT (CEFR B2-C1)** level.
- Uses elegant paraphrasing and natural connectors, eliminating awkward literal Korean translations.

### 3. Strong Security Architecture (Vercel Proxy → Cloud Run)

- Next.js API Routes Proxy (`/api/generate`) prevents exposing the backend directly to the browser.
- Backend (Cloud Run) middleware layer issuing and authenticating `API_KEY` to completely block AI prompt injection and cost bombs.

### 4. File-Based Prompt Management System

- Git-based prompt version control via the `server/system-prompt.txt` file.
- Real-time tracking of the prompt hash (SHA-256) and the model in use via the `/meta` endpoint.

### 5. Client-Side PDF Generation & Inline Editing (No Backend Cost)

- Uses `html2canvas` and `jsPDF` to capture and render high-quality A4 PDF handouts entirely within the user's browser, eliminating expensive server-side rendering costs.
- Includes inline editing powered by `Zustand` to customize header text before exporting the PDF.

## 🚀 Getting Started (Local Execution)

Anyone can clone this repository, provide their **own Gemini API Key**, and instantly run the handout generator locally!

### Prerequisites

- Node.js 20.9+
- npm (default) or pnpm
- **Google Gemini API Key** (or Google Cloud Vertex AI access)

### 1️⃣ Installation & Environment Setup

```bash
git clone <repository_url>
cd GyoanMaker
npm install

# Copy environment variables
cp .env.example .env.local
```

Open the `.env.local` file and set the following required variables:

**Backend auth — choose ONE mode:**

- **(A) API Key mode (simple, local dev):** Set `GOOGLE_API_KEY` to your Gemini API Key.
- **(B) Vertex AI ADC mode (same as production):** Set `GOOGLE_CLOUD_PROJECT` and run `gcloud auth application-default login`. `GOOGLE_API_KEY` is not required.

**Proxy auth (required for both modes):**

1. `API_KEY`: Any secret password to protect the local backend.
2. `CLOUDRUN_API_KEY`: The password the frontend uses to call the backend (must be identical to `API_KEY`).

### 2️⃣ Running 2 Local Servers Simultaneously

This project operates with separate frontend (Next.js) and backend API (Node.js Express) servers.
Open 2 terminals and run the following commands in each.

**Terminal A (Backend API Server - Port 4000):**

```bash
npm run start:api
```

**Terminal B (Frontend UI - Port 3000):**

```bash
npm run dev
```

Now open a web browser to [http://localhost:3000](http://localhost:3000) and try out GyoanMaker with the applied prompt!

### 3️⃣ Sample Local Test

Once the UI is running, follow the left panel guide, input the sample English text below, and check the quality!

**Sample English Text:**

> Some people argue that there is a single, logically consistent concept known as reading that can be neatly set apart from everything else people do with books. Is reading really that simple? The most productive way to think about reading is as a loosely related set of behaviors that belong together owing to family resemblances, as Ludwig Wittgenstein used the phrase, without having in common a single defining trait.

1. Paste the text above into the `Raw Text Input` area on the frontend screen.
2. Click the `[Parse Handout Data]` button.
3. The data is sent to the backend, and you can see the Gemini 2.5 Pro model rendering the data in a **perfect PDF handout layout** directly in the center of the screen!

_(For advanced usage, architecture details, and Cloud Run deployment, please refer to the Korean documentation below or strictly use translation tools)._

---

# 🚀 GyoanMaker (교안 메이커) - 한국어

Google Gemini 2.5 Pro를 활용하여 영어 지문을 분석하고, 실제 학원 배포용 **PDF 교안과 픽셀 레벨로 동일한 고품질 인쇄용 UI**를 자동 생성하는 AI 교육 자료 컴파일러입니다.

## 🌟 주요 기능 (Key Features)

### 1. 완벽한 PDF 렌더링 (Pixel-Perfect UI)

- 원본 강의용 교안의 레이아웃(영문 65% : 한글 35% 비율) 완벽 일치 반영.
- 01 숫자 둥근 뱃징, 아바타 오버랩 디자인, 4열 어휘 테이블(핵심어휘|뜻|유의어|반의어) 자동 퍼블리싱.
- Tailwind CSS를 활용한 반응형 3단 레이아웃(Nav / Canvas / Control Panel).

### 2. 고도화된 프롬프트 엔지니어링

- **TEPS / 수능 (CEFR B2-C1)** 수준의 고난도 어휘 및 다채로운 유의어/반의어 추출.
- 한국어 직역의 어색함을 없앤 유려한 의역 및 부드러운 연결어 사용.

### 3. 강력한 보안 아키텍처 (Vercel Proxy → Cloud Run)

- 프론트엔드 브라우저 노출을 방지하는 Next.js API Routes Proxy (`/api/generate`).
- 백엔드(Cloud Run)의 `API_KEY` 발급 및 인증 미들웨어 레이어로 AI 비용 폭탄 원천 차단.

### 4. 파일 기반 프롬프트 관리 시스템

- `server/system-prompt.txt` 파일을 통한 Git 기반의 프롬프트 버전 관리.
- `/meta` 엔드포인트를 통한 실시간 프롬프트 해시(SHA-256) 및 사용 모델 추적 가능.

### 5. 클라이언트 사이드 PDF 렌더링 & 인라인 에디팅 기능

- 별도의 비싼 PDF 렌더링 서버(Puppeteer 등) 없이 오직 유저의 브라우저 자원(`html2canvas`, `jspdf`)만으로 A4 고해상도 PDF 파일을 1초 안에 자동 병합 및 추출.
- `Zustand` 기반의 상태 관리를 통해 "고1 25년 9월" 등 실제 교안 배포에 필요한 커스텀 헤더 텍스트를 즉시 편집하고 PDF에 구워낼 수 있습니다.

## 🚀 시작하기 (로컬 실행 방법)

누구나 이 저장소를 클론하여 **본인의 Gemini API Key**만 넣으면 즉시 로컬에서 교안 자동 생성기를 실행해볼 수 있습니다.

### 필수 요구사항

- Node.js 20.9 이상
- npm(기본) 또는 pnpm
- **Google Gemini API Key** (또는 Google Cloud Vertex AI 권한)

### 1️⃣ 설치 및 환경 변수 세팅

```bash
git clone <저장소 주소>
cd GyoanMaker
npm install

# 환경변수 파일 복사
cp .env.example .env.local
```

`.env.local` 파일을 열어 아래와 같이 설정합니다.

**백엔드 인증 — 둘 중 하나 선택:**

- **(A) API Key 모드 (간단, 로컬 개발):** `GOOGLE_API_KEY`에 발급받은 Gemini API 키 입력.
- **(B) Vertex ADC 모드 (운영과 동일):** `GOOGLE_CLOUD_PROJECT` / `GOOGLE_CLOUD_LOCATION` 설정 후 `gcloud auth application-default login` 실행. `GOOGLE_API_KEY` 불필요.

**프록시 인증 (공통 필수):**

1. `API_KEY`: 로컬 백엔드 보호용 임의의 비밀번호
2. `CLOUDRUN_API_KEY`: 프론트가 백엔드 호출 시 사용할 비밀번호 (`API_KEY`와 같은 값)

### 2️⃣ 로컬 서버 2개 동시 실행

이 프로젝트는 프론트엔드(Next.js)와 백엔드 API(Node.js Express)가 분리되어 구동됩니다.
터미널을 2개 열어 각각 아래 명령어를 실행하세요.

**터미널 A (백엔드 API 서버 - Port 4000):**

```bash
npm run start:api
```

**터미널 B (프론트엔드 UI - Port 3000):**

```bash
npm run dev
```

이제 웹 브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 프롬프트가 적용된 GyoanMaker를 직접 사용해보세요!

### 3️⃣ 로컬 테스트 해보기 (Sample Test)

UI가 실행되면 좌측 패널 가이드에 따라 아래 테스트용 영어 지문을 입력하고 퀄리티를 확인해 보세요.

**테스트용 영어 지문 예시:**

> Some people argue that there is a single, logically consistent concept known as reading that can be neatly set apart from everything else people do with books. Is reading really that simple? The most productive way to think about reading is as a loosely related set of behaviors that belong together owing to family resemblances, as Ludwig Wittgenstein used the phrase, without having in common a single defining trait.

1. 프론트엔드 화면의 `Raw 텍스트 입력` 창에 위 지문을 복사해 넣습니다.
2. `[교안 데이터 파싱]` 버튼을 클릭합니다.
3. 백엔드로 데이터가 전송되며, Gemini 2.5 Pro 모델이 **완벽한 PDF 교안 레이아웃**으로 데이터를 렌더링하여 화면 중앙에 뿌려주는 것을 확인할 수 있습니다!

## 폴더 구조 (요약)

- `src/app/`: 기본 라우트, Route Groups는 필요 시 `(auth)`, `(dashboard)`로 구성
- `src/components/`: UI 컴포넌트 (`ui`, `layout`, `icons`, `dashboard`)
- `src/hooks/`
- `src/providers/`
- `src/services/`
- `src/stores/` (store 단수형 대신 복수형 사용)
- `src/types/`
- `src/utils/`
- `src/constants/`
- `src/middleware/` (폴더만 제공, 실제 미들웨어는 `src/middleware.ts` 필요)
- `public/images`: 정적 서빙 이미지 (기본은 빈 폴더)
- `public/illustrations`: 일러스트/정적 리소스 (기본은 빈 폴더)

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **State & Cache**: Zustand, TanStack Query (React Query)
- **PDF Export**: html2canvas, jsPDF
- **Styling**: Tailwind CSS 4
- **Code Quality**: ESLint, Prettier

## 사용 가능한 스크립트

- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드
- `npm run start` - 프로덕션 서버 실행
- `npm run lint` - ESLint 실행
- `npm run lint:fix` - ESLint 오류 자동 수정
- `npm run format` - Prettier로 코드 포맷팅
- `npm run format:check` - 코드 포맷 검사
- `npm run type-check` - TypeScript 타입 검사
- `node server/scripts/validate-output.js` - Topic/Summary 길이 규칙 검증(기본 fixture 3개)
- `node server/scripts/validate-vocab-count.js` - Core Vocabulary 형식 검증(항목 4개, 유의어 3개, 반의어 2개)

실제 `/generate` 응답(JSON 파일) 기준 검증도 가능합니다.

```bash
node server/scripts/validate-output.js /tmp/generate-output.json
```

Core Vocabulary 규칙(핵심어휘 4개 + 유의어/반의어 괄호 뜻 형식) 검증:

```bash
node server/scripts/validate-vocab-count.js handout.txt
node server/scripts/validate-vocab-count.js /tmp/generate-output.json
```

## 코드 품질

이 프로젝트는 코드 품질과 포맷팅을 위해 ESLint와 Prettier를 사용합니다.

### VS Code (권장)

VS Code를 사용하는 경우, 프로젝트에는 다음을 제공하는 권장 확장 프로그램과 설정이 포함되어 있습니다:

- 저장 시 자동 포맷팅
- 실시간 ESLint 오류 표시
- TypeScript IntelliSense 제공

### 수동 포맷팅

```bash
npm run format        # 모든 파일 포맷팅
npm run lint:fix      # 린트 오류 수정
```

## 환경 변수

| 변수                                      | 필수        | 설명                                         |
| ----------------------------------------- | ----------- | -------------------------------------------- |
| `API_KEY`                                 | ✅ (운영)   | 백엔드 보호용 키 (Cloud Run 설정)            |
| `ADMIN_KEY`                               | ✅ (운영)   | `/meta` 접근용 보안 키 (Cloud Run 설정)      |
| `API_KEYS`                                | 선택        | 다중 API 키 롤링용 목록(`,` 구분)            |
| `ADMIN_KEYS`                              | 선택        | 다중 Admin 키 롤링용 목록(`,` 구분)          |
| `CLOUDRUN_API_BASE_URL`                   | ✅ (Vercel) | Cloud Run 앱의 실제 URL (프록시용)           |
| `CLOUDRUN_API_KEY`                        | ✅ (Vercel) | 백엔드의 API_KEY와 동일한 값                 |
| `CLOUDRUN_API_TIMEOUT_MS`                 | 선택        | Proxy 타임아웃(ms), 미설정 시 기본 정책 사용 |
| `CORS_ALLOW_ORIGINS`                      | ✅ (운영)   | 허용 Origin 목록(`,` 구분)                   |
| `PROXY_RATE_LIMIT_MAX`                    | 선택        | Proxy `/api/generate` 분당 허용량            |
| `PROXY_RATE_LIMIT_WINDOW_MS`              | 선택        | Proxy rate limit 윈도우(ms)                  |
| `GENERATE_RATE_LIMIT_MAX`                 | 선택        | 백엔드 `/generate` 윈도우당 허용량           |
| `GENERATE_RATE_LIMIT_WINDOW_MS`           | 선택        | 백엔드 `/generate` rate limit 윈도우(ms)     |
| `META_RATE_LIMIT_MAX`                     | 선택        | 백엔드 `/meta` 윈도우당 허용량               |
| `META_RATE_LIMIT_WINDOW_MS`               | 선택        | 백엔드 `/meta` rate limit 윈도우(ms)         |
| `GOOGLE_CLOUD_PROJECT`                    | ✅ (운영)   | GCP 프로젝트 ID                              |
| `GOOGLE_CLOUD_LOCATION`                   | ✅ (운영)   | GCP 리전 (예: `asia-northeast3`)             |
| `SYSTEM_PROMPT_B64`                       | 선택        | 시스템 프롬프트 Base64 (긴급 override용)     |
| `ENABLE_REPAIR`                           | 선택        | 규칙 위반 시 1회 자동 재시도 (기본: `true`)  |
| `PROCESSING_MODE`                         | —           | `sequential` (기본) 또는 `parallel`          |
| `NEXT_PUBLIC_INITIAL_GENERATE_CHUNK_SIZE` | 선택        | 결과 페이지 청크 단위(기본 1)                |
| `NEXT_PUBLIC_APP_URL`                     | ✅          | 앱의 공개 호스트 URL                         |

### 우선순위

- **인증 방식**: `GOOGLE_CLOUD_PROJECT` 있으면 → Vertex AI ADC 모드 (Cloud Run 운영 권장) → 없으면 `GOOGLE_CLOUD_API_KEY` → `GOOGLE_API_KEY` (로컬 개발 fallback)
- **시스템 프롬프트**: `SYSTEM_PROMPT_B64` → `SYSTEM_PROMPT` → `server/system-prompt.txt` (기본값, 이 파일을 수정 후 push하면 자동 반영)

## 보안 아키텍처 (Vercel API Proxy)

비용 방어와 키 노출 방지를 위해 다음과 같은 구조를 사용합니다.

1. **브라우저**: `/api/generate` (Vercel 내장 주소)를 호출합니다.
2. **Vercel Server Side**: `CLOUDRUN_API_KEY`를 헤더에 붙여 Cloud Run에 요청을 전달(Proxy)합니다.
3. **Cloud Run**: `X-API-KEY`를 검증하여 일치할 때만 인스턴스를 실행합니다.

이 방식을 통해 브라우저 Network 탭에서 Cloud Run의 주소와 API Key가 일절 노출되지 않습니다.

### 운영 보안 정책 (권장)

1. **CORS Allowlist 강제**: `CORS_ALLOW_ORIGINS`에 허용 도메인만 명시하세요. `*`는 운영에서 금지합니다.
2. **키 롤링**: `API_KEYS`, `ADMIN_KEYS`를 사용해 신/구 키를 동시에 허용한 뒤 점진 교체하세요.
3. **로그 마스킹**: 키/토큰 원문을 절대 로그에 남기지 않고, `X-Request-ID` 기반으로 추적하세요.
4. **이중 Rate Limit**: Proxy와 Backend 둘 다 rate limit을 켜서 과도 호출을 차단하세요.

### Timeout 정책

- 기본값은 Proxy 기준 55초이며(`CLOUDRUN_API_TIMEOUT_MS` 미설정 시), 로컬 타겟(`localhost/127.0.0.1`)은 개발 편의를 위해 더 긴 timeout을 사용합니다.
- 운영 환경에서는 `CLOUDRUN_API_TIMEOUT_MS`를 명시해 환경별 편차를 제거하는 것을 권장합니다.

## 프롬프트 튜닝 워크플로우 (promptSource: file)

**현재 Cloud Run은 `promptSource: file` 방식으로 운영 중입니다.** 따라서 프롬프트를 수정할 때는 환경변수가 아닌 파일만 수정해야 합니다.

> 보안 권장: 실제 Cloud Run 배포 URL과 API 키는 저장소(README, 코드, 예시 파일)에 기록하지 말고 Cloud Run/Vercel 환경변수로만 관리하세요.

1. `server/system-prompt.txt` 파일을 직접 수정합니다.
2. `git add`, `git commit`, `git push`를 통해 저장소에 반영합니다.
3. 터미널에서 `gcloud run deploy --source .` 명령어로 재배포하면 즉시 반영됩니다.

**긴급 override:** 장애 등의 사유로 즉시 덮어써야 할 경우에만 Cloud Run 콘솔에서 `SYSTEM_PROMPT_B64` 환경변수를 강제 주입하세요. (설정 해제 시 다시 파일 모드로 복구됨)

## 서버 메타데이터 확인 (/meta)

서버의 현재 상태와 어떤 프롬프트를 사용 중인지 확인하려면 `/meta` 엔드포인트를 호출하세요. 보안을 위해 `X-ADMIN-KEY` 헤더가 필요합니다.

```bash
curl -H "X-ADMIN-KEY: YOUR_ADMIN_KEY" https://your-api-url/meta
```

반환값 예시:

```json
{
  "model": "gemini-2.5-pro",
  "location": "asia-northeast3",
  "promptSource": "file",
  "promptSha256": "84a3b8...",
  "promptHead": "# Role 당신은 대한민국 대치동 1타..."
}
```

### Base64 프롬프트 생성 (긴급용)

```bash
# macOS/Linux에서 줄바꿈 없는 1줄 Base64 생성
base64 -b 0 -i server/system-prompt.txt | pbcopy
```

## Cloud Run 배포

### 1. 빌드 & 배포

```bash
gcloud run deploy your-api-service-name \
  --source . \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=your-project-id" \
  --set-env-vars "GOOGLE_CLOUD_LOCATION=asia-northeast3" \
  --set-env-vars "API_KEY=your-secure-api-key" \
  --set-env-vars "ADMIN_KEY=your-secure-admin-key"
```

> ⚠️ **운영 환경에서 `GOOGLE_API_KEY`는 설정하지 않는 것을 권장합니다.** `GOOGLE_CLOUD_PROJECT`가 있으면 Vertex AI ADC(서비스 계정) 방식으로 자동 인증됩니다.

### 2. Cloud Run 콘솔에서 환경변수 설정

1. [Cloud Run 콘솔](https://console.cloud.google.com/run) 접속
2. `your-api-service-name` 서비스 선택
3. **수정 및 새 버전 배포** → **변수 및 보안 비밀** 탭
4. `SYSTEM_PROMPT_B64` 환경변수 추가

### 3. 서비스 계정 권한

```bash
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### 4. 배포 확인

```bash
curl "${CLOUDRUN_API_BASE_URL}/health"
# {"ok":true}
```
