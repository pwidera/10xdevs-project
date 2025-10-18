/**
 * POST /api/ai/accept
 *
 * Endpoint for accepting and persisting AI-generated flashcard proposals.
 *
 * Features:
 * - Requires JWT authentication
 * - Validates input using Zod schema
 * - Verifies generation session belongs to user
 * - Saves accepted proposals as flashcards with origin="AI_full"
 * - Updates accepted_count in generation session
 *
 * Request Body:
 * - generation_session_id: string (UUID)
 * - cards: array of flashcard proposals (1-20 items)
 *
 * Response:
 * - 201: Success with saved flashcards
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Session doesn't belong to user
 * - 409: Session not found or cancelled
 * - 422: Too many items (>20)
 * - 500: Internal server error
 */

import type { APIRoute } from "astro";
import { z } from "zod";

import type { AcceptProposalsResponse, FlashcardDTO } from "../../../types";
import { AcceptProposalsSchema } from "../../../lib/validation/ai-generation.schema";

// Disable prerendering for this API route
export const prerender = false;

export const POST: APIRoute = async (context) => {
  // ============================================================================
  // 1. PARSE REQUEST BODY
  // ============================================================================

  let requestBody: unknown;

  try {
    requestBody = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "Invalid JSON",
        message: "Request body must be valid JSON",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ============================================================================
  // 2. VALIDATE INPUT
  // ============================================================================

  let validatedData: z.infer<typeof AcceptProposalsSchema>;

  try {
    validatedData = AcceptProposalsSchema.parse(requestBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Validation error",
        message: "Invalid request data",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ============================================================================
  // 3. AUTHENTICATE USER
  // ============================================================================

  const supabase = context.locals.supabase;

  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Database client not available",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let userId: string;

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Invalid authentication token",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    userId = user.id;
  } catch (error) {
    console.error("Authentication error:", error);

    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication failed",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ============================================================================
  // 4. VERIFY SESSION OWNERSHIP
  // ============================================================================

  try {
    const { data: session, error: sessionError } = await supabase
      .from("generation_sessions")
      .select("id, user_id")
      .eq("id", validatedData.generation_session_id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Generation session not found or has been cancelled",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (session.user_id !== userId) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "This generation session does not belong to you",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Session verification error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to verify generation session",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ============================================================================
  // 5. SAVE FLASHCARDS
  // ============================================================================

  try {
    // Prepare flashcards for insertion
    const flashcardsToInsert = validatedData.cards.map((card) => ({
      user_id: userId,
      front_text: card.front_text,
      back_text: card.back_text,
      origin: "AI_full" as const,
      generation_session_id: validatedData.generation_session_id,
    }));

    // Insert flashcards
    const { data: savedFlashcards, error: insertError } = await supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select("id, front_text, back_text, origin, generation_session_id, last_reviewed_at, created_at, updated_at");

    if (insertError || !savedFlashcards) {
      console.error("Flashcard insertion error:", insertError);

      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: "Failed to save flashcards",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update accepted_count in generation session
    const { error: updateError } = await supabase
      .from("generation_sessions")
      .update({ accepted_count: savedFlashcards.length })
      .eq("id", validatedData.generation_session_id);

    if (updateError) {
      console.error("Session update error:", updateError);
      // Non-critical error, continue with response
    }

    // ============================================================================
    // 6. RETURN RESPONSE
    // ============================================================================

    const response: AcceptProposalsResponse = {
      saved_count: savedFlashcards.length,
      flashcards: savedFlashcards as FlashcardDTO[],
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error during flashcard save:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
