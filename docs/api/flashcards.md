# Flashcards API Documentation

## Overview

The Flashcards API provides endpoints for managing user flashcards, including creation (single or batch), listing with pagination and filtering, retrieval, updating, and deletion.

All endpoints require JWT authentication via Supabase Auth. Row-Level Security (RLS) ensures users can only access their own flashcards.

## Base URL

```
/api/flashcards
```

## Authentication

All endpoints require a valid Supabase JWT token. The token is automatically managed by the Astro middleware and available in `context.locals.user`.

**Unauthorized requests return:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```
Status: `401 Unauthorized`

---

## Endpoints

### 1. Create Flashcard(s)

Create one or more flashcards (single or batch operation).

**Endpoint:** `POST /api/flashcards`

**Request Body (Single):**
```json
{
  "front_text": "What is TypeScript?",
  "back_text": "A typed superset of JavaScript",
  "origin": "manual",
  "generation_session_id": null
}
```

**Request Body (Batch):**
```json
[
  {
    "front_text": "Question 1",
    "back_text": "Answer 1",
    "origin": "AI_full",
    "generation_session_id": "550e8400-e29b-41d4-a716-446655440000"
  },
  {
    "front_text": "Question 2",
    "back_text": "Answer 2",
    "origin": "AI_full",
    "generation_session_id": "550e8400-e29b-41d4-a716-446655440000"
  }
]
```

**Parameters:**
- `front_text` (string, required): Question text (1-1000 characters, trimmed)
- `back_text` (string, required): Answer text (1-1000 characters, trimmed)
- `origin` (string, optional): Origin of the flashcard
  - `"manual"` (default): Manually created
  - `"AI_full"`: AI-generated, not edited
  - `"AI_edited"`: AI-generated, then edited
- `generation_session_id` (string|null, optional): UUID of the AI generation session

**Business Rules:**
- If `origin` is `"manual"`, `generation_session_id` MUST be `null`
- If `origin` is `"AI_full"` or `"AI_edited"`, `generation_session_id` is REQUIRED and must belong to the current user
- Batch operations are limited to 1-20 items
- Batch operations are transactional (all-or-nothing)

**Success Response (201 Created):**
```json
{
  "saved_count": 2,
  "flashcards": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "front_text": "Question 1",
      "back_text": "Answer 1",
      "origin": "AI_full",
      "generation_session_id": "550e8400-e29b-41d4-a716-446655440000",
      "last_reviewed_at": null,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "front_text": "Question 2",
      "back_text": "Answer 2",
      "origin": "AI_full",
      "generation_session_id": "550e8400-e29b-41d4-a716-446655440000",
      "last_reviewed_at": null,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses:**

**400 Bad Request** - Validation error:
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "front_text",
      "message": "front_text must not be empty"
    }
  ]
}
```

**404 Not Found** - Generation session not found:
```json
{
  "error": "SESSION_NOT_FOUND",
  "message": "One or more generation sessions not found or not accessible"
}
```

**422 Unprocessable Entity** - Business rule violation:
```json
{
  "error": "ORIGIN_SESSION_MISMATCH",
  "message": "Item 0: origin 'manual' cannot have generation_session_id",
  "details": {
    "index": 0,
    "field": "generation_session_id"
  }
}
```

---

### 2. List Flashcards

Retrieve a paginated list of flashcards with optional filtering and search.

**Endpoint:** `GET /api/flashcards`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1, min: 1)
- `page_size` (number, optional): Items per page (default: 20, min: 1, max: 100)
- `q` (string, optional): Search query (case-insensitive ILIKE on front_text and back_text)
- `origin` (string, optional): Filter by origin (`"manual"`, `"AI_full"`, `"AI_edited"`)
- `sort` (string, optional): Sort order (default: `"created_at_desc"`)
  - `"created_at_desc"`: Newest first
  - `"created_at_asc"`: Oldest first
  - `"last_reviewed_at_asc"`: Least recently reviewed first (nulls first)
  - `"last_reviewed_at_desc"`: Most recently reviewed first (nulls last)

**Example Request:**
```
GET /api/flashcards?page=1&page_size=20&q=typescript&origin=AI_full&sort=created_at_desc
```

**Success Response (200 OK):**
```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "front_text": "What is TypeScript?",
      "back_text": "A typed superset of JavaScript",
      "origin": "AI_full",
      "last_reviewed_at": "2025-01-14T15:20:00Z",
      "created_at": "2025-01-10T10:30:00Z",
      "updated_at": "2025-01-10T10:30:00Z"
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 1
}
```

**Error Responses:**

**400 Bad Request** - Invalid query parameters:
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "page",
      "message": "page must be at least 1"
    }
  ]
}
```

---

### 3. Get Flashcard by ID

Retrieve a single flashcard by its ID.

**Endpoint:** `GET /api/flashcards/{id}`

**Path Parameters:**
- `id` (string, required): UUID of the flashcard

**Example Request:**
```
GET /api/flashcards/123e4567-e89b-12d3-a456-426614174000
```

