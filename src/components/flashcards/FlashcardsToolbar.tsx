import { useCallback } from "react";
import { SearchInput } from "./SearchInput";
import { SelectOrigin } from "./SelectOrigin";
import { SelectSort } from "./SelectSort";
import type { FlashcardsToolbarProps } from "../types/flashcards.types";
import type { FlashcardOrigin, FlashcardSortOption } from "../../types";

/**
 * Toolbar for flashcards list filtering and sorting
 * Controls: search query, origin filter, sort order
 * Updates URL params and triggers refetch
 */
export function FlashcardsToolbar({ filters, onFiltersChange, disabled = false }: FlashcardsToolbarProps) {
  const handleSearchChange = useCallback(
    (q: string) => {
      // Reset to page 1 when search changes
      onFiltersChange({ q, page: 1 });
    },
    [onFiltersChange]
  );

  const handleOriginChange = useCallback(
    (origin: FlashcardOrigin | null) => {
      // Reset to page 1 when origin filter changes
      onFiltersChange({ origin, page: 1 });
    },
    [onFiltersChange]
  );

  const handleSortChange = useCallback(
    (sort: FlashcardSortOption) => {
      // Reset to page 1 when sort changes
      onFiltersChange({ sort, page: 1 });
    },
    [onFiltersChange]
  );

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 max-w-md">
        <SearchInput value={filters.q} onChange={handleSearchChange} disabled={disabled} debounceMs={400} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SelectOrigin value={filters.origin} onChange={handleOriginChange} disabled={disabled} />

        <SelectSort value={filters.sort} onChange={handleSortChange} disabled={disabled} />
      </div>
    </div>
  );
}
