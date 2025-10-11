/**
 * POST /api/ai/generate
 * 
 * Endpoint for generating flashcard proposals from source text using AI.
 * 
 * Features:
 * - Requires JWT authentication
 * - Validates input using Zod schema
 * - Generates up to 20 flashcard proposals via OpenRouter API
 * - Saves generation session metadata to database
 * - Returns proposals without persisting them
 * 
 * Request Body:
 * - source_text: string (100-10000 chars)
 * - language: 'pl' | 'en' | null
 * - max_proposals: number (1-20, default 20)
 * 
 * Response:
 * - 200: Success with proposals and session metadata
 * - 400: Validation error
 * - 401: Unauthorized
 * - 500: Internal server error
 * - 502: AI service error
 * - 504: AI service timeout
 */

import type { APIRoute } from 'astro';
import { z } from 'zod';

import type { GenerateFlashcardsResponse } from '../../../types';
import { GenerateFlashcardsSchema } from '../../../lib/validation/ai-generation.schema';
import {
  createAIGenerationService,
  OpenRouterError,
  OpenRouterTimeoutError
} from '../../../lib/services/ai-generation.service';
import { createGenerationSessionService } from '../../../lib/services/generation-session.service';

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST handler for flashcard generation
 */
export const POST: APIRoute = async (context) => {
  // ============================================================================
  // STEP 1: Parse and validate request body
  // ============================================================================
  
  let requestBody: unknown;
  
  try {
    requestBody = await context.request.json();
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON'
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  let validatedData: z.infer<typeof GenerateFlashcardsSchema>;

  try {
    validatedData = GenerateFlashcardsSchema.parse(requestBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Validation error',
        message: 'Invalid request data'
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // ============================================================================
  // STEP 2: Authenticate user
  // ============================================================================

  let userId: string;

  try {
    const { data: { user }, error } = await context.locals.supabase.auth.getUser();

    if (error || !user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing or invalid authentication token'
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    userId = user.id;
  } catch (error) {
    console.error('Authentication error:', error);
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication failed'
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // ============================================================================
  // STEP 3: Generate flashcard proposals using AI
  // ============================================================================

  const openRouterApiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!openRouterApiKey) {
    console.error('OPENROUTER_API_KEY is not configured');
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'AI service is not configured'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const aiService = createAIGenerationService(openRouterApiKey);

  let generationResult;

  try {
    generationResult = await aiService.generateFlashcards({
      sourceText: validatedData.source_text,
      language: validatedData.language,
      maxProposals: validatedData.max_proposals
    });
  } catch (error) {
    console.error('AI generation error:', error);

    if (error instanceof OpenRouterTimeoutError) {
      return new Response(
        JSON.stringify({
          error: 'Gateway timeout',
          message: 'AI service did not respond in time'
        }),
        { 
          status: 504,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (error instanceof OpenRouterError) {
      return new Response(
        JSON.stringify({
          error: 'Bad gateway',
          message: 'AI service temporarily unavailable'
        }),
        { 
          status: 502,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to generate flashcards'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // ============================================================================
  // STEP 4: Save generation session to database
  // ============================================================================

  const sessionService = createGenerationSessionService(context.locals.supabase);

  let generationSession;

  try {
    generationSession = await sessionService.createSession({
      userId,
      proposalsCount: generationResult.proposals.length,
      sourceTextLength: validatedData.source_text.length,
      sourceTextHash: generationResult.sourceTextHash,
      generateDuration: generationResult.duration
    });
  } catch (error) {
    console.error('Failed to save generation session:', error);
    
    // Note: We still return the proposals even if session save fails
    // This is a business decision - the user should get their results
    // but we log the error for monitoring
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to save generation session'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // ============================================================================
  // STEP 5: Return successful response
  // ============================================================================

  const response: GenerateFlashcardsResponse = {
    generation_session: generationSession,
    proposals: generationResult.proposals
  };

  return new Response(
    JSON.stringify(response),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

