# REST API Plan

## 1. Resources
- generation_sessions → DB table: generation_sessions
- flashcards → DB table: flashcards
- auth (login/register/logout/password) → Supabase Auth (managed by Supabase; referenced here for API surface integration)
- study → derived, not a table; uses flashcards ordering and updates last_reviewed_at

## 2. Endpoints

### 2.2 AI Generation

- Method: POST
  - Path: /ai/generate
  - Description: Generate up to 20 flashcard proposals from source text using OpenRouter models. Create a generation session row for telemetry and auditing. Proposals are NOT persisted; only metrics and hash are saved.
  - Query Params: none
  - Request JSON:
    {
      "source_text": string (100–10000 chars),
      "language": "pl" | "en" | null,
      "max_proposals": number (1–20, default 20)
    }
  - Response JSON:
    {
      "generation_session": {
        "id": uuid,
        "proposals_count": number,
        "source_text_length": number,
        "created_at": string
      },
      "proposals": [
        { "front_text": string (<=1000), "back_text": string (<=1000) }, ... up to N
      ]
    }
  - Success: 200 OK
  - Errors: 400 Text length out of range; 429 Rate limit; 500 Model error

Validation/business rules:
- Validate source_text length (100–10000).
- max_proposals capped at 20.
- Compute source_text_hash (SHA-256 hex) and save with session.
- Save generation_sessions row with: user_id = auth.uid(), proposals_count = N, source_text_length, source_text_hash, generate_duration (optional), created_at now.
- Do not persist proposals.

- Method: POST
  - Path: /ai/accept
  - Description: Persist accepted proposals from a generation session as flashcards. Update accepted_count in the referenced session.
  - Request JSON:
    {
      "generation_session_id": uuid,
      "cards": [
        { "front_text": string (1..1000), "back_text": string (1..1000) }, ...
      ]
    }
  - Response JSON:
    {
      "saved_count": number,
      "flashcards": [ { "id": uuid, "front_text": string, "back_text": string, "origin": "AI_full" } ]
    }
  - Success: 201 Created
  - Errors: 400 Validation error; 403 Forbidden (session not owned by user); 409 Session not found or deleted; 422 Too many items (>20)

Business rules:
- For each card, insert into flashcards with: origin = AI_full; generation_session_id = provided session; user_id = auth.uid().
- Enforce constraints: 1..1000 chars for both sides.
- Update generation_sessions.accepted_count = number of successfully saved cards.

### 2.3 Flashcards CRUD & Search

- Method: POST
  - Path: /flashcards
  - Description: Create one or multiple flashcards (manual or AI-sourced) usable from the UI or via manual API calls.
  - Request JSON:
    - Single: { "front_text": string (1..1000), "back_text": string (1..1000), "origin"?: "manual" | "AI_full" | "AI_edited", "generation_session_id"?: uuid }
    - Batch: [ { "front_text": string (1..1000), "back_text": string (1..1000), "origin"?: "manual" | "AI_full" | "AI_edited", "generation_session_id"?: uuid }, ... ] (1..20 items)
  - Validation:
    - Trim inputs before validation; each provided "front_text" and "back_text" must be 1..1000 characters.
    - Batch is transactional (all-or-nothing). If any item fails validation, no items are saved and a 400 ValidationError is returned with per-item details (see Error model).
    - 422 is returned for semantic errors (e.g., >20 items; origin/session mismatch).
  - Response JSON:
    { "saved_count": number, "flashcards": [ { "id": uuid, "front_text": string, "back_text": string, "origin": "manual" | "AI_full" | "AI_edited", "generation_session_id": uuid|null, "created_at": string, "updated_at": string } ] }
  - Success: 201 Created
  - Errors: 400 Validation error (with per-item details for batch); 401 Unauthorized; 403 Forbidden (session not owned); 404 Generation session not found; 422 Too many items (>20) or origin/session mismatch

Business rules:
- origin defaults to "manual" when omitted.
- If origin IN ("AI_full","AI_edited") ⇒ generation_session_id is REQUIRED and must belong to the current user; else 422/403.
- If origin = "manual" ⇒ generation_session_id MUST be null; else 422.
- Batch requests are processed transactionally (all-or-nothing). Max 20 items per request.

- Method: GET
  - Path: /flashcards
  - Description: List user flashcards with pagination, filtering, and search.
  - Query Params:
    - page: number (default 1)
    - page_size: number (1..100, default 20)
    - q: string (optional, ILIKE search over front_text and back_text)
    - origin: one of [manual, AI_full, AI_edited] (optional)
    - sort: one of [created_at_desc (default), created_at_asc, last_reviewed_at_asc, last_reviewed_at_desc]
  - Response JSON:
    {
      "items": [
        { "id": uuid, "front_text": string, "back_text": string, "origin": string, "last_reviewed_at": string|null, "created_at": string, "updated_at": string }
      ],
      "page": number,
      "page_size": number,
      "total": number
    }
  - Success: 200 OK
  - Errors: 400 Invalid paging; 401 Unauthorized

