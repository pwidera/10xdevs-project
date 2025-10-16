import { useState, useCallback } from 'react';
import { FlashcardRow } from './FlashcardRow';
import { ConfirmDialog } from './ConfirmDialog';
import { Alert } from '@/components/ui/alert';
import * as flashcardsApi from '@/lib/api/flashcards.api';
import { toast } from 'sonner';
import type { FlashcardsListProps } from '../types/flashcards.types';

/**
 * List of flashcards with loading, empty, and error states
 * Handles edit and delete operations
 */
export function FlashcardsList({
  items,
  isLoading,
  error,
  onUpdate,
  onRemove,
  disabled = false,
}: FlashcardsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Handle edit
  const handleEdit = useCallback(
    async (id: string, frontText: string, backText: string) => {
      try {
        // Optimistic update - set saving state
        onUpdate(id, { isSaving: true });

        await flashcardsApi.updateFlashcard(id, {
          front_text: frontText,
          back_text: backText,
        });

        // Update with new values
        onUpdate(id, {
          front_text: frontText,
          back_text: backText,
          draftFront: frontText,
          draftBack: backText,
          isSaving: false,
          isEditing: false,
        });

        toast.success('Fiszka została zaktualizowana');
      } catch (error) {
        console.error('Failed to update flashcard:', error);
        
        const errorMessage = flashcardsApi.getErrorMessage(error);
        toast.error(errorMessage);

        // Reset saving state
        onUpdate(id, { isSaving: false });
      }
    },
    [onUpdate]
  );

  // Handle delete confirmation
  const handleDeleteClick = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteId) return;

    try {
      setDeletingId(deleteId);

      await flashcardsApi.deleteFlashcard(deleteId);

      onRemove(deleteId);
      toast.success('Fiszka została usunięta');
    } catch (error) {
      console.error('Failed to delete flashcard:', error);
      
      const errorMessage = flashcardsApi.getErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
      setDeleteId(null);
    }
  }, [deleteId, onRemove]);

  // Loading state - skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-4 space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 bg-muted rounded" />
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-muted rounded" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <p className="font-medium">Błąd ładowania fiszek</p>
        <p className="text-sm mt-1">{error}</p>
      </Alert>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium">Brak fiszek</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Nie znaleziono żadnych fiszek spełniających kryteria wyszukiwania.
        </p>
      </div>
    );
  }

  // List of flashcards
  return (
    <>
      <div className="space-y-4">
        {items.map((flashcard) => (
          <FlashcardRow
            key={flashcard.id}
            flashcard={flashcard}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            disabled={disabled || deletingId === flashcard.id}
          />
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Usuń fiszkę"
        description="Czy na pewno chcesz usunąć tę fiszkę? Ta akcja jest nieodwracalna."
      />
    </>
  );
}