**Success Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "front_text": "What is TypeScript?",
  "back_text": "A typed superset of JavaScript",
  "origin": "AI_full",
  "last_reviewed_at": "2025-01-14T15:20:00Z",
  "created_at": "2025-01-10T10:30:00Z",
  "updated_at": "2025-01-10T10:30:00Z"
}
```

**Error Responses:**

**400 Bad Request** - Invalid UUID:
```json
{
  "error": "Validation error",
  "message": "Invalid flashcard ID format",
  "details": [
    {
      "field": "",
      "message": "ID must be a valid UUID"
    }
  ]
}
```

**404 Not Found** - Flashcard not found:
```json
{
  "error": "NOT_FOUND",
  "message": "Flashcard not found"
}
```

---

### 4. Update Flashcard

Update the content of an existing flashcard (front_text and/or back_text).

**Endpoint:** `PUT /api/flashcards/{id}`

**Path Parameters:**
- `id` (string, required): UUID of the flashcard

**Request Body:**
```json
{
  "front_text": "Updated question text",
  "back_text": "Updated answer text"
}
```

**Parameters:**
- `front_text` (string, optional): Updated question text (1-1000 characters, trimmed)
- `back_text` (string, optional): Updated answer text (1-1000 characters, trimmed)
- At least one field must be provided

**Note:** If the flashcard has `origin: "AI_full"` and content is changed, the database trigger will automatically update `origin` to `"AI_edited"`.

**Success Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "front_text": "Updated question text",
  "back_text": "Updated answer text",
  "origin": "AI_edited",
  "updated_at": "2025-01-15T11:00:00Z"
}
```

**Error Responses:**

**400 Bad Request** - Validation error:
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "",
      "message": "At least one field (front_text or back_text) must be provided"
    }
  ]
}
```

**404 Not Found** - Flashcard not found:
```json
{
  "error": "NOT_FOUND",
  "message": "Flashcard not found or update failed"
}
```

---

### 5. Delete Flashcard

Permanently delete a flashcard.

**Endpoint:** `DELETE /api/flashcards/{id}`

**Path Parameters:**
- `id` (string, required): UUID of the flashcard

**Example Request:**
```
DELETE /api/flashcards/123e4567-e89b-12d3-a456-426614174000
```

**Success Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**

**400 Bad Request** - Invalid UUID:
```json
{
  "error": "Validation error",
  "message": "Invalid flashcard ID format"
}
```

**404 Not Found** - Flashcard not found:
```json
{
  "error": "NOT_FOUND",
  "message": "Flashcard not found"
}
```

---

## Error Codes Summary

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `Validation error` | Invalid input data (Zod validation failed) |
| 401 | `Unauthorized` | Missing or invalid JWT token |
| 404 | `NOT_FOUND` | Flashcard or generation session not found |
| 404 | `SESSION_NOT_FOUND` | Generation session not found or not accessible |
| 422 | `ORIGIN_SESSION_MISMATCH` | Business rule violation (origin/session_id mismatch) |
| 422 | `Unprocessable Entity` | Batch exceeds 20 items |
| 500 | `Internal server error` | Unexpected server error |

---

## Implementation Details

### Security
- **Authentication**: All endpoints require valid Supabase JWT
- **Authorization**: Row-Level Security (RLS) ensures users can only access their own flashcards
- **Validation**: All inputs validated using Zod schemas
- **Rate Limiting**: Batch operations limited to 20 items

### Performance
- **Pagination**: Default 20 items per page, max 100
- **Indexing**: Database indexes on `(user_id, created_at)`, `(user_id, last_reviewed_at)`, `(user_id, origin)`
- **Search**: GIN trigram index on `lower(front_text)` and `lower(back_text)` for efficient ILIKE queries
- **Batch Operations**: Single database transaction for all-or-nothing consistency

### Data Validation
- Text fields trimmed before validation
- Front/back text: 1-1000 characters
- Origin: enum validation (`manual`, `AI_full`, `AI_edited`)
- Generation session ID: UUID format validation
- Business rules enforced at service layer and database level (constraints + triggers)

---

## Examples

### Create Manual Flashcard
```bash
curl -X POST https://your-domain.com/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "front_text": "What is Astro?",
    "back_text": "A modern web framework for building fast websites"
  }'
```

### Create Batch AI Flashcards
```bash
curl -X POST https://your-domain.com/api/flashcards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '[
    {
      "front_text": "Question 1",
      "back_text": "Answer 1",
      "origin": "AI_full",
      "generation_session_id": "550e8400-e29b-41d4-a716-446655440000"
    },
    {
      "front_text": "Question 2",
      "back_text": "Answer 2",
      "origin": "AI_full",
      "generation_session_id": "550e8400-e29b-41d4-a716-446655440000"
    }
  ]'
```

### Search and Filter
```bash
curl -X GET "https://your-domain.com/api/flashcards?q=typescript&origin=AI_full&sort=created_at_desc&page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Flashcard
```bash
curl -X PUT https://your-domain.com/api/flashcards/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "front_text": "Updated question"
  }'
```

### Delete Flashcard
```bash
curl -X DELETE https://your-domain.com/api/flashcards/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

