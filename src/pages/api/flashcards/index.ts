/**
 * POST /api/flashcards
 * GET /api/flashcards
 *
 * Endpoints for flashcard management:
 * - POST: Create single or batch flashcards (manual or AI-generated)
 * - GET: List flashcards with pagination, filtering, and search
 *
 * Features:
 * - Requires JWT authentication
 * - Validates input using Zod schemas
 * - Enforces business rules (origin/session validation)
 * - Transactional batch operations (all-or-nothing)
 * - RLS-protected database access
 *
 * POST Request Body (single):
 * {
 *   front_text: string (1-1000 chars),
 *   back_text: string (1-1000 chars),
 *   origin?: "manual" | "AI_full" | "AI_edited",
 *   generation_session_id?: string (uuid)
 * }
 *
 * POST Request Body (batch):
 * [ { ...single flashcard... }, ... ] (1-20 items)
 *
 * GET Query Parameters:
 * - page: number (default 1)
 * - page_size: number (1-100, default 20)
 * - q: string (search in front_text and back_text)
 * - origin: "manual" | "AI_full" | "AI_edited"
 * - sort: "created_at_desc" | "created_at_asc" | "last_reviewed_at_asc" | "last_reviewed_at_desc"
 *
 * Response Codes:
 * - 200: Success (GET)
 * - 201: Created (POST)
 * - 400: Validation error
 * - 401: Unauthorized
 * - 404: Session not found
 * - 422: Business rule violation (batch >20, origin/session mismatch)
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import type { FlashcardsListResponse } from "@/types";
import {
  CreateFlashcardSchema,
  CreateFlashcardsBatchSchema,
  FlashcardsListQuerySchema,
} from "@/lib/validation/flashcards.schema";
import { createOne, createBatch, list, FlashcardServiceError } from "@/lib/services/flashcard.service";

// Disable prerendering for this API route
export const prerender = false;

/**
 * Helper function to create JSON responses
 */
function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

/**
 * POST handler for flashcard creation (single or batch)
 */
export const POST: APIRoute = async (context) => {
  // ============================================================================
  // STEP 1: Authentication check
  // ============================================================================

  if (!context.locals.user) {
    return json(
      {
        error: "Unauthorized",
        message: "Authentication required",
      },
      { status: 401 }
    );
  }

  const userId = context.locals.user.id;
  const supabase = context.locals.supabase;

  // ============================================================================
  // STEP 2: Parse and validate request body
  // ============================================================================

  let requestBody: unknown;

  try {
    requestBody = await context.request.json();
  } catch {
    return json(
      {
        error: "Invalid JSON",
        message: "Request body must be valid JSON",
      },
      { status: 400 }
    );
  }

  // Determine if single or batch operation
  const isBatch = Array.isArray(requestBody);

  // ============================================================================
  // STEP 3: Validate input with appropriate schema
  // ============================================================================

  try {
    if (isBatch) {
      // Validate batch
      const validatedData = CreateFlashcardsBatchSchema.parse(requestBody);

      // Additional check: max 20 items (should be caught by schema, but double-check)
      if (validatedData.length > 20) {
        return json(
          {
            error: "Unprocessable Entity",
            message: "Batch cannot exceed 20 flashcards",
          },
          { status: 422 }
        );
      }

      // Create batch
      const response = await createBatch(supabase, validatedData, userId);

      return json(response, { status: 201 });
    } else {
      // Validate single flashcard
      const validatedData = CreateFlashcardSchema.parse(requestBody);

      // Create single flashcard
      const response = await createOne(supabase, validatedData, userId);

      return json(response, { status: 201 });
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return json(
        {
          error: "Validation error",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle service errors
    if (error instanceof FlashcardServiceError) {
      return json(
        {
          error: error.code,
          message: error.message,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error during flashcard creation:", error);
    return json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
};

/**
 * GET handler for flashcard listing
 */
export const GET: APIRoute = async (context) => {
  // ============================================================================
  // STEP 1: Authentication check
  // ============================================================================

  if (!context.locals.user) {
    return json(
      {
        error: "Unauthorized",
        message: "Authentication required",
      },
      { status: 401 }
    );
  }

  const supabase = context.locals.supabase;

  // ============================================================================
  // STEP 2: Parse and validate query parameters
  // ============================================================================

  const url = new URL(context.request.url);
  const queryParams = {
    page: url.searchParams.get("page") || undefined,
    page_size: url.searchParams.get("page_size") || undefined,
    q: url.searchParams.get("q") || undefined,
    origin: url.searchParams.get("origin") || undefined,
    sort: url.searchParams.get("sort") || undefined,
  };

  try {
    const validatedQuery = FlashcardsListQuerySchema.parse(queryParams);

    // ============================================================================
    // STEP 3: Fetch flashcards
    // ============================================================================

    const response: FlashcardsListResponse = await list(supabase, validatedQuery);

    return json(response, { status: 200 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return json(
        {
          error: "Validation error",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle service errors
    if (error instanceof FlashcardServiceError) {
      return json(
        {
          error: error.code,
          message: error.message,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error during flashcard listing:", error);
    return json(
      {
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
};
