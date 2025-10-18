/**
 * Flashcard Service
 *
 * Business logic layer for flashcard management operations.
 * Handles database interactions, validation, and business rules.
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  CreateFlashcardCommand,
  CreateFlashcardsBatchCommand,
  CreateFlashcardsResponse,
  FlashcardsListQuery,
  FlashcardsListResponse,
  FlashcardDTO,
  UpdateFlashcardCommand,
  UpdateFlashcardResponse,
  DeleteFlashcardResponse,
} from "@/types";

/**
 * Custom error types for better error handling
 */
export class FlashcardServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "FlashcardServiceError";
  }
}

/**
 * Validates generation session ownership and existence
 *
 * @throws FlashcardServiceError if validation fails
 */
async function validateGenerationSessions(supabase: SupabaseClient, sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;

  const uniqueSessionIds = [...new Set(sessionIds)];

  const { data: sessions, error } = await supabase.from("generation_sessions").select("id").in("id", uniqueSessionIds);

  if (error) {
    console.error("Error validating generation sessions:", error);
    throw new FlashcardServiceError("Failed to validate generation sessions", "DATABASE_ERROR", 500);
  }

  // Check if all sessions exist and are accessible (RLS ensures ownership)
  if (!sessions || sessions.length !== uniqueSessionIds.length) {
    throw new FlashcardServiceError(
      "One or more generation sessions not found or not accessible",
      "SESSION_NOT_FOUND",
      404
    );
  }
}

/**
 * Validates business rules for flashcard creation
 *
 * Rules:
 * - If origin is 'manual', generation_session_id MUST be null
 * - If origin is 'AI_full' or 'AI_edited', generation_session_id is REQUIRED
 *
 * @throws FlashcardServiceError if validation fails
 */
function validateOriginSessionRules(flashcards: CreateFlashcardCommand[]): void {
  for (let i = 0; i < flashcards.length; i++) {
    const card = flashcards[i];
    const origin = card.origin || "manual";

    if (origin === "manual" && card.generation_session_id) {
      throw new FlashcardServiceError(
        `Item ${i}: origin 'manual' cannot have generation_session_id`,
        "ORIGIN_SESSION_MISMATCH",
        422,
        { index: i, field: "generation_session_id" }
      );
    }

    if ((origin === "AI_full" || origin === "AI_edited") && !card.generation_session_id) {
      throw new FlashcardServiceError(
        `Item ${i}: origin '${origin}' requires generation_session_id`,
        "ORIGIN_SESSION_MISMATCH",
        422,
        { index: i, field: "generation_session_id" }
      );
    }
  }
}

/**
 * Creates a single flashcard
 */
export async function createOne(
  supabase: SupabaseClient,
  command: CreateFlashcardCommand,
  userId: string
): Promise<CreateFlashcardsResponse> {
  return createBatch(supabase, [command], userId);
}

/**
 * Creates multiple flashcards in a batch (transactional)
 *
 * @param supabase - Supabase client with user context
 * @param commands - Array of flashcard creation commands (max 20)
 * @param userId - Current user ID
 * @returns Response with saved flashcards
 * @throws FlashcardServiceError on validation or database errors
 */
export async function createBatch(
  supabase: SupabaseClient,
  commands: CreateFlashcardsBatchCommand,
  userId: string
): Promise<CreateFlashcardsResponse> {
  // Validate business rules
  validateOriginSessionRules(commands);

  // Collect unique generation session IDs for validation
  const sessionIds = commands
    .filter((cmd) => cmd.generation_session_id)
    .map((cmd) => cmd.generation_session_id as string);

  // Validate generation sessions exist and belong to user
  await validateGenerationSessions(supabase, sessionIds, userId);

  // Prepare flashcards for insertion
  const flashcardsToInsert = commands.map((cmd) => ({
    user_id: userId,
    front_text: cmd.front_text,
    back_text: cmd.back_text,
    origin: cmd.origin || ("manual" as const),
    generation_session_id: cmd.generation_session_id || null,
  }));

  // Insert flashcards (transactional within table)
  const { data: savedFlashcards, error: insertError } = await supabase
    .from("flashcards")
    .insert(flashcardsToInsert)
    .select("id, front_text, back_text, origin, generation_session_id, last_reviewed_at, created_at, updated_at");

  if (insertError || !savedFlashcards) {
    console.error("Flashcard insertion error:", insertError);
    throw new FlashcardServiceError("Failed to save flashcards", "DATABASE_ERROR", 500);
  }

  return {
    saved_count: savedFlashcards.length,
    flashcards: savedFlashcards as FlashcardDTO[],
  };
}

