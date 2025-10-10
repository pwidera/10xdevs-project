/**
 * DTO and Command Model Type Definitions
 * 
 * This file contains all Data Transfer Objects (DTOs) and Command Models
 * used by the API, derived from the database schema types.
 */

import type { Tables, TablesInsert, TablesUpdate, Enums } from './db/database.types';

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Generic paginated response wrapper
 */
export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
};

/**
 * Language options for AI generation
 */
export type Language = 'pl' | 'en';

/**
 * Flashcard origin type from database enum
 */
export type FlashcardOrigin = Enums<'flashcard_origin'>;

/**
 * Individual flashcard origin types
 */
export type FlashcardOriginAIFull = 'AI_full';
export type FlashcardOriginAIEdited = 'AI_edited';
export type FlashcardOriginManual = 'manual';

/**
 * Sort options for flashcard listing
 */
export type FlashcardSortOption = 
  | 'created_at_desc' 
  | 'created_at_asc' 
  | 'last_reviewed_at_asc' 
  | 'last_reviewed_at_desc';

// ============================================================================
// FLASHCARD DTOs
// ============================================================================

/**
 * Complete flashcard DTO for API responses
 * Derived from: Tables<'flashcards'>
 */
export type FlashcardDTO = Pick<
  Tables<'flashcards'>,
  | 'id'
  | 'front_text'
  | 'back_text'
  | 'origin'
  | 'generation_session_id'
  | 'last_reviewed_at'
  | 'created_at'
  | 'updated_at'
>;

/**
 * Flashcard DTO for study sessions (minimal fields)
 * Derived from: Tables<'flashcards'>
 */
export type StudyFlashcardDTO = Pick<
  Tables<'flashcards'>,
  | 'id'
  | 'front_text'
  | 'back_text'
  | 'last_reviewed_at'
>;

/**
 * Flashcard proposal from AI generation (not persisted)
 */
export type FlashcardProposalDTO = {
  front_text: string; // max 1000 chars
  back_text: string;  // max 1000 chars
};

// ============================================================================
// FLASHCARD COMMANDS
// ============================================================================

/**
 * Command to create a single flashcard
 * Derived from: TablesInsert<'flashcards'>
 * 
 * Business rules:
 * - origin defaults to "manual" if omitted
 * - If origin is "AI_full" or "AI_edited", generation_session_id is REQUIRED
 * - If origin is "manual", generation_session_id MUST be null
 */
export type CreateFlashcardCommand = Pick<
  TablesInsert<'flashcards'>,
  'front_text' | 'back_text'
> & Partial<Pick<
  TablesInsert<'flashcards'>,
  'origin' | 'generation_session_id'
>>;

/**
 * Command to create multiple flashcards in a batch (max 20 items)
 * Batch operations are transactional (all-or-nothing)
 */
export type CreateFlashcardsBatchCommand = CreateFlashcardCommand[];

/**
 * Response after creating flashcard(s)
 */
export type CreateFlashcardsResponse = {
  saved_count: number;
  flashcards: FlashcardDTO[];
};

/**
 * Command to update an existing flashcard
 * Derived from: TablesUpdate<'flashcards'>
 * 
 * Note: user_id and generation_session_id are immutable
 * Origin can only transition AI_full → AI_edited (handled by DB trigger)
 */
export type UpdateFlashcardCommand = Partial<Pick<
  TablesUpdate<'flashcards'>,
  'front_text' | 'back_text'
>>;

/**
 * Response after updating a flashcard
 * Derived from: Tables<'flashcards'>
 */
export type UpdateFlashcardResponse = Pick<
  Tables<'flashcards'>,
  'id' | 'front_text' | 'back_text' | 'origin' | 'updated_at'
>;

/**
 * Query parameters for listing flashcards
 */
export type FlashcardsListQuery = {
  page?: number;           // default 1
  page_size?: number;      // 1-100, default 20
  q?: string;              // ILIKE search on front_text and back_text
  origin?: FlashcardOrigin;
  sort?: FlashcardSortOption; // default: created_at_desc
};

/**
 * Response for flashcard listing
 */
export type FlashcardsListResponse = PaginatedResponse<FlashcardDTO>;

/**
 * Response for flashcard deletion
 */
export type DeleteFlashcardResponse = {
  success: boolean;
};

// ============================================================================
// GENERATION SESSION DTOs
// ============================================================================

/**
 * Complete generation session DTO for API responses
 * Derived from: Tables<'generation_sessions'>
 * 
 * Note: user_id is excluded (internal field)
 */
export type GenerationSessionDTO = Pick<
  Tables<'generation_sessions'>,
  | 'id'
  | 'proposals_count'
  | 'accepted_count'
  | 'acceptance_rate'
  | 'source_text_length'
  | 'source_text_hash'
  | 'generate_duration'
  | 'created_at'
>;

/**
 * Summary generation session DTO (subset for AI generate response)
 * Derived from: Tables<'generation_sessions'>
 */
export type GenerationSessionSummaryDTO = Pick<
  Tables<'generation_sessions'>,
  | 'id'
  | 'proposals_count'
  | 'source_text_length'
  | 'created_at'
>;

/**
 * Query parameters for listing generation sessions
 */
export type GenerationSessionsListQuery = {
  page?: number;              // default 1
  page_size?: number;         // 1-50, default 20
  source_text_hash?: string;  // optional exact match filter
};

/**
 * Response for generation session listing
 */
export type GenerationSessionsListResponse = PaginatedResponse<GenerationSessionDTO>;

// ============================================================================
// AI GENERATION COMMANDS
// ============================================================================

/**
 * Command to generate flashcard proposals using AI
 * 
 * Validation:
 * - source_text: 100-10000 characters
 * - max_proposals: 1-20, default 20
 */
export type GenerateFlashcardsCommand = {
  source_text: string;        // 100-10000 chars
  language: Language | null;  // 'pl' | 'en' | null
  max_proposals?: number;     // 1-20, default 20
};

/**
 * Response from AI flashcard generation
 * Contains session metadata and proposals (not persisted)
 */
export type GenerateFlashcardsResponse = {
  generation_session: GenerationSessionSummaryDTO;
  proposals: FlashcardProposalDTO[];
};

/**
 * Command to accept and persist AI-generated proposals
 * 
 * Business rules:
 * - generation_session_id must belong to current user
 * - cards array max 20 items
 * - Each card will be saved with origin = "AI_full"
 */
export type AcceptProposalsCommand = {
  generation_session_id: string; // uuid
  cards: FlashcardProposalDTO[];
};

/**
 * Response after accepting AI proposals
 */
export type AcceptProposalsResponse = {
  saved_count: number;
  flashcards: FlashcardDTO[];
};

// ============================================================================
// STUDY COMMANDS
// ============================================================================

/**
 * Query parameters for fetching study batch
 */
export type StudyBatchQuery = {
  limit?: number; // 1-20, default 5
};

/**
 * Response for study batch
 * Cards ordered by: last_reviewed_at ASC NULLS FIRST, created_at ASC
 */
export type StudyBatchResponse = {
  items: StudyFlashcardDTO[];
};

/**
 * Command to mark flashcards as reviewed
 * Sets last_reviewed_at = now() for all provided ids
 */
export type MarkReviewedCommand = {
  ids: string[]; // array of uuids
};

/**
 * Response after marking flashcards as reviewed
 */
export type MarkReviewedResponse = {
  updated: number;
};

