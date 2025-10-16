/**
 * Flashcards View Models and Types (Frontend)
 * 
 * This file contains frontend-specific types for the flashcards feature.
 * These types extend the DTOs from src/types.ts with UI-specific state.
 */

import type {
  FlashcardDTO,
  FlashcardOrigin,
  FlashcardSortOption,
} from '../../types';

// ============================================================================
// VIEW MODELS
// ============================================================================

/**
 * Filters for flashcards list (synced with URL params)
 */
export type FlashcardsFiltersVM = {
  q: string;
  origin: FlashcardOrigin | null;
  sort: FlashcardSortOption;
  page: number;
  page_size: number;
};

/**
 * Single flashcard row with editing state
 */
export type FlashcardRowVM = FlashcardDTO & {
  isEditing: boolean;
  draftFront: string;
  draftBack: string;
  isSaving: boolean;
  error?: string;
};

/**
 * Complete flashcards list state
 */
export type FlashcardsListVM = {
  items: FlashcardRowVM[];
  page: number;
  page_size: number;
  total: number;
  isLoading: boolean;
  error?: string;
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props for SearchInput component
 */
export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  disabled?: boolean;
};

/**
 * Props for SelectOrigin component
 */
export type SelectOriginProps = {
  value: FlashcardOrigin | null;
  onChange: (value: FlashcardOrigin | null) => void;
  disabled?: boolean;
};

/**
 * Props for SelectSort component
 */
export type SelectSortProps = {
  value: FlashcardSortOption;
  onChange: (value: FlashcardSortOption) => void;
  disabled?: boolean;
};

/**
 * Props for FlashcardsToolbar component
 */
export type FlashcardsToolbarProps = {
  filters: FlashcardsFiltersVM;
  onFiltersChange: (filters: Partial<FlashcardsFiltersVM>) => void;
  disabled?: boolean;
};

/**
 * Props for FlashcardsList component
 */
export type FlashcardsListProps = {
  items: FlashcardRowVM[];
  isLoading: boolean;
  error?: string;
  onUpdate: (id: string, updates: Partial<FlashcardRowVM>) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
};

/**
 * Props for FlashcardRow component
 */
export type FlashcardRowProps = {
  flashcard: FlashcardRowVM;
  onEdit: (id: string, frontText: string, backText: string) => Promise<void>;
  onDelete: (id: string) => void;
  disabled?: boolean;
};

/**
 * Props for OriginBadge component
 */
export type OriginBadgeProps = {
  origin: FlashcardOrigin;
};

/**
 * Props for Pagination component
 */
export type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
};

/**
 * Props for ConfirmDialog component
 */
export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
};

/**
 * Props for FlashcardForm component
 */
export type FlashcardFormProps = {
  onSubmit: (frontText: string, backText: string) => Promise<void>;
  disabled?: boolean;
  initialFront?: string;
  initialBack?: string;
};

// ============================================================================
// CONSTANTS
// ============================================================================

export const FLASHCARD_TEXT_MIN_LENGTH = 1;
export const FLASHCARD_TEXT_MAX_LENGTH = 1000;
export const DEFAULT_PAGE_SIZE = 20;
export const MIN_PAGE_SIZE = 1;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/**
 * Origin display labels (Polish)
 */
export const ORIGIN_LABELS: Record<FlashcardOrigin, string> = {
  manual: 'Ręczne',
  AI_full: 'AI',
  AI_edited: 'AI (edytowane)',
};

/**
 * Sort option display labels (Polish)
 */
export const SORT_LABELS: Record<FlashcardSortOption, string> = {
  created_at_desc: 'Najnowsze',
  created_at_asc: 'Najstarsze',
  last_reviewed_at_asc: 'Najdawniej przeglądane',
  last_reviewed_at_desc: 'Ostatnio przeglądane',
};

