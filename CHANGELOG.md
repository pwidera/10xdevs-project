# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Flashcards API (2025-01-15)

#### API Endpoints
- **POST /api/flashcards** - Create single or batch flashcards (1-20 items)
  - Support for manual and AI-generated flashcards
  - Transactional batch operations
  - Business rule validation (origin/session consistency)
  
- **GET /api/flashcards** - List flashcards with pagination and filtering
  - Pagination (page, page_size 1-100)
  - Search (ILIKE on front_text and back_text)
  - Filtering by origin (manual, AI_full, AI_edited)
  - Sorting (created_at, last_reviewed_at, ascending/descending)
  
- **GET /api/flashcards/{id}** - Retrieve single flashcard by ID
  - UUID validation
  - RLS-protected access
  
- **PUT /api/flashcards/{id}** - Update flashcard content
  - Partial updates (front_text and/or back_text)
  - Automatic origin transition (AI_full → AI_edited via DB trigger)
  
- **DELETE /api/flashcards/{id}** - Permanently delete flashcard
  - RLS-protected deletion

#### Validation Layer
- `src/lib/validation/flashcards.schema.ts` - Zod validation schemas
  - CreateFlashcardSchema - Single flashcard validation
  - CreateFlashcardsBatchSchema - Batch validation (1-20 items)
  - UpdateFlashcardSchema - Update validation (min 1 field required)
  - FlashcardsListQuerySchema - Query parameters with defaults
  - IdParamSchema - UUID validation

#### Service Layer
- `src/lib/services/flashcard.service.ts` - Business logic layer
  - createOne() - Create single flashcard
  - createBatch() - Create multiple flashcards (transactional)
  - list() - Paginated listing with filters
  - getById() - Retrieve single flashcard
  - update() - Update flashcard content
  - deleteFlashcard() - Delete flashcard
  - validateGenerationSessions() - Verify session ownership
  - validateOriginSessionRules() - Enforce business rules
  - FlashcardServiceError - Custom error class with HTTP status codes

#### Testing
- `src/lib/validation/__tests__/flashcards.schema.test.ts` - 38 unit tests
  - CreateFlashcardSchema tests (16 tests)
  - CreateFlashcardsBatchSchema tests (6 tests)
  - UpdateFlashcardSchema tests (6 tests)
  - FlashcardsListQuerySchema tests (8 tests)
  - IdParamSchema tests (2 tests)
  - 100% test pass rate

#### Documentation
- `docs/api/flashcards.md` - Complete API documentation
  - Endpoint descriptions
  - Request/response examples
  - Error codes and handling
  - cURL examples
  
- `docs/implementation/flashcards-api-implementation.md` - Implementation summary
  - Architecture overview
  - Design decisions
  - Performance considerations
  - Security considerations
  
- `docs/development/adding-new-endpoints.md` - Developer guide
  - Step-by-step guide for adding new endpoints
  - Best practices
  - Common patterns
  - Testing checklist

#### Bug Fixes
- Fixed TypeScript error in `src/middleware/index.ts` - email type mismatch (undefined vs null)
- Fixed TypeScript errors in `src/lib/__tests__/utils.test.ts` - variant type narrowing issues

### Changed
- Updated `README.md` with API documentation links and test scripts
- Enhanced test scripts documentation in README

## [0.0.1] - 2025-01-XX

### Added
- Initial project setup with Astro 5, React 19, TypeScript 5
- Supabase integration for authentication and database
- AI generation endpoints (POST /api/ai/generate, POST /api/ai/accept)
- Authentication endpoints (login, register, password management)
- Database schema with RLS policies
- Testing infrastructure (Vitest, Playwright)
- ESLint and Prettier configuration
- Husky and lint-staged for pre-commit hooks

---

## Summary of Changes (2025-01-15)

**Files Added:**
- `src/pages/api/flashcards/index.ts` (POST, GET endpoints)
- `src/pages/api/flashcards/[id].ts` (GET, PUT, DELETE endpoints)
- `src/lib/services/flashcard.service.ts` (business logic)
- `src/lib/validation/flashcards.schema.ts` (Zod schemas)
- `src/lib/validation/__tests__/flashcards.schema.test.ts` (38 unit tests)
- `docs/api/flashcards.md` (API documentation)
- `docs/implementation/flashcards-api-implementation.md` (implementation summary)
- `docs/development/adding-new-endpoints.md` (developer guide)
- `CHANGELOG.md` (this file)

**Files Modified:**
- `README.md` - Added API documentation links and test scripts
- `src/middleware/index.ts` - Fixed TypeScript error (email type)
- `src/lib/__tests__/utils.test.ts` - Fixed TypeScript errors (variant types)

**Test Results:**
- Total tests: 213 passed, 1 skipped
- New flashcard tests: 38 passed (100%)
- Build status: ✅ Passing
- TypeScript: ✅ No errors

**Lines of Code:**
- Validation schemas: ~150 lines
- Service layer: ~300 lines
- API endpoints: ~500 lines (combined)
- Tests: ~400 lines
- Documentation: ~800 lines
- **Total new code: ~2,150 lines**