/**
 * Lists flashcards with pagination, filtering, and search
 *
 * @param supabase - Supabase client with user context (RLS applies)
 * @param query - Query parameters for filtering and pagination
 * @returns Paginated list of flashcards
 * @throws FlashcardServiceError on database errors
 */
export async function list(supabase: SupabaseClient, query: FlashcardsListQuery): Promise<FlashcardsListResponse> {
  const page = query.page || 1;
  const pageSize = query.page_size || 20;
  const sort = query.sort || "created_at_desc";

  // Build query
  let dbQuery = supabase
    .from("flashcards")
    .select("id, front_text, back_text, origin, last_reviewed_at, created_at, updated_at", { count: "exact" });

  // Apply origin filter
  if (query.origin) {
    dbQuery = dbQuery.eq("origin", query.origin);
  }

  // Apply search filter (ILIKE on front_text and back_text)
  if (query.q) {
    const searchTerm = `%${query.q}%`;
    dbQuery = dbQuery.or(`front_text.ilike.${searchTerm},back_text.ilike.${searchTerm}`);
  }

  // Apply sorting
  switch (sort) {
    case "created_at_asc":
      dbQuery = dbQuery.order("created_at", { ascending: true });
      break;
    case "created_at_desc":
      dbQuery = dbQuery.order("created_at", { ascending: false });
      break;
    case "last_reviewed_at_asc":
      dbQuery = dbQuery.order("last_reviewed_at", { ascending: true, nullsFirst: true });
      break;
    case "last_reviewed_at_desc":
      dbQuery = dbQuery.order("last_reviewed_at", { ascending: false, nullsFirst: false });
      break;
  }

  // Apply pagination
  const offset = (page - 1) * pageSize;
  dbQuery = dbQuery.range(offset, offset + pageSize - 1);

  // Execute query
  const { data: flashcards, error, count } = await dbQuery;

  if (error) {
    console.error("Flashcard list error:", error);
    throw new FlashcardServiceError("Failed to fetch flashcards", "DATABASE_ERROR", 500);
  }

  return {
    items: (flashcards || []) as FlashcardDTO[],
    page,
    page_size: pageSize,
    total: count || 0,
  };
}

/**
 * Gets a single flashcard by ID
 *
 * @param supabase - Supabase client with user context (RLS applies)
 * @param id - Flashcard ID
 * @returns Flashcard DTO
 * @throws FlashcardServiceError if not found or database error
 */
export async function getById(supabase: SupabaseClient, id: string): Promise<FlashcardDTO> {
  const { data: flashcard, error } = await supabase
    .from("flashcards")
    .select("id, front_text, back_text, origin, last_reviewed_at, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !flashcard) {
    throw new FlashcardServiceError("Flashcard not found", "NOT_FOUND", 404);
  }

  return flashcard as FlashcardDTO;
}

/**
 * Updates a flashcard
 *
 * @param supabase - Supabase client with user context (RLS applies)
 * @param id - Flashcard ID
 * @param command - Update command with fields to change
 * @returns Updated flashcard
 * @throws FlashcardServiceError if not found or database error
 */
export async function update(
  supabase: SupabaseClient,
  id: string,
  command: UpdateFlashcardCommand
): Promise<UpdateFlashcardResponse> {
  const updateData: Record<string, string> = {};

  if (command.front_text !== undefined) {
    updateData.front_text = command.front_text;
  }

  if (command.back_text !== undefined) {
    updateData.back_text = command.back_text;
  }

  const { data: flashcard, error } = await supabase
    .from("flashcards")
    .update(updateData)
    .eq("id", id)
    .select("id, front_text, back_text, origin, updated_at")
    .single();

  if (error || !flashcard) {
    throw new FlashcardServiceError("Flashcard not found or update failed", "NOT_FOUND", 404);
  }

  return flashcard as UpdateFlashcardResponse;
}

/**
 * Deletes a flashcard
 *
 * @param supabase - Supabase client with user context (RLS applies)
 * @param id - Flashcard ID
 * @returns Success response
 * @throws FlashcardServiceError if not found or database error
 */
export async function deleteFlashcard(supabase: SupabaseClient, id: string): Promise<DeleteFlashcardResponse> {
  const { error, count } = await supabase.from("flashcards").delete({ count: "exact" }).eq("id", id);

  if (error) {
    console.error("Flashcard deletion error:", error);
    throw new FlashcardServiceError("Failed to delete flashcard", "DATABASE_ERROR", 500);
  }

  if (count === 0) {
    throw new FlashcardServiceError("Flashcard not found", "NOT_FOUND", 404);
  }

  return { success: true };
}
