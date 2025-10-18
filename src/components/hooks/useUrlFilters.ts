import { useState, useEffect, useCallback } from "react";
import type { FlashcardsFiltersVM } from "../types/flashcards.types";
import type { FlashcardOrigin, FlashcardSortOption } from "../../types";
import { DEFAULT_PAGE_SIZE, MIN_PAGE_SIZE, MAX_PAGE_SIZE } from "../types/flashcards.types";

const VALID_ORIGINS: FlashcardOrigin[] = ["manual", "AI_full", "AI_edited"];
const VALID_SORTS: FlashcardSortOption[] = [
  "created_at_desc",
  "created_at_asc",
  "last_reviewed_at_asc",
  "last_reviewed_at_desc",
];

/**
 * Parse and validate origin from URL param
 */
function parseOrigin(value: string | null): FlashcardOrigin | null {
  if (!value) return null;
  return VALID_ORIGINS.includes(value as FlashcardOrigin) ? (value as FlashcardOrigin) : null;
}

/**
 * Parse and validate sort from URL param
 */
function parseSort(value: string | null): FlashcardSortOption {
  if (!value) return "created_at_desc";
  return VALID_SORTS.includes(value as FlashcardSortOption) ? (value as FlashcardSortOption) : "created_at_desc";
}

/**
 * Parse and validate page number
 */
function parsePage(value: string | null): number {
  const parsed = parseInt(value || "1", 10);
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

/**
 * Parse and validate page size
 */
function parsePageSize(value: string | null): number {
  const parsed = parseInt(value || String(DEFAULT_PAGE_SIZE), 10);
  if (isNaN(parsed)) return DEFAULT_PAGE_SIZE;
  return Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, parsed));
}

/**
 * Parse filters from URLSearchParams
 */
function parseFiltersFromUrl(searchParams: URLSearchParams): FlashcardsFiltersVM {
  return {
    q: searchParams.get("q") || "",
    origin: parseOrigin(searchParams.get("origin")),
    sort: parseSort(searchParams.get("sort")),
    page: parsePage(searchParams.get("page")),
    page_size: parsePageSize(searchParams.get("page_size")),
  };
}

/**
 * Build URLSearchParams from filters
 */
function buildUrlFromFilters(filters: FlashcardsFiltersVM): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.origin) {
    params.set("origin", filters.origin);
  }

  if (filters.sort !== "created_at_desc") {
    params.set("sort", filters.sort);
  }

  if (filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (filters.page_size !== DEFAULT_PAGE_SIZE) {
    params.set("page_size", String(filters.page_size));
  }

  return params;
}

/**
 * Hook for syncing flashcards filters with URL params
 * Provides two-way synchronization between state and URL
 */
export function useUrlFilters() {
  // Initialize from URL
  const [filters, setFilters] = useState<FlashcardsFiltersVM>(() => {
    if (typeof window === "undefined") {
      return {
        q: "",
        origin: null,
        sort: "created_at_desc",
        page: 1,
        page_size: DEFAULT_PAGE_SIZE,
      };
    }

    const searchParams = new URLSearchParams(window.location.search);
    return parseFiltersFromUrl(searchParams);
  });

  // Update URL when filters change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = buildUrlFromFilters(filters);
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;

    // Only update if URL actually changed
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (newUrl !== currentUrl) {
      window.history.replaceState({}, "", newUrl);
    }
  }, [filters]);

  // Listen to popstate (browser back/forward)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      setFilters(parseFiltersFromUrl(searchParams));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update filters (partial update)
  const updateFilters = useCallback((updates: Partial<FlashcardsFiltersVM>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    filters,
    updateFilters,
  };
}