Notes:
- Use indexes: flashcards_user_created_at_idx, flashcards_user_reviewed_created_idx, flashcards_user_origin_idx, trigram GINs for q.

- Method: GET
  - Path: /flashcards/{id}
  - Description: Get single flashcard by id (owned by current user).
  - Response JSON: { "id": uuid, "front_text": string, "back_text": string, "origin": string, "last_reviewed_at": string|null, "created_at": string, "updated_at": string }
  - Success: 200 OK
  - Errors: 404 Not found; 401 Unauthorized

- Method: PUT
  - Path: /flashcards/{id}
  - Description: Inline edit of an existing flashcard.
  - Request JSON: { "front_text"?: string (1..1000), "back_text"?: string (1..1000) }
  - Validation: Any provided field must be 1..1000 characters after trimming; empty or >1000 chars is rejected with 400.
  - Response JSON: { "id": uuid, "front_text": string, "back_text": string, "origin": string, "updated_at": string }
  - Success: 200 OK
  - Errors: 400 Validation (front_text/back_text must be 1..1000 chars); 403 Forbidden; 404 Not found

Business rules:
- user_id and generation_session_id immutable.
- If origin changes, it can only transition AI_full → AI_edited (handled by DB trigger when content changed). Manual cards keep origin=manual.

- Method: DELETE
  - Path: /flashcards/{id}
  - Description: Permanently delete a flashcard.
  - Response JSON: { success: true }
  - Success: 200 OK
  - Errors: 403 Forbidden; 404 Not found

### 2.4 Study

- Method: GET
  - Path: /study/batch
  - Description: Return the next batch of flashcards for study (default size 5), ordered by last_reviewed_at ASC NULLS FIRST, then created_at ASC.
  - Query Params:
    - limit: number (1..20, default 5)
  - Response JSON:
    { "items": [ { "id": uuid, "front_text": string, "back_text": string, "last_reviewed_at": string|null } ] }
  - Success: 200 OK
  - Errors: 401 Unauthorized

- Method: POST
  - Path: /study/mark-reviewed
  - Description: Mark a set of flashcards as reviewed (sets last_reviewed_at = now()).
  - Request JSON: { "ids": [uuid, ...] }
  - Response JSON: { "updated": number }
  - Success: 200 OK
  - Errors: 400 Empty list; 403 Forbidden for any non-owned id

### 2.5 Generation Sessions (telemetry & reporting)

- Method: GET
  - Path: /generation-sessions
  - Description: List current user generation sessions (newest first).
  - Query Params: page (default 1), page_size (1..50, default 20), source_text_hash (optional exact match)
  - Response JSON:
    {
      "items": [
        { "id": uuid, "proposals_count": number, "accepted_count": number, "acceptance_rate": number, "source_text_length": number, "source_text_hash": string, "generate_duration": number|null, "created_at": string }
      ],
      "page": number,
      "page_size": number,
      "total": number
    }
  - Success: 200 OK
  - Errors: 401 Unauthorized

- Method: GET
  - Path: /generation-sessions/{id}
  - Description: Get a single generation session (owned by user).
  - Response JSON: as in list item
  - Success: 200 OK
  - Errors: 404 Not found; 401 Unauthorized

## 3. Authentication and Authorization
- Mechanism: Bearer JWT (Supabase access_token) in Authorization header.
- DB-level protection: Row Level Security (RLS) enabled on generation_sessions and flashcards with policies:
  - SELECT/INSERT/UPDATE/DELETE allowed only when user_id = auth.uid().
- Service behavior:
  - All endpoints require valid JWT unless explicitly public (none in this plan).
  - Edge/Server functions execute queries as the user (respecting RLS). Service role is reserved for maintenance/admin tasks and not used in user-facing endpoints.
- Errors:
  - 401 Unauthorized when token missing/invalid/expired.
  - 403 Forbidden when resource exists but not owned by the user (blocked by RLS; surface as 404 or 403 depending on implementation preference).

## 4. Validation and Business Logic

### 4.1 Validation rules
- AI Generate:
  - source_text length 100..10000 else 400.
  - max_proposals 1..20, default 20.
- Flashcards:
  - front_text and back_text length 1..1000.
  - On create: origin defaults to "manual" if omitted.
  - If origin IN ("AI_full","AI_edited") ⇒ generation_session_id is REQUIRED and must belong to the current user; else 422 (or 403 if not owned) and 404 if session does not exist.
  - If origin = "manual" ⇒ generation_session_id MUST be null; else 422.
  - On batch create: number of items must be 1..20; processed transactionally (all-or-nothing); reject with 422 if >20.
  - On accept from AI: origin = AI_full, generation_session_id = provided and owned.
