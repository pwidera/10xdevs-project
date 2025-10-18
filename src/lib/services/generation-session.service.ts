/**
 * Generation Session Service
 *
 * This service handles creation and management of generation sessions
 * in the database. Generation sessions track metadata about AI flashcard
 * generation requests for telemetry and audit purposes.
 *
 * Features:
 * - Creates session records in generation_sessions table
 * - Tracks proposals count, source text metrics, and generation duration
 * - Automatically associates sessions with authenticated users via RLS
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { GenerationSessionSummaryDTO } from "../../types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Parameters for creating a generation session
 */
export interface CreateGenerationSessionParams {
  userId: string;
  proposalsCount: number;
  sourceTextLength: number;
  sourceTextHash: string;
  generateDuration?: number; // in milliseconds
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Service for managing generation sessions
 */
export class GenerationSessionService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Create a new generation session record
   *
   * @param params - Session creation parameters
   * @returns Created session summary
   * @throws {Error} When database operation fails
   */
  async createSession(params: CreateGenerationSessionParams): Promise<GenerationSessionSummaryDTO> {
    const { data, error } = await this.supabase
      .from("generation_sessions")
      .insert({
        user_id: params.userId,
        proposals_count: params.proposalsCount,
        source_text_length: params.sourceTextLength,
        source_text_hash: params.sourceTextHash,
        generate_duration: params.generateDuration,
        accepted_count: 0, // Initially no proposals are accepted
      })
      .select("id, proposals_count, source_text_length, created_at")
      .single();

    if (error) {
      console.error("Failed to create generation session:", error);
      throw new Error("Failed to save generation session");
    }

    if (!data) {
      throw new Error("No data returned from generation session creation");
    }

    return data;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an instance of GenerationSessionService
 *
 * @param supabase - Supabase client instance
 * @returns GenerationSessionService instance
 */
export function createGenerationSessionService(supabase: SupabaseClient): GenerationSessionService {
  return new GenerationSessionService(supabase);
}
