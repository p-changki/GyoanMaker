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

## 환경 변수 관리

### 설정 방법

1. `.env.example` 파일을 `.env.local`로 복사합니다:

```bash
cp .env.example .env.local
```

2. `.env.local` 파일을 열어 실제 값을 입력합니다.

3. ⚠️ **중요**: `.env.local`은 Git에 커밋되지 않습니다 (보안).

### 환경 변수 규칙

- **공개 변수** (브라우저에서 접근 가능): `NEXT_PUBLIC_` 접두사 사용
- **비공개 변수** (서버에서만 접근 가능): 접두사 없음

### 프런트엔드 최소 환경 변수 예시

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### 파일 우선순위 (Frontend 기준)

이 프런트엔드 레포에서는 로컬 개발 시 `.env.local`만 사용합니다.

- `.env.local` (로컬 개발용, Git에 커밋되지 않음)

배포 환경(AWS 등)에서는 플랫폼의 환경 변수 설정을 사용합니다.

## 배포 개요 (AWS)

이 프로젝트는 Vercel이 아닌 AWS 환경에 배포합니다.
• Frontend (Next.js): AWS에 배포 (SSR/Node 런타임 필요)
• Backend (Express): 별도 저장소/서비스로 AWS에 배포
• 통신 방식: Front → Back API 호출 (도메인/환경변수로 분리)
