/**
 * Validation schemas for flashcard management endpoints
 * 
 * This file contains Zod schemas for validating input data
 * for flashcard CRUD operations.
 */

import { z } from 'zod';

/**
 * Schema for validating individual flashcard creation
 * 
 * Validation rules:
 * - front_text: 1-1000 characters (trimmed)
 * - back_text: 1-1000 characters (trimmed)
 * - origin: optional, must be 'manual', 'AI_full', or 'AI_edited'
 * - generation_session_id: optional UUID
 * 
 * Business rules enforced at service layer:
 * - If origin is 'AI_full' or 'AI_edited', generation_session_id is REQUIRED
 * - If origin is 'manual', generation_session_id MUST be null
 */
export const CreateFlashcardSchema = z.object({
  front_text: z
    .string()
    .trim()
    .min(1, 'front_text must not be empty')
    .max(1000, 'front_text must not exceed 1000 characters'),
  back_text: z
    .string()
    .trim()
    .min(1, 'back_text must not be empty')
    .max(1000, 'back_text must not exceed 1000 characters'),
  origin: z
    .enum(['manual', 'AI_full', 'AI_edited'])
    .optional(),
  generation_session_id: z
    .string()
    .uuid('generation_session_id must be a valid UUID')
    .optional()
    .nullable(),
});

/**
 * Inferred TypeScript type from the schema
 */
export type CreateFlashcardInput = z.infer<typeof CreateFlashcardSchema>;

/**
 * Schema for validating batch flashcard creation
 * 
 * Validation rules:
 * - Must be an array of 1-20 flashcard objects
 * - Each item follows CreateFlashcardSchema rules
 * - Batch operations are transactional (all-or-nothing)
 */
export const CreateFlashcardsBatchSchema = z
  .array(CreateFlashcardSchema)
  .min(1, 'Batch must contain at least 1 flashcard')
  .max(20, 'Batch must not exceed 20 flashcards');

/**
 * Inferred TypeScript type from the schema
 */
export type CreateFlashcardsBatchInput = z.infer<typeof CreateFlashcardsBatchSchema>;

/**
 * Schema for validating flashcard update
 * 
 * Validation rules:
 * - At least one field must be provided
 * - front_text: 1-1000 characters (trimmed) if provided
 * - back_text: 1-1000 characters (trimmed) if provided
 * 
 * Note: user_id, generation_session_id, and origin are immutable
 * Origin can only transition AI_full → AI_edited (handled by DB trigger)
 */
export const UpdateFlashcardSchema = z
  .object({
    front_text: z
      .string()
      .trim()
      .min(1, 'front_text must not be empty')
      .max(1000, 'front_text must not exceed 1000 characters')
      .optional(),
    back_text: z
      .string()
      .trim()
      .min(1, 'back_text must not be empty')
      .max(1000, 'back_text must not exceed 1000 characters')
      .optional(),
  })
  .refine(
    (data) => data.front_text !== undefined || data.back_text !== undefined,
    {
      message: 'At least one field (front_text or back_text) must be provided',
    }
  );

/**
 * Inferred TypeScript type from the schema
 */
export type UpdateFlashcardInput = z.infer<typeof UpdateFlashcardSchema>;

/**
 * Schema for validating UUID path parameter
 */
export const IdParamSchema = z.string().uuid('ID must be a valid UUID');

/**
 * Schema for validating flashcard list query parameters
 * 
 * Validation rules:
 * - page: integer >= 1, defaults to 1
 * - page_size: integer 1-100, defaults to 20
 * - q: optional search string (ILIKE on front_text and back_text)
 * - origin: optional filter by flashcard origin
 * - sort: optional sort order, defaults to 'created_at_desc'
 */
export const FlashcardsListQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(
      z
        .number()
        .int('page must be an integer')
        .min(1, 'page must be at least 1')
    ),
  page_size: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(
      z
        .number()
        .int('page_size must be an integer')
        .min(1, 'page_size must be at least 1')
        .max(100, 'page_size must not exceed 100')
    ),
  q: z
    .string()
    .trim()
    .optional(),
  origin: z
    .enum(['manual', 'AI_full', 'AI_edited'])
    .optional(),
  sort: z
    .enum(['created_at_desc', 'created_at_asc', 'last_reviewed_at_asc', 'last_reviewed_at_desc'])
    .optional()
    .default('created_at_desc'),
});

/**
 * Inferred TypeScript type from the schema
 */
export type FlashcardsListQueryInput = z.infer<typeof FlashcardsListQuerySchema>;

