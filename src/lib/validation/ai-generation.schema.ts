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

