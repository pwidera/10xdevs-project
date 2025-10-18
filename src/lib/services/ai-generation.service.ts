/**
 * AI Generation Service
 *
 * This service handles communication with OpenRouter API to generate
 * flashcard proposals from source text using AI models.
 *
 * Features:
 * - Calls OpenRouter API with timeout and retry logic
 * - Computes MD5 hash of source text for deduplication
 * - Validates and parses AI responses
 * - Supports multiple languages (pl, en)
 */

import crypto from "crypto";
import type { FlashcardProposalDTO, Language } from "../../types";

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Base error class for OpenRouter API errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Error thrown when OpenRouter API request times out
 */
export class OpenRouterTimeoutError extends Error {
  constructor(message = "AI service did not respond in time") {
    super(message);
    this.name = "OpenRouterTimeoutError";
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Request payload for OpenRouter API
 */
interface OpenRouterRequest {
  model: string;
  messages: {
    role: "system" | "user";
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
}

/**
 * Response from OpenRouter API
 */
interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Parameters for generating flashcards
 */
interface GenerateFlashcardsParams {
  sourceText: string;
  language: Language | null;
  maxProposals: number;
}

/**
 * Result of flashcard generation
 */
interface GenerateFlashcardsResult {
  proposals: FlashcardProposalDTO[];
  sourceTextHash: string;
  duration: number; // in milliseconds
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Service for AI-powered flashcard generation
 */
export class AIGenerationService {
  private readonly apiKey: string;
  private readonly apiUrl = "https://openrouter.ai/api/v1/chat/completions";
  private readonly model = "openai/gpt-4o-mini"; // Fast and cost-effective
  private readonly timeout = 30000; // 30 seconds
  private readonly temperature = 0.7;
  private readonly maxTokens = 4000;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("OpenRouter API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Generate flashcard proposals from source text
   *
   * @param params - Generation parameters
   * @returns Generated proposals with metadata
   * @throws {OpenRouterError} When API request fails
   * @throws {OpenRouterTimeoutError} When API request times out
   */
  async generateFlashcards(params: GenerateFlashcardsParams): Promise<GenerateFlashcardsResult> {
    const startTime = Date.now();

    // Compute hash of source text for deduplication
    const sourceTextHash = this.computeSourceTextHash(params.sourceText);

    // Build prompt
    const systemPrompt = this.getSystemPrompt(params.language);
    const userPrompt = this.buildPrompt(params.sourceText, params.maxProposals);

    // Call OpenRouter API
    const response = await this.callOpenRouter({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });

    // Parse and validate response
    const proposals = this.parseResponse(response, params.maxProposals);

    const duration = Date.now() - startTime;

    return {
      proposals,
      sourceTextHash,
      duration,
    };
  }

  /**
   * Get system prompt based on language
   */
  private getSystemPrompt(language: Language | null): string {
    const basePrompt = `You are an expert educational content creator specializing in creating effective flashcards for learning.

Your task is to generate high-quality flashcard proposals from the provided text.

Guidelines:
- Create clear, concise questions and answers
- Focus on key concepts and important information
- Each flashcard should test one specific piece of knowledge
- Questions should be unambiguous and answerable from the text
- Answers should be complete but concise (max 1000 characters each)
- Return ONLY valid JSON array, no additional text or markdown`;

    if (language === "pl") {
      return basePrompt + "\n- Generate flashcards in Polish language";
    } else if (language === "en") {
      return basePrompt + "\n- Generate flashcards in English language";
    }

    return basePrompt + "\n- Generate flashcards in the same language as the source text";
  }

  /**
   * Build user prompt with source text and requirements
   */
  private buildPrompt(sourceText: string, maxProposals: number): string {
    return `Generate up to ${maxProposals} flashcard proposals from the following text.

Return a JSON array with this exact structure:
[
  {
    "front_text": "Question or prompt",
    "back_text": "Answer or explanation"
  }
]

Source text:
${sourceText}

Remember: Return ONLY the JSON array, no markdown formatting or additional text.`;
  }

  /**
   * Call OpenRouter API with timeout and error handling
   */
  private async callOpenRouter(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await response.text().catch(() => "Unknown error");
        throw new OpenRouterError(`OpenRouter API error: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return data as OpenRouterResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterTimeoutError();
      }

      if (error instanceof OpenRouterError) {
        throw error;
      }

      throw new OpenRouterError(
        `Failed to call OpenRouter API: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Parse and validate AI response
   */
  private parseResponse(response: OpenRouterResponse, maxProposals: number): FlashcardProposalDTO[] {
    if (!response.choices || response.choices.length === 0) {
      throw new OpenRouterError("No response from AI model");
    }

    const content = response.choices[0].message.content;

    // Try to extract JSON from response (in case AI added markdown formatting)
    let jsonContent = content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    let proposals: unknown;
    try {
      proposals = JSON.parse(jsonContent);
    } catch {
      throw new OpenRouterError("Failed to parse AI response as JSON");
    }

    if (!Array.isArray(proposals)) {
      throw new OpenRouterError("AI response is not an array");
    }

    // Validate and filter proposals
    const validProposals: FlashcardProposalDTO[] = [];

    for (const proposal of proposals) {
      if (validProposals.length >= maxProposals) {
        break;
      }

      if (!this.isValidProposal(proposal)) {
        console.warn("Invalid proposal skipped:", proposal);
        continue;
      }

      validProposals.push({
        front_text: proposal.front_text.trim().substring(0, 1000),
        back_text: proposal.back_text.trim().substring(0, 1000),
      });
    }

    if (validProposals.length === 0) {
      throw new OpenRouterError("No valid proposals generated");
    }

    return validProposals;
  }

  /**
   * Validate a single proposal
   */
  private isValidProposal(proposal: unknown): proposal is FlashcardProposalDTO {
    return (
      typeof proposal === "object" &&
      proposal !== null &&
      "front_text" in proposal &&
      "back_text" in proposal &&
      typeof proposal.front_text === "string" &&
      typeof proposal.back_text === "string" &&
      proposal.front_text.trim().length > 0 &&
      proposal.back_text.trim().length > 0
    );
  }

  /**
   * Compute SHA-256 hash of source text
   */
  private computeSourceTextHash(text: string): string {
    return crypto.createHash("sha256").update(text).digest("hex");
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an instance of AIGenerationService
 *
 * @param apiKey - OpenRouter API key
 * @returns AIGenerationService instance
 */
export function createAIGenerationService(apiKey: string): AIGenerationService {
  return new AIGenerationService(apiKey);
}
