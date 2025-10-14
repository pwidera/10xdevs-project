/**
 * Validation schemas for AI flashcard generation endpoints
 * 
 * This file contains Zod schemas for validating input data
 * for AI-powered flashcard generation features.
 */

import { z } from 'zod';

/**
 * Schema for validating flashcard generation request
 * 
 * Validation rules:
 * - source_text: 100-10000 characters (trimmed)
 * - language: must be 'pl', 'en', or null
 * - max_proposals: 1-20, defaults to 20
 */
export const GenerateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .trim()
    .min(100, 'source_text must be at least 100 characters')
    .max(10000, 'source_text must not exceed 10000 characters'),
  language: z
    .enum(['pl', 'en'])
    .nullable(),
  max_proposals: z
    .number()
    .int('max_proposals must be an integer')
    .min(1, 'max_proposals must be at least 1')
    .max(20, 'max_proposals must not exceed 20')
    .default(20)
});

/**
 * Inferred TypeScript type from the schema
 */
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsSchema>;

/**
 * Schema for validating individual flashcard proposal
 *
 * Validation rules:
 * - front_text: 1-1000 characters (trimmed)
 * - back_text: 1-1000 characters (trimmed)
 */
export const FlashcardProposalSchema = z.object({
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
});

/**
 * Schema for validating accept proposals request
 *
 * Validation rules:
 * - generation_session_id: must be a valid UUID
 * - cards: array of 1-20 flashcard proposals
 */
export const AcceptProposalsSchema = z.object({
  generation_session_id: z
    .string()
    .uuid('generation_session_id must be a valid UUID'),
  cards: z
    .array(FlashcardProposalSchema)
    .min(1, 'cards must contain at least 1 item')
    .max(20, 'cards must not exceed 20 items'),
});

/**
 * Inferred TypeScript type from the schema
 */
export type AcceptProposalsInput = z.infer<typeof AcceptProposalsSchema>;