- Immutability:
  - user_id and generation_session_id cannot change.
  - origin can only transition AI_full → AI_edited (when content changed); other transitions rejected (DB trigger).

### 4.2 Search, pagination, sorting
- Pagination: page/page_size with total count; page_size capped at 100.
- Search: q applies ILIKE on lower(front_text) and lower(back_text); backed by trigram GIN indexes.
- Sorting:
  - Lists default by created_at DESC (flashcards_user_created_at_idx).
  - Study batch orders by (last_reviewed_at ASC NULLS FIRST, created_at ASC) using flashcards_user_reviewed_created_idx.

### 4.3 AI telemetry and sessions
- /ai/generate creates a generation_sessions row with proposals_count, source_text_length, source_text_hash, generate_duration (optional), created_at.
- /ai/accept updates accepted_count; acceptance_rate is stored generated column.
- Sessions cannot be deleted if any flashcards reference them (ON DELETE RESTRICT).

### 4.4 Study flow
- Client fetches /study/batch to get N=5 cards.
- After revealing/consuming the batch, client calls /study/mark-reviewed with the returned ids; server sets last_reviewed_at = now().
- No user scoring in MVP.

### 4.5 Rate limiting & safety
- Global rate limit for /ai/generate (e.g., 10/min per user, 100/day) to control cost.
- Reasonable rate limits for other endpoints (e.g., 60/min per user).
- Validate request sizes and reject overly large bodies with 413.
- Enforce timeouts on OpenRouter calls (e.g., 20s) and map failures to 502/504.

### 4.6 Error model (examples)
- 400 ValidationError:
  - Single create/update: { code: "validation_error", message: string, details: { field_errors: [ { field: "front_text"|"back_text", code: "too_short"|"too_long"|"empty", max?: 1000, min?: 1, actual?: number, message?: string } ] } }
  - Batch create: { code: "validation_error", message: string, details: { transactional: true, items: [ { index: number, field_errors: [ { field: "front_text"|"back_text"|"origin"|"generation_session_id", code: "too_short"|"too_long"|"empty"|"invalid_origin"|"origin_session_mismatch", max?: 1000, min?: 1, actual?: number, message?: string } ] } ] } }
- 401 Unauthorized: { code: "unauthorized", message: "Missing or invalid token" }
- 403 Forbidden: { code: "forbidden", message: "Not allowed" }
- 404 NotFound: { code: "not_found", message: "Resource not found" }
- 409 Conflict: { code: "conflict", message: string }
- 422 UnprocessableEntity: { code: "unprocessable_entity", message: string }
- 429 TooManyRequests: { code: "rate_limited", message: string }
- 5xx Server errors

## 5. Technology Alignment
- Backend: Supabase (PostgreSQL, RLS, Auth). Endpoints can be implemented as Supabase Edge Functions (Deno) or a lightweight API service; all DB access uses user JWT to honor RLS.
- Search: pg_trgm extension and GIN indexes on lower(front_text/back_text) enable fast ILIKE queries.
- Frontend: Astro + React interact with this API using Supabase Auth tokens. Client renders proposal lists locally; only accepted cards are posted.
- AI: OpenRouter API for model calls; API key managed server-side; user quotas enforced via rate limits.

## 6. Request/Response Schemas (concise)

- Flashcard (response):
  {
    "id": uuid,
    "front_text": string,
    "back_text": string,
    "origin": "manual" | "AI_full" | "AI_edited",
    "generation_session_id": uuid|null,
    "last_reviewed_at": string|null,
    "created_at": string,
    "updated_at": string
  }

- GenerationSession (response):
  {
    "id": uuid,
    "proposals_count": number,
    "accepted_count": number,
    "acceptance_rate": number,
    "source_text_length": number,
    "source_text_hash": string,
    "generate_duration": number|null,
    "created_at": string
  }

## 7. Security Considerations
- JWT verification and audience checks for Supabase tokens.
- Never expose OpenRouter API keys to clients; server-side only.
- Input sanitization and size limits to mitigate abuse.
- CORS configured to trusted frontend origins only.
- Logging: capture request IDs, user_id, and minimal metadata; avoid logging card contents in production logs unless necessary.

## 8. API Versioning and Stability
- Prefix endpoints with /v1 (recommended): e.g., /v1/flashcards, /v1/ai/generate.
- Backward-compatible changes only within v1; breaking changes require v2.

## 9. Example Flows

- AI-assisted creation:
  1) POST /ai/generate with valid token and source_text.
  2) User picks subset of proposals; client sends POST /ai/accept with generation_session_id and selected cards.
  3) Optional: user later edits a saved card via PATCH /flashcards/{id}; DB trigger auto-transitions origin AI_full → AI_edited if content changed.

- Manual creation and study:
  1) POST /flashcards with Q&A.
  2) GET /flashcards?q=term&page=1&page_size=20 to browse/search.
  3) GET /study/batch (limit=5) then POST /study/mark-reviewed with returned ids.

