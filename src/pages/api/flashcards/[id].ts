/**
 * GET /api/flashcards/{id}
 * PUT /api/flashcards/{id}
 * DELETE /api/flashcards/{id}
 * 
 * Endpoints for individual flashcard operations:
 * - GET: Retrieve a single flashcard by ID
 * - PUT: Update flashcard content (front_text and/or back_text)
 * - DELETE: Permanently delete a flashcard
 * 
 * Features:
 * - Requires JWT authentication
 * - RLS ensures users can only access their own flashcards
 * - Validates UUID path parameter
 * - PUT validates at least one field is provided
 * - Origin may change AI_full → AI_edited (DB trigger on content change)
 * 
 * GET Response (200):
 * {
 *   id: string,
 *   front_text: string,
 *   back_text: string,
 *   origin: "manual" | "AI_full" | "AI_edited",
 *   last_reviewed_at: string | null,
 *   created_at: string,
 *   updated_at: string
 * }
 * 
 * PUT Request Body:
 * {
 *   front_text?: string (1-1000 chars),
 *   back_text?: string (1-1000 chars)
 * }
 * 
 * PUT Response (200):
 * {
 *   id: string,
 *   front_text: string,
 *   back_text: string,
 *   origin: "manual" | "AI_full" | "AI_edited",
 *   updated_at: string
 * }
 * 
 * DELETE Response (200):
 * {
 *   success: true
 * }
 * 
 * Response Codes:
 * - 200: Success
 * - 400: Validation error
 * - 401: Unauthorized
 * - 404: Flashcard not found
 * - 500: Internal server error
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';

import type { FlashcardDTO, UpdateFlashcardResponse, DeleteFlashcardResponse } from '@/types';
import { IdParamSchema, UpdateFlashcardSchema } from '@/lib/validation/flashcards.schema';
import {
  getById,
  update,
  deleteFlashcard,
  FlashcardServiceError,
} from '@/lib/services/flashcard.service';

// Disable prerendering for this API route
export const prerender = false;

/**
 * Helper function to create JSON responses
 */
function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

/**
 * GET handler for retrieving a single flashcard
 */
export const GET: APIRoute = async (context) => {
  // ============================================================================
  // STEP 1: Authentication check
  // ============================================================================

  if (!context.locals.user) {
    return json(
      {
        error: 'Unauthorized',
        message: 'Authentication required',
      },
      { status: 401 }
    );
  }

  const supabase = context.locals.supabase;

  // ============================================================================
  // STEP 2: Validate path parameter (ID)
  // ============================================================================

  const flashcardId = context.params.id;

  try {
    IdParamSchema.parse(flashcardId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        {
          error: 'Validation error',
          message: 'Invalid flashcard ID format',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }
  }

  // ============================================================================
  // STEP 3: Fetch flashcard
  // ============================================================================

  try {
    const flashcard: FlashcardDTO = await getById(supabase, flashcardId!);

    return json(flashcard, { status: 200 });
  } catch (error) {
    // Handle service errors
    if (error instanceof FlashcardServiceError) {
      return json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error during flashcard retrieval:', error);
    return json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
};

/**
 * PUT handler for updating a flashcard
 */
export const PUT: APIRoute = async (context) => {
  // ============================================================================
  // STEP 1: Authentication check
  // ============================================================================

  if (!context.locals.user) {
    return json(
      {
        error: 'Unauthorized',
        message: 'Authentication required',
      },
      { status: 401 }
    );
  }

  const supabase = context.locals.supabase;

  // ============================================================================
  // STEP 2: Validate path parameter (ID)
  // ============================================================================

  const flashcardId = context.params.id;

  try {
    IdParamSchema.parse(flashcardId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        {
          error: 'Validation error',
          message: 'Invalid flashcard ID format',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }
  }

  // ============================================================================
  // STEP 3: Parse and validate request body
  // ============================================================================

  let requestBody: unknown;

  try {
    requestBody = await context.request.json();
  } catch (error) {
    return json(
      {
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON',
      },
      { status: 400 }
    );
  }

  try {
    const validatedData = UpdateFlashcardSchema.parse(requestBody);

    // ============================================================================
    // STEP 4: Update flashcard
    // ============================================================================

    const updatedFlashcard: UpdateFlashcardResponse = await update(
      supabase,
      flashcardId!,
      validatedData
    );

    return json(updatedFlashcard, { status: 200 });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return json(
        {
          error: 'Validation error',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
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
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error during flashcard update:', error);
    return json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
};

/**
 * DELETE handler for deleting a flashcard
 */
export const DELETE: APIRoute = async (context) => {
  // ============================================================================
  // STEP 1: Authentication check
  // ============================================================================

  if (!context.locals.user) {
    return json(
      {
        error: 'Unauthorized',
        message: 'Authentication required',
      },
      { status: 401 }
    );
  }

  const supabase = context.locals.supabase;

  // ============================================================================
  // STEP 2: Validate path parameter (ID)
  // ============================================================================

  const flashcardId = context.params.id;

  try {
    IdParamSchema.parse(flashcardId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return json(
        {
          error: 'Validation error',
          message: 'Invalid flashcard ID format',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }
  }

  // ============================================================================
  // STEP 3: Delete flashcard
  // ============================================================================

  try {
    const result: DeleteFlashcardResponse = await deleteFlashcard(supabase, flashcardId!);

    return json(result, { status: 200 });
  } catch (error) {
    // Handle service errors
    if (error instanceof FlashcardServiceError) {
      return json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error during flashcard deletion:', error);
    return json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
};

