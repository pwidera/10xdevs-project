/**
 * Flashcards API Client (Frontend)
 * 
 * This module provides type-safe API client methods for the flashcards feature.
 * Used by React components to communicate with backend endpoints.
 */

import type {
  FlashcardsListQuery,
  FlashcardsListResponse,
  CreateFlashcardCommand,
  CreateFlashcardsResponse,
  UpdateFlashcardCommand,
  UpdateFlashcardResponse,
  DeleteFlashcardResponse,
} from '../../types';

// Import error classes from ai-generator.api.ts
import {
  ApiError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  UnprocessableEntityError,
  ServerError,
} from './ai-generator.api';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorData: any;
    
    if (isJson) {
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
    } else {
      errorData = { message: response.statusText };
    }

    const message = errorData.message || errorData.error || 'Request failed';
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
      case 422:
        throw new UnprocessableEntityError(message);
      case 500:
        throw new ServerError(message);
      default:
        throw new ApiError(message, response.status, details);
    }
  }

  if (isJson) {
    return await response.json();
  }

  throw new Error('Expected JSON response');
}

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// ============================================================================
// API CLIENT METHODS
// ============================================================================

/**
 * Get paginated list of flashcards with optional filters
 * 
 * @param query - Query parameters for filtering and pagination
 * @returns Paginated list of flashcards
 * @throws {ValidationError} When query parameters are invalid
 * @throws {UnauthorizedError} When user is not authenticated
 * @throws {ServerError} When server error occurs
 */
export async function getFlashcards(
  query: FlashcardsListQuery = {}
): Promise<FlashcardsListResponse> {
  const queryString = buildQueryString(query);
  
  const response = await fetch(`/api/flashcards${queryString}`, {
    method: 'GET',
    credentials: 'same-origin',
  });

  return handleResponse<FlashcardsListResponse>(response);
}

/**
 * Create a new flashcard manually
 * 
 * @param command - Flashcard data
 * @returns Created flashcard(s)
 * @throws {ValidationError} When input validation fails
 * @throws {UnauthorizedError} When user is not authenticated
 * @throws {ServerError} When server error occurs
 */
export async function createFlashcard(
  command: CreateFlashcardCommand
): Promise<CreateFlashcardsResponse> {
  const response = await fetch('/api/flashcards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    credentials: 'same-origin',
  });

  return handleResponse<CreateFlashcardsResponse>(response);
}

/**
 * Update an existing flashcard
 * 
 * @param id - Flashcard ID
 * @param command - Update data
 * @returns Updated flashcard
 * @throws {ValidationError} When input validation fails
 * @throws {UnauthorizedError} When user is not authenticated
 * @throws {ForbiddenError} When user doesn't own the flashcard
 * @throws {NotFoundError} When flashcard doesn't exist
 * @throws {ServerError} When server error occurs
 */
export async function updateFlashcard(
  id: string,
  command: UpdateFlashcardCommand
): Promise<UpdateFlashcardResponse> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
    credentials: 'same-origin',
  });

  return handleResponse<UpdateFlashcardResponse>(response);
}

/**
 * Delete a flashcard
 * 
 * @param id - Flashcard ID
 * @returns Deletion confirmation
 * @throws {UnauthorizedError} When user is not authenticated
 * @throws {ForbiddenError} When user doesn't own the flashcard
 * @throws {NotFoundError} When flashcard doesn't exist
 * @throws {ServerError} When server error occurs
 */
export async function deleteFlashcard(
  id: string
): Promise<DeleteFlashcardResponse> {
  const response = await fetch(`/api/flashcards/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  return handleResponse<DeleteFlashcardResponse>(response);
}

// ============================================================================
// ERROR MESSAGE HELPERS
// ============================================================================

/**
 * Get user-friendly error message for display
 * 
 * @param error - Error object
 * @returns User-friendly error message in Polish
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return 'Dane są nieprawidłowe. Sprawdź formularz i spróbuj ponownie.';
  }
  
  if (error instanceof UnauthorizedError) {
    return 'Musisz być zalogowany, aby kontynuować.';
  }
  
  if (error instanceof ForbiddenError) {
    return 'Nie masz dostępu do tej fiszki.';
  }
  
  if (error instanceof NotFoundError) {
    return 'Fiszka nie istnieje lub została usunięta.';
  }
  
  if (error instanceof UnprocessableEntityError) {
    return 'Nie można przetworzyć żądania. Sprawdź dane i spróbuj ponownie.';
  }
  
  if (error instanceof ServerError) {
    return 'Wystąpił błąd serwera. Spróbuj ponownie później.';
  }
  
  if (error instanceof ApiError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.';
}

