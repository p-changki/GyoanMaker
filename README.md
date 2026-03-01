이 프로젝트는 프런트 표준 템플릿 Lite(Next.js App Router) 기반입니다.

## 이 템플릿은?

**개인 개발자를 위한 경량 Next.js 템플릿**

### 언제 사용?

- 혼자 토이 프로젝트
- 빠른 프로토타입
- 학습/실험
- 해커톤

### 언제 사용 안 함?

- 2명 이상 협업 → Full 템플릿 사용
- 프로덕션 배포 → Full 템플릿 사용
- 테스트 필요 → Full 템플릿 사용

[Full 템플릿 보기](../frontend-standard-template)

## 시작하기

### 필수 요구사항

- Node.js 20.9 이상
- npm(기본) 또는 pnpm(선택)

### 설치 방법

1. 저장소를 클론하고 의존성을 설치합니다:

```bash
# npm
npm ci
# pnpm (선택 시)
pnpm install --frozen-lockfile
```

2. 환경 변수를 설정합니다:

```bash
cp .env.example .env.local
# .env.local 파일을 열어 실제 값을 입력하세요
# ⚠️ .env.local은 Git에 커밋되지 않습니다 (보안)
```

3. 개발 서버를 실행합니다:

```bash
npm run dev
# pnpm 프로젝트라면
pnpm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

기본 제공 파일은 `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` 3개뿐입니다.
필요한 라우트/컴포넌트는 프로젝트에서 직접 생성하세요.

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

- **Framework**: Next.js 16.1.1
- **Language**: TypeScript 5
- **UI Library**: React 19.2.3
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

| 변수                    | 필수        | 설명                                     |
| ----------------------- | ----------- | ---------------------------------------- |
| `API_KEY`               | ✅ (운영)   | 백엔드 보호용 키 (Cloud Run 설정)        |
| `ADMIN_KEY`             | ✅ (운영)   | `/meta` 접근용 보안 키 (Cloud Run 설정)  |
| `CLOUDRUN_API_BASE_URL` | ✅ (Vercel) | Cloud Run 앱의 실제 URL (프록시용)       |
| `CLOUDRUN_API_KEY`      | ✅ (Vercel) | 백엔드의 API_KEY와 동일한 값             |
| `GOOGLE_CLOUD_PROJECT`  | ✅ (운영)   | GCP 프로젝트 ID                          |
| `GOOGLE_CLOUD_LOCATION` | ✅ (운영)   | GCP 리전 (예: `asia-northeast3`)         |
| `SYSTEM_PROMPT_B64`     | 선택        | 시스템 프롬프트 Base64 (긴급 override용) |
| `PROCESSING_MODE`       | —           | `sequential` (기본) 또는 `parallel`      |
| `NEXT_PUBLIC_APP_URL`   | ✅          | 앱의 공개 호스트 URL                     |

### 우선순위

- **API Key**: `GOOGLE_CLOUD_API_KEY` → `GOOGLE_API_KEY` → (없으면 Vertex AI ADC 모드)
- **시스템 프롬프트**: `SYSTEM_PROMPT_B64` → `SYSTEM_PROMPT` → `server/system-prompt.txt` (기본값)

## 보안 아키텍처 (Vercel API Proxy)

비용 방어와 키 노출 방지를 위해 다음과 같은 구조를 사용합니다.

1. **브라우저**: `/api/generate` (Vercel 내장 주소)를 호출합니다.
2. **Vercel Server Side**: `CLOUDRUN_API_KEY`를 헤더에 붙여 Cloud Run에 요청을 전달(Proxy)합니다.
3. **Cloud Run**: `X-API-KEY`를 검증하여 일치할 때만 인스턴스를 실행합니다.

이 방식을 통해 브라우저 Network 탭에서 Cloud Run의 주소와 API Key가 일절 노출되지 않습니다.

## 프롬프트 튜닝 워크플로우

가장 권장되는 프롬프트 수정 방법은 파일을 직접 수정하는 것입니다.

1. `server/system-prompt.txt` 파일을 수정합니다.
2. `git add`, `git commit`, `git push`를 통해 저장소에 반영합니다.
3. Cloud Run의 자동 빌드/배포가 완료되면 즉시 반영됩니다.

**긴급 시 환경변수 Override**: 코드를 수정하지 않고 즉시 프롬프트를 변경해야 할 경우에만 `SYSTEM_PROMPT_B64` 또는 `SYSTEM_PROMPT` 환경변수를 사용하세요. 이 변수들이 설정되어 있으면 파일 내용보다 우선적으로 적용됩니다.

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
gcloud run deploy gyoanmaker-api \
  --source . \
  --region asia-northeast3 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=your-project-id" \
  --set-env-vars "GOOGLE_CLOUD_LOCATION=asia-northeast3" \
  --set-env-vars "API_KEY=your-secure-api-key" \
  --set-env-vars "ADMIN_KEY=your-secure-admin-key"
```

### 2. Cloud Run 콘솔에서 환경변수 설정

1. [Cloud Run 콘솔](https://console.cloud.google.com/run) 접속
2. `gyoanmaker-api` 서비스 선택
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
curl https://gyoanmaker-api-XXXXX-an.a.run.app/health
# {"ok":true}
```
