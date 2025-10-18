/**
 * AI Generator API Client (Frontend)
 *
 * This module provides type-safe API client methods for the AI generator feature.
 * Used by React components to communicate with backend endpoints.
 *
 * Separation of concerns:
 * - This file: Frontend API client (fetch calls to our endpoints)
 * - ai-generation.service.ts: Backend service (OpenRouter integration)
 */

import type {
  GenerateFlashcardsCommand,
  GenerateFlashcardsResponse,
  AcceptProposalsCommand,
  AcceptProposalsResponse,
} from "../../types";

// ============================================================================
// ERROR TYPES
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(message, 409);
    this.name = "ConflictError";
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(message = "Unprocessable entity") {
    super(message, 422);
    this.name = "UnprocessableEntityError";
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429);
    this.name = "RateLimitError";
  }
}

export class ServerError extends ApiError {
  constructor(message = "Internal server error") {
    super(message, 500);
    this.name = "ServerError";
  }
}

export class BadGatewayError extends ApiError {
  constructor(message = "Bad gateway") {
    super(message, 502);
    this.name = "BadGatewayError";
  }
}

export class GatewayTimeoutError extends ApiError {
  constructor(message = "Gateway timeout") {
    super(message, 504);
    this.name = "GatewayTimeoutError";
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    let errorData: { message?: string; error?: string };

    if (isJson) {
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
    } else {
      errorData = { message: response.statusText };
    }

    const message = errorData.message || errorData.error || "Request failed";
    const details = errorData.details;

    switch (response.status) {
      case 400:
        throw new ValidationError(message, details);
      case 401:
        throw new UnauthorizedError(message);
      case 403:
        throw new ForbiddenError(message);
      case 404:
        throw new NotFoundError(message);
      case 409:
        throw new ConflictError(message);
      case 422:
        throw new UnprocessableEntityError(message);
      case 429:
        throw new RateLimitError(message);
      case 500:
        throw new ServerError(message);
      case 502:
        throw new BadGatewayError(message);
      case 504:
        throw new GatewayTimeoutError(message);
      default:
        throw new ApiError(message, response.status, details);
    }
  }

  if (isJson) {
    return await response.json();
  }

  throw new Error("Expected JSON response");
}

// ============================================================================
// API CLIENT METHODS
// ============================================================================

/**
 * Generate flashcard proposals from source text
 *
 * @param command - Generation parameters
 * @returns Generated proposals and session metadata
 * @throws {ValidationError} When input validation fails
 * @throws {UnauthorizedError} When user is not authenticated
 * @throws {RateLimitError} When rate limit is exceeded
 * @throws {BadGatewayError} When AI service is unavailable
 * @throws {GatewayTimeoutError} When AI service times out
 * @throws {ServerError} When server error occurs
 */
export async function generateFlashcards(command: GenerateFlashcardsCommand): Promise<GenerateFlashcardsResponse> {
  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    credentials: "same-origin",
  });

  return handleResponse<GenerateFlashcardsResponse>(response);
}

/**
 * Accept and persist AI-generated proposals as flashcards
 *
 * @param command - Acceptance parameters with session ID and selected cards
 * @returns Saved flashcards and count
 * @throws {ValidationError} When input validation fails
 * @throws {UnauthorizedError} When user is not authenticated
 * @throws {ForbiddenError} When session doesn't belong to user
 * @throws {ConflictError} When session is not found or cancelled
 * @throws {UnprocessableEntityError} When too many cards (>20)
 * @throws {ServerError} When server error occurs
 */
export async function acceptProposals(command: AcceptProposalsCommand): Promise<AcceptProposalsResponse> {
  const response = await fetch("/api/ai/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    credentials: "same-origin",
  });

  return handleResponse<AcceptProposalsResponse>(response);
}

/**
 * Get user-friendly error message for display
 *
 * @param error - Error object
 * @returns User-friendly error message in Polish
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return "Dane wejściowe są nieprawidłowe. Sprawdź formularz i spróbuj ponownie.";
  }

  if (error instanceof UnauthorizedError) {
    return "Musisz być zalogowany, aby korzystać z tej funkcji.";
  }

  if (error instanceof ForbiddenError) {
    return "Nie masz uprawnień do wykonania tej operacji.";
  }

  if (error instanceof ConflictError) {
    return "Sesja generowania nie została znaleziona lub została anulowana. Wygeneruj nowe propozycje.";
  }

  if (error instanceof UnprocessableEntityError) {
    return "Zbyt wiele fiszek do zapisania (maksymalnie 20).";
  }

  if (error instanceof RateLimitError) {
    return "Przekroczono limit żądań. Spróbuj ponownie za chwilę.";
  }

  if (error instanceof BadGatewayError) {
    return "Usługa AI jest tymczasowo niedostępna. Spróbuj ponownie za chwilę.";
  }

  if (error instanceof GatewayTimeoutError) {
    return "Usługa AI nie odpowiedziała w wymaganym czasie. Spróbuj ponownie.";
  }

  if (error instanceof ServerError) {
    return "Wystąpił błąd serwera. Spróbuj ponownie później.";
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
}
