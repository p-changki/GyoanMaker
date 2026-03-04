# 멀티유저 지원 아키텍처 구현 계획

## Context

현재 GyoanMaker는 단일 강사 중심으로 설계되어 있습니다:
- 교안 데이터가 sessionStorage에만 저장 (영구 저장 없음, 2시간 TTL)
- Rate limit이 IP 기반 (사용자별 제한 없음)
- Gemini API 사용량 추적 없음
- Firestore에 `users` 컬렉션만 존재

**목표**: 10~50명의 강사가 각자 교안을 저장/관리하고, Gemini API 사용량을 제한할 수 있는 멀티유저 시스템으로 전환.

---

## Firestore 스키마 확장

### `users/{email}` 확장 (기존 문서에 필드 추가)

```
users/{email}
  ├── (기존 필드 유지)
  ├── quota: {                    ← NEW
  │     dailyLimit: number        // 기본 50
  │     monthlyLimit: number      // 기본 500
  │   }
  └── usage: {                    ← NEW
        daily: { count: number, date: "YYYY-MM-DD" }
        monthly: { count: number, month: "YYYY-MM" }
      }
```

날짜 키가 현재 날짜와 다르면 자동 리셋 → cron job 불필요.

### `handouts/{auto-id}` 새 컬렉션

```
handouts/{auto-id}
  ├── ownerEmail: string
  ├── title: string               // 기본: "교안 {날짜}"
  ├── passageCount: number
  ├── passages: string[]          // 원본 입력 텍스트
  ├── generationMode: "basic" | "advanced"
  ├── createdAt: string (ISO)
  └── updatedAt: string (ISO)
```

### `handouts/{id}/sections/{P01..P20}` 서브컬렉션

```
sections/{P01}
  ├── passageId: string
  ├── inputText: string           // 원본 지문
  ├── rawText: string             // Gemini 출력 원문
  └── customTexts: {              // 인라인 편집 텍스트
        headerText?: string
        analysisTitleText?: string
        summaryTitleText?: string
      }
```

**서브컬렉션 사용 이유**: 20개 지문 × ~30KB = 최대 600KB → Firestore 1MB 제한 위험. 서브컬렉션이면 각 문서 독립.

**필요 인덱스**: `handouts` 컬렉션에 `ownerEmail ASC, createdAt DESC` 복합 인덱스.

---

## Phase 1: 쿼타 시스템 (비용 제어 기반)

### 새 파일

| 파일 | 설명 |
|------|------|
| `src/lib/quota.ts` | 쿼타 CRUD (check, increment, decrement, setLimits) — Firestore 트랜잭션 |
| `src/app/api/quota/route.ts` | `GET` — 현재 사용자의 쿼타 상태 반환 |
| `src/app/api/admin/users/[email]/quota/route.ts` | `GET/PATCH` — 관리자 쿼타 조회/수정 |
| `src/components/QuotaIndicator.tsx` | 남은 일일/월간 쿼타 표시 컴포넌트 |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/users.ts` | `AppUser` 인터페이스에 `quota`, `usage` 필드 추가; `findOrCreateUser()`에 기본 쿼타 초기화 |
| `src/app/api/generate/route.ts` | 세션에서 사용자 이메일 추출 → 쿼타 체크 → 통과 시 프록시 → 실패 시 롤백 |
| `src/app/generate/page.tsx` | `QuotaIndicator` 추가 (생성 버튼 근처) |
| `src/app/admin/page.tsx` | 쿼타 탭 추가 (사용자별 사용량 조회/수정) |

### 쿼타 적용 흐름

```
POST /api/generate
  1. auth() → 세션에서 email 추출
  2. checkAndIncrementQuota(email, passageCount)
     - Firestore 트랜잭션으로 원자적 증가
     - 날짜 키 불일치 시 카운터 리셋
     - 초과 시 429 반환
  3. 통과 → Cloud Run 프록시 (기존 로직)
  4. Cloud Run 실패 → decrementUsage() 롤백
