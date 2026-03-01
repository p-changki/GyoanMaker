# GyoanMaker 프론트엔드(UI) 구현 타당성 평가 + 실행 계획 (Next.js App Router)

## 1) 타당성 결론 (Feasibility Verdict)

**Verdict: YES**

- 이 레포는 이미 Next.js App Router + TS + Tailwind v4 스택(`package.json`)을 갖춘 경량 템플릿이며, 요구된 3개 페이지(`/`, `/results`, `/preview`)는 **mock data만으로 충분히 구현 가능**합니다.
- 리스크/주의점은 존재합니다.
  - Tailwind v4가 의존성으로 존재하지만 `src/app/globals.css`에 Tailwind import가 없어(현재 상태) 스타일이 의도대로 적용되지 않을 수 있음 → **초기 단계에서 정리 필요**.
  - `PDF 다운로드`는 MVP에서는 브라우저 인쇄(`window.print()`) 기반이 가장 현실적(의존성 추가 없이 가능). “파일 자동 저장” 수준의 UX는 다음 이터레이션(라이브러리 추가) 권장.
  - shadcn/ui, lucide-react 미설치 → **MVP는 Tailwind 기반 자체 컴포넌트로 구현**, 다음 이터레이션에서 shadcn으로 치환 가능.

## 2) 레포 현실 대비 갭 분석 (Gap Analysis)

### 현재 레포 상태 (확인)

- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`만 존재
- `tailwindcss@^4`, `@tailwindcss/postcss@^4` 설치됨 (`package.json`, `postcss.config.mjs`)
- `tailwind.config.js`는 존재하나(legacy 형태), 전역 스타일에 Tailwind import가 없음 (`src/app/globals.css`)
- `src/components/*` 폴더는 있으나 비어 있음 (`src/components/ui`, `src/components/layout` 등)
- `src/lib` 폴더는 없음
- shadcn/ui + lucide-react 미설치
- `ui-생성-프롬프트.md` 파일은 레포에서 확인되지 않음(다만 본 문서의 요구사항을 소스 오브 트루스로 사용)

### 요구 UI 대비 부족한 것

- 라우트: `src/app/results/page.tsx`, `src/app/preview/page.tsx` 없음
- 공통 컴포넌트: 입력/결과/미리보기 구성요소(카드, 액션바, 복사 버튼, 모달 등) 전무
- 공통 로직: 타입/목데이터/텍스트 포맷터/클립보드 로직 전무
- 스타일 토큰: 요구 팔레트 기반 토큰/배경/텍스트/카드 톤 설정 전무
- PDF: 프린트 스타일(`@media print`) 및 A4 프리뷰 레이아웃 전무

## 3) 구현 범위 선언 (MVP Now vs Next Iterations)

### MVP Now (이번 실행 플랜에 포함)

- `/` 입력 페이지: 텍스트 블록 모드 + 카드 모드 + 옵션 + CTA(교안 생성하기) + 세션 저장 + `/results`로 이동
- `/results` 결과 페이지: sticky 액션바(뒤로/프로그레스/전체복사/PDF 버튼 조건부) + 결과 카드 렌더링 + 상태(generating/completed/failed) + 복사 UX(텍스트 only, HWP-safe 심볼, 1.5s 피드백) + JSON 보기(간단 모달/드로어) + 재생성
- `/preview` 미리보기: A4 비율 프리뷰 + passage별 page-break + PDF 다운로드(브라우저 print 기반) + 네비게이션
- Tailwind 토큰/팔레트 적용 + 카드 호버/그림자 트랜지션 + 반응형(데스크탑 우선)
- mock 결과: 최소 P01-P03 (요구 스키마 형태)

### Next Iterations (명확히 분리)

- shadcn/ui 설치/도입 및 컴포넌트 치환(`Dialog`, `Tabs`, `Tooltip`, `Progress` 등)
- lucide-react 아이콘 도입(복사/JSON/재생성 아이콘)
- “파일 자동 저장” 수준의 PDF 내보내기(예: `react-pdf/renderer` 등) 및 프린트 UX 개선
- DOCX 생성 실제 구현(coming soon → 동작)
- advanced RAG 실제 구현(coming soon → 동작)
- 테스트 인프라(Playwright/Vitest 등) 도입 및 회귀 테스트 자동화

## 4) 기술/설계 선택 (즉시 실행 가능한 실용안)

- 라우팅/구조: App Router 고정
  - `src/app/page.tsx`, `src/app/results/page.tsx`, `src/app/preview/page.tsx`
- 상태: 외부 상태 라이브러리 없이 `useState`/`useReducer`만
- 데이터 전달: 페이지 간 데이터는 **sessionStorage** 기반(대용량 textarea를 query string으로 넘기지 않기 위함)
- 결과 생성: mock 생성기(타이머)로 progress/스켈레톤/실패 케이스까지 시뮬레이션
- 복사 포맷: `src/lib/formatText.ts`에서 “복사용 순수 텍스트”를 단일 책임으로 생성
- PDF: MVP는 `/preview`에서 `window.print()` 트리거 + `@media print`로 A4 페이지 분리

## 5) 리스크 목록 + 대응 (Risks & Mitigations)

1. Tailwind v4 적용 불일치(전역 import 누락)

- 위험: UI가 무스타일로 보이거나 일부 유틸만 적용
- 대응: 가장 먼저 `src/app/globals.css`에 Tailwind import + 토큰 정의 정리(Phase 0)

2. 클립보드 제약(iOS/Safari 등)

- 위험: `navigator.clipboard.writeText`가 사용자 제스처 밖에서 실패
- 대응: 복사 함수는 onClick 핸들러 내부에서 즉시 실행, 실패 시 fallback 안내(예: 모달에 텍스트 노출)

3. “pure text only + HWP-safe 심볼” 요건 누락/일관성 붕괴

- 위험: 섹션별 복사/전체복사/프리뷰 출력이 서로 다른 포맷으로 흩어짐
- 대응: 포맷은 `formatText.ts`로 중앙집중(단일 소스), 모든 copy 버튼은 해당 함수만 호출

4. 모드 토글 시 입력 손실

- 위험: 텍스트↔카드 전환 시 공백/줄바꿈/구분선 처리에서 손실 발생
- 대응: “최대한 보존”을 목표로 변환 규칙을 명시하고, 전환 시 경고/미리보기(필요 시)로 리스크 노출

5. 프린트/PDF 페이지 분리 브라우저 편차

- 위험: Chrome/Edge/Safari에서 page-break가 다르게 동작
- 대응: 프린트 CSS에서 `break-after: page; break-inside: avoid;` 등 최소 규칙 적용, A4 고정폭(또는 비율) 구성

## 6) 빠른 MVP 우선 실행 순서 (Fastest MVP First)

1. Tailwind 토큰/베이스 레이아웃 정리 → 화면이 “프리미엄 톤”으로 보이게
2. `/` 텍스트 블록 모드 + 옵션 + `/results` 이동(세션 저장)
3. `/results` 스켈레톤/프로그레스 + mock 결과 카드 렌더
4. “전체 복사 / 카드 복사 / 섹션 복사” (HWP-safe 순수 텍스트) 확정
5. `/preview` A4 프리뷰 + `window.print()` 기반 PDF 다운로드
6. 카드 모드 입력 + 모드 토글 보존 로직 고도화
7. 실패 상태/재시도/재생성/JSON 모달 UX 마감

## 7) 단계별 실행 계획 (Atomic Tasks, Owner-level)

> 작업 단위 원칙: 1 태스크 = 1~3개 파일 중심(작고 검증 가능). 각 태스크는 “완료 조건(AC)”과 “검증 방법”을 포함.

### Phase 0 — 스타일/토큰/앱 셸 (기초)

- T0-1 (Owner: FE-UI) Tailwind v4 전역 적용 + 디자인 토큰 정의
  - 대상 파일: `src/app/globals.css`, `tailwind.config.js`
  - 내용: Tailwind import 추가, 팔레트 토큰(요구 hex) 적용, 기본 배경/타이포/링/카드 그림자 톤 설정
  - AC:
    - `src/app/page.tsx`의 Tailwind 클래스가 실제로 적용되어 화면이 스타일링됨
    - 배경이 `#f8f9fc` 계열, 텍스트가 `#1e293b` 계열로 일관되게 표시

- T0-2 (Owner: FE-UI) 루트 레이아웃 최소 앱 셸
  - 대상 파일: `src/app/layout.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/AppShell.tsx`
  - 내용: lang을 `ko`, 공통 header(제품명/서브타이틀/간단 네비) 및 컨테이너 폭(콘텐츠 max-width) 확립
  - AC:
    - 모든 페이지에서 동일한 상단 헤더/여백/배경 톤 유지

### Phase 1 — 타입/목데이터/포맷터 (로직 기반)

- T1-1 (Owner: FE-Logic) 결과 스키마 타입 정의
  - 대상 파일: `src/lib/types.ts`
  - 내용: Passage, Options, ResultStatus, PassageResult(문장분석/주제문/요약/흐름4/core vocab) 타입 정의
  - AC:
    - `/results`에서 카드 렌더링에 필요한 필드가 타입으로 강제됨

- T1-2 (Owner: FE-Logic) mock 결과 데이터(P01-P03)
  - 대상 파일: `src/lib/mockData.ts`, `src/lib/types.ts`
  - 내용: 최소 P01-P03에 대해 요구 섹션이 채워진 예시 데이터 제공
  - AC:
    - `/results`에서 최소 3개 카드가 “completed” 상태로 렌더 가능

- T1-3 (Owner: FE-Logic) 복사용 순수 텍스트 포맷터
  - 대상 파일: `src/lib/formatText.ts`, `src/lib/types.ts`
  - 내용: HWP-safe 심볼(`【】`, `▸`, `→`) 기반으로
    - (a) 섹션 단위 텍스트
    - (b) 카드 전체 텍스트
    - (c) 전체 결과 묶음 텍스트
    - (d) 프리뷰용 텍스트
      를 생성하는 함수 제공(절대 markdown/html 생성 금지)
  - AC:
    - 어떤 복사 버튼을 눌러도 clipboard에 들어가는 문자열에 `<`, `#`, `*` 같은 마크다운 패턴이 없음

### Phase 2 — 공통 컴포넌트 (shadcn 없이 MVP)

- T2-1 (Owner: FE-UI) 최소 UI 프리미티브(Button/Card/Badge/Progress)
  - 대상 파일: `src/components/ui/Button.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Badge.tsx`, `src/components/ui/Progress.tsx`
  - 내용: shadcn “개념”을 따라가되, Tailwind 기반의 얇은 wrapper로 구성(variant/size 정도만)
  - AC:
    - 페이지 코드에서 반복되는 클래스가 줄고, 버튼/카드 톤이 일관됨

- T2-2 (Owner: FE-Logic) CopyButton (1.5s 피드백 포함)
  - 대상 파일: `src/components/CopyButton.tsx`
  - 내용: `navigator.clipboard.writeText` 기반, 성공/실패 상태, 1.5s “복사됨” 피드백(텍스트/배지)
  - AC:
    - 연속 클릭 시에도 피드백이 정확히 동작(중복 타이머 정리)

- T2-3 (Owner: FE-UI) JsonModal (MVP: 간단 오버레이)
  - 대상 파일: `src/components/JsonModal.tsx`
  - 내용: 결과 JSON을 보기 좋게(모노스페이스) 보여주고 닫기 가능
  - AC:
    - `/results` 카드에서 JSON 보기 버튼으로 열리고 Esc/배경 클릭으로 닫힘(최소 1개 지원)

### Phase 3 — `/` 입력 페이지 구현

- T3-1 (Owner: FE-Logic) 입력 파싱/변환 유틸
  - 대상 파일: `src/lib/parsePassages.ts` (또는 `src/lib/formatText.ts`와 분리), `src/lib/types.ts`
  - 내용:
    - 텍스트 블록 모드: `---` 구분자 파싱, 실시간 count, 최대 20 강제
    - 카드 모드: add/remove, P01.. 라벨, 최대 20 강제
    - 모드 토글 시 변환(가능한 입력 보존)
  - AC:
    - 텍스트 `a\n---\nb` 입력 시 passage 2개로 감지
    - 21개 입력 시 UI에서 제한/경고가 보이고 CTA는 동작 정책에 맞게 처리됨

- T3-2 (Owner: FE-UI) 입력 컴포넌트 구성
  - 대상 파일: `src/components/PassageInput.tsx`, `src/components/PassageCard.tsx`
  - 내용: 모드 토글, textarea, 카드 리스트(추가/삭제), 카운트 표시 UI
  - AC:
    - 모드 전환해도 기존 내용이 가능한 한 유지됨(최소: 내용이 완전히 사라지지 않음)

- T3-3 (Owner: FE-UI) 옵션/CTA + sessionStorage 저장 + 라우팅
  - 대상 파일: `src/app/page.tsx`, `src/lib/types.ts`
  - 내용:
    - 옵션: copy block(기본 체크), PDF 다운로드(토글), DOCX 비활성(coming soon), basic 기본, advanced RAG 비활성(coming soon)
    - CTA: `교안 생성하기` (passage 0이면 disabled)
    - 클릭 시 입력/옵션을 sessionStorage에 저장하고 `/results` 이동
  - AC:
    - passage 0개면 CTA disabled
    - passage 1개 이상이면 `/results`로 이동하며 결과 페이지가 입력을 복원

### Phase 4 — `/results` 결과 페이지 구현

- T4-1 (Owner: FE-Logic) mock 생성 흐름(프로그레스/상태)
  - 대상 파일: `src/app/results/page.tsx`, `src/lib/mockData.ts`, `src/lib/types.ts`
  - 내용:
    - 로딩 시작 시 각 passage의 상태를 generating으로 두고 스켈레톤 렌더
    - P01-P03은 mock 결과로 completed
    - 일부 케이스는 failed 시뮬레이션(재시도 강조)
    - 상단 progress text+bar
  - AC:
    - generating → completed/failed 전환이 시각적으로 명확
    - progress bar가 0→100으로 증가

- T4-2 (Owner: FE-UI) sticky ActionBar
  - 대상 파일: `src/components/ActionBar.tsx`, `src/components/ProgressBar.tsx`, `src/app/results/page.tsx`
  - 내용: back 버튼, progress 표시, `전체 복사`, (옵션 선택 시) `PDF 다운로드` 표시
  - AC:
    - 스크롤해도 액션바가 상단에 유지
    - PDF 버튼은 “PDF 옵션 ON”일 때만 노출

- T4-3 (Owner: FE-UI) ResultCard (섹션 렌더 + 상태 배지)
  - 대상 파일: `src/components/ResultCard.tsx`, `src/lib/types.ts`
  - 내용:
    - 섹션: 문장 분석, 주제문, 요약, 흐름\_4, 핵심 어휘(core vocab)
    - 상태 UI: generating(스켈레톤+스피너), completed(초록 배지), failed(빨간 보더+retry 강조)
  - AC:
    - completed/failed/generating이 카드 단위로 확실히 구분됨

- T4-4 (Owner: FE-Logic) 복사 동작(전체/카드/섹션) 일관화
  - 대상 파일: `src/components/ResultCard.tsx`, `src/components/CopyButton.tsx`, `src/lib/formatText.ts`
  - 내용:
    - 전체 복사: 전체 passage 결과를 1개 텍스트로
    - 카드 전체복사: 해당 passage 1개 텍스트
    - 섹션 복사: 해당 섹션만
    - 모두 “순수 텍스트만” 복사
  - AC:
    - 복사 결과가 HWP에 붙여넣어도 깨지지 않는 기호/줄바꿈 구성
    - 1.5초 피드백 표시

- T4-5 (Owner: FE-UI) JSON 보기 + 재생성 UI
  - 대상 파일: `src/components/JsonModal.tsx`, `src/components/ResultCard.tsx`, `src/app/results/page.tsx`
  - 내용:
    - JSON 보기: 카드 단위 raw JSON 표시
    - 재생성: 해당 카드 generating으로 되돌린 뒤 mock로 다시 completed 처리
  - AC:
    - JSON 모달이 카드 별로 열리고, 재생성 클릭 시 상태가 변경됨

### Phase 5 — `/preview` 프린트형 미리보기 + PDF

- T5-1 (Owner: FE-UI) A4 비율 프리뷰 컴포넌트
  - 대상 파일: `src/components/PreviewPage.tsx`, `src/app/preview/page.tsx`
  - 내용: passage별 A4 페이지, 가운데 정렬, page-break, 상단 back/PDF
  - AC:
    - passage 개수만큼 페이지가 분리되어 보임

- T5-2 (Owner: FE-Logic) 프리뷰 텍스트는 copy block 포맷과 동일
  - 대상 파일: `src/app/preview/page.tsx`, `src/lib/formatText.ts`
  - 내용: 프리뷰 출력 문자열은 전체 복사 포맷과 동일 규칙 사용
  - AC:
    - “전체 복사” 결과와 프리뷰 본문이 동일한 구조(헤더/섹션 순서/기호)를 가짐

- T5-3 (Owner: FE-UI) 인쇄 CSS
  - 대상 파일: `src/app/globals.css`
  - 내용: `@media print`에서 헤더/버튼 숨김, 페이지 여백/분리 설정
  - AC:
    - `window.print()` 시 각 passage가 새 페이지로 분리되어 출력 미리보기에 보임

## 8) 수용 기준 체크리스트 (Acceptance Checklist → 기능 매핑)

### `/` 입력 페이지

- [x] 텍스트 블록 모드: textarea 1개, `---`로 분리, 실시간 passage 카운트(최대 20)
- [x] 카드 모드: add/remove, P01/P02 라벨, 최대 20
- [x] 모드 토글 시 입력이 최대한 보존됨(최소: 내용 소실 없음)
- [x] 옵션 UI: copy block 기본 체크, PDF 다운로드 옵션, DOCX disabled+coming soon, basic 기본, advanced RAG disabled+coming soon
- [x] CTA `교안 생성하기`: passage 0이면 disabled, 1+이면 `/results`로 이동

### `/results` 결과 페이지

- [x] sticky action bar: back, progress text+bar, 전체 복사, 조건부 PDF 다운로드
- [x] 결과 카드 리스트: 중앙 정렬, max width ~800
- [x] 카드 섹션: 문장 분석/주제문/요약/흐름\_4/핵심 어휘
- [x] 상태: generating(스켈레톤+스피너), completed(초록 배지), failed(빨간 보더+재시도 강조)
- [x] 복사 UX(핵심): 순수 텍스트만, HWP-safe 기호(`【】`, `▸`, `→`), 1.5초 copied 피드백
- [x] 카드 기능: 카드 전체복사, 섹션별 복사, JSON 보기(모달/드로어), 재생성

### `/preview` 미리보기

- [x] A4 비율 프리뷰, passage별 page-break
- [x] back 버튼, PDF 다운로드
- [x] 텍스트 포맷은 copy block 규칙과 동일

### 스타일/UX

- [x] 라이트 모드, 프리미엄 교육 도구 톤
- [x] 지정 팔레트 토큰 적용
- [x] 카드 hover shadow transition ~0.2s ease
- [x] 반응형: desktop > tablet > mobile (데스크탑에서 가장 완성도 높음)

## 9) 검증 방법(현 레포 기준)

- 개발 서버 실행: `npm run dev`
- 정적 점검: `npm run lint`, `npm run type-check`
- 기능 QA(수동/에이전트 실행 가능):
  - `/`에서 2 passage 입력 → CTA 클릭 → `/results`에서 2 cards 노출
  - `전체 복사` 클릭 → 메모장에 붙여넣기 시 마크다운/HTML 없이 순수 텍스트
  - PDF 옵션 ON 후 `/results`에서 PDF 버튼 노출 → `/preview`에서 `PDF 다운로드` 클릭 → print dialog

## 10) 참고 링크 (차후 이터레이션용)

- shadcn/ui Next.js 설치: https://ui.shadcn.com/docs/installation/nextjs
- Clipboard API(MDN): https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API
- Tailwind v4 문서(버전별 차이 확인 필요): https://tailwindcss.com/docs
