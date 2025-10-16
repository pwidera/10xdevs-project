import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FlashcardsToolbar } from './flashcards/FlashcardsToolbar';
import { FlashcardsList } from './flashcards/FlashcardsList';
import { Pagination } from './flashcards/Pagination';
import { useUrlFilters } from './hooks/useUrlFilters';
import { useFlashcardsQuery } from './hooks/useFlashcardsQuery';

/**
 * Main flashcards page component
 * Integrates toolbar, list, and pagination
 */
export default function FlashcardsPage() {
  const { filters, updateFilters } = useUrlFilters();
  const { items, page, page_size, total, isLoading, error, updateItem, removeItem } =
    useFlashcardsQuery(filters);

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      updateFilters({ page: newPage });
    },
    [updateFilters]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      updateFilters({ page_size: newPageSize, page: 1 });
    },
    [updateFilters]
  );

  // Navigate to create page
  const handleCreateClick = () => {
    window.location.href = '/app/flashcards/new';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Moje fiszki</h1>
          <Button onClick={handleCreateClick}>
            <svg
              className="h-4 w-4 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Dodaj fiszkę
          </Button>
        </div>
        <p className="text-muted-foreground">
          Przeglądaj, edytuj i zarządzaj swoimi fiszkami
        </p>
      </div>

      {/* Toolbar - filters and sorting */}
      <div className="mb-6">
        <FlashcardsToolbar
          filters={filters}
          onFiltersChange={updateFilters}
          disabled={isLoading}
        />
      </div>

      {/* Flashcards list */}
      <div className="mb-6">
        <FlashcardsList
          items={items}
          isLoading={isLoading}
          error={error}
          onUpdate={updateItem}
          onRemove={removeItem}
        />
      </div>

      {/* Pagination */}
      {!isLoading && !error && total > 0 && (
        <Pagination
          page={page}
          pageSize={page_size}
          total={total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}