```

---

## Phase 2: 교안 영구 저장 (핵심 기능)

### 새 파일

| 파일 | 설명 |
|------|------|
| `src/lib/handouts.ts` | 교안 CRUD (create, get, list, update, delete) — 소유권 검증 포함 |
| `src/app/api/handouts/route.ts` | `POST` (저장) + `GET` (목록 조회) |
| `src/app/api/handouts/[id]/route.ts` | `GET` (상세) + `PATCH` (수정) + `DELETE` (삭제) |
| `src/components/SaveHandoutButton.tsx` | 저장 버튼 + 제목 입력 모달 |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/results/page.tsx` | 생성 완료 후 "교안 저장" 버튼 추가 |
| `src/app/compile/page.tsx` | "교안 저장" 버튼 추가; `?handoutId=xxx` 쿼리 파라미터로 Firestore에서 불러오기 지원 |

### 저장 흐름

```
results/page.tsx (생성 완료)
  → "교안 저장" 클릭 → 제목 입력 모달
  → POST /api/handouts { title, passages, sections, generationMode }
  → Firestore: handouts/{id} + sections 서브컬렉션 생성
  → 성공 시 handoutId 반환
```

### 불러오기 흐름

```
dashboard에서 교안 클릭
  → /compile?handoutId=xxx 이동
  → compile/page.tsx에서 handoutId 감지
  → GET /api/handouts/{id} → sections 로드
  → Zustand 스토어에 주입 (기존 sessionStorage 플로우와 동일)
```

**핵심**: 기존 sessionStorage 플로우는 그대로 유지. Firestore 저장은 **선택적** 액션.

---

## Phase 3: 내 교안 대시보드

### 새 파일

| 파일 | 설명 |
|------|------|
| `src/app/dashboard/page.tsx` | 내 교안 목록 페이지 |
| `src/components/dashboard/HandoutCard.tsx` | 개별 교안 카드 |
| `src/components/dashboard/HandoutList.tsx` | 교안 목록 컨테이너 + 빈 상태 UI |

### 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/layout/Header.tsx` | "내 교안" 네비게이션 링크 추가 (`/dashboard`) |

### 대시보드 UI

```
/dashboard
  ├── 상단: "내 교안" 제목 + 교안 수
  └── 카드 그리드 (2열)
       ├── HandoutCard: 제목, 생성일, 지문 수
       │   ├── "열기" → /compile?handoutId=xxx
       │   └── "삭제" → DELETE /api/handouts/{id}
       └── 빈 상태: "아직 저장된 교안이 없습니다"
```

---

## Phase 4: 마무리 (선택)

1. 생성 페이지에서 쿼타 사전 체크 (초과 시 버튼 비활성화)
2. compile 페이지에서 교안 자동 저장 옵션 (디바운스)
3. 대시보드에서 교안 제목 수정 / "복제" 기능

---

## 아키텍처 결정 사항

| 결정 | 이유 |
|------|------|
| Cloud Run 백엔드 변경 없음 | 모든 멀티유저 로직은 Next.js 레이어에서 처리 |
| Optimistic 쿼타 증가 | 프록시 호출 전에 증가, 실패 시 롤백 (Firestore 트랜잭션) |
| sessionStorage 유지 | 기존 플로우 보존, "저장"은 선택적 액션 |
| 날짜 기반 쿼타 리셋 | `"YYYY-MM-DD"` / `"YYYY-MM"` 키 비교로 자동 리셋 (cron 불필요) |
| 서브컬렉션 for sections | 1MB 문서 제한 회피, 목록 조회 시 section 데이터 미로드 |

---

## 검증 방법

1. `npm run build` — 빌드 성공 확인
2. 수동 테스트:
   - 새 사용자 로그인 → 기본 쿼타 할당 확인
   - 교안 생성 → 쿼타 카운터 증가 확인
   - 쿼타 초과 시 → 429 응답 + UI 안내 확인
   - "교안 저장" → Firestore에 문서 생성 확인
   - "내 교안" 대시보드 → 저장된 교안 목록 표시
   - 교안 열기 → compile 페이지에서 정상 로드
   - 교안 삭제 → Firestore에서 문서 + 서브컬렉션 삭제
   - 관리자 페이지 → 쿼타 조회/수정 작동
