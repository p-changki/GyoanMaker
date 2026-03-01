# Draft: Vertex AI Gemini Express Backend (/generate)

## Requirements (confirmed)

- Repo: `/Users/changkipark/Desktop/GyoanMaker` (Next.js frontend-oriented)
- Backend stack: Node.js + Express
- Endpoint: `POST /generate`
- Request JSON: `{ passages: string[] }` (max 20)
- Response JSON: `{ results: { index: number, outputText: string }[] }`
- Model: `gemini-3.1-pro-preview`
- SDK baseline: `@google/genai`
  - Client: `GoogleGenAI({ apiKey: process.env.GOOGLE_CLOUD_API_KEY })`
- `systemInstruction`: server-side constant (placeholder now; final text later)
- CORS: `*` (for now)
- Processing: sequential first; extendable to bounded parallel (limit 3~5)
- Local run target (backend): `npm i`, `node server.js`
- Deliverables (proposed): `server.js`, `package.json` deps/scripts updates, `.env.example` placeholder, `Dockerfile`, optional helper module(s)

## Constraints

- Planning only (no coding yet).
- Do not assume final system prompt content.
- No unrelated architecture (DB/auth/queue) beyond brief future note.
- Security: env var only, no hardcoding, input validation.

## Repo Findings

- Runtime: Node 20.9.0 (`.nvmrc`), root `package.json` has `engines.node >=20.9`.
- Package manager: npm (root `package-lock.json`, lockfileVersion 3).
- Module system: root `package.json` has no `"type": "module"`.
- No existing backend entry: no root `server.js`, no Express usage.
- Current app behavior: generation is mock-driven (`src/lib/mockData.ts`), not calling a backend.
- Env: `.env.example` exists and is committed; `.env.local` exists; `.gitignore` ignores `.env*` except `.env.example`.
- Infra: no `Dockerfile`, no `.github/workflows/*` in root.
- Reference-only API examples exist under `references/**` (excluded by `tsconfig.json`).

## Technical Decisions (proposed defaults)

- Entry point: root `server.js` to satisfy `node server.js`.
- Helper placement: optional `server/` directory for generator pipeline + concurrency strategy modules.
- Port: `process.env.PORT || 4000` (Cloud Run sets `PORT=8080`).
- Failure semantics: all-or-nothing (if any passage fails, request fails) because response schema has no per-item error.
- Error shape: `{ error: { code: string, message: string, details?: any } }` with sanitized `details` (dev-only).

## Research Findings / Risks

- Biggest risk: "Vertex AI" vs "API-key" auth mismatch. Baseline `GoogleGenAI({ apiKey })` may align with Gemini Developer API; true Vertex AI usually uses IAM/ADC and service accounts.
- Guardrails flagged: do not flip repo-wide `"type":"module"`; enforce JSON body size limits; sanitize logs/errors; recommend `.dockerignore` even if optional.

## Open Questions

- Port policy: default `PORT` (Cloud Run expects 8080). For local, choose 4000? (README suggests `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`).
- Error response shape: choose a stable `{ error: { message, code, details? } }`?
- Failure policy for per-passage errors: fail whole request vs partial results (response schema has no per-item error field).

## Scope Boundaries

- INCLUDE: Express API server + `/generate` endpoint, validation, sequential processing, concurrency-ready structure, CORS, env, Dockerfile, Cloud Run readiness checklist.
- EXCLUDE: DB, auth, queue, background jobs, streaming responses, advanced observability (beyond basic logging recommendations).
