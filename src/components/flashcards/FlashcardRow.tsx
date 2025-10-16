import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { OriginBadge } from './OriginBadge';
import {
  FLASHCARD_TEXT_MIN_LENGTH,
  FLASHCARD_TEXT_MAX_LENGTH,
} from '../types/flashcards.types';
import type { FlashcardRowProps } from '../types/flashcards.types';

/**
 * Single flashcard row with inline editing
 * Supports view/edit modes, keyboard shortcuts (Enter/Esc)
 */
export function FlashcardRow({
  flashcard,
  onEdit,
  onDelete,
  disabled = false,
}: FlashcardRowProps) {
  const [isEditing, setIsEditing] = useState(flashcard.isEditing);
  const [draftFront, setDraftFront] = useState(flashcard.draftFront);
  const [draftBack, setDraftBack] = useState(flashcard.draftBack);
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

  const frontRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);

  // Validate field
  const validateField = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    
    if (trimmed.length < FLASHCARD_TEXT_MIN_LENGTH) {
      return 'Pole nie może być puste.';
    }
    
    if (trimmed.length > FLASHCARD_TEXT_MAX_LENGTH) {
      return `Maksymalnie ${FLASHCARD_TEXT_MAX_LENGTH} znaków.`;
    }
    
    return undefined;
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const frontError = validateField(draftFront);
    const backError = validateField(draftBack);

    setErrors({
      front: frontError,
      back: backError,
    });

    return !frontError && !backError;
  }, [draftFront, draftBack, validateField]);

  // Enter edit mode
  const handleEditClick = useCallback(() => {
    setIsEditing(true);
    setDraftFront(flashcard.front_text);
    setDraftBack(flashcard.back_text);
    setErrors({});
  }, [flashcard]);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    const trimmedFront = draftFront.trim();
    const trimmedBack = draftBack.trim();

    // Check if anything changed
    if (trimmedFront === flashcard.front_text && trimmedBack === flashcard.back_text) {
      setIsEditing(false);
      return;
    }

    await onEdit(flashcard.id, trimmedFront, trimmedBack);
    setIsEditing(false);
  }, [flashcard, draftFront, draftBack, onEdit, validateForm]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setDraftFront(flashcard.front_text);
    setDraftBack(flashcard.back_text);
    setErrors({});
  }, [flashcard]);

  // Handle delete
  const handleDelete = useCallback(() => {
    onDelete(flashcard.id);
  }, [flashcard.id, onDelete]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave]
  );

  // Focus front field when entering edit mode
  useEffect(() => {
    if (isEditing && frontRef.current) {
      frontRef.current.focus();
    }
  }, [isEditing]);

  // Check if form is valid
  const frontCount = draftFront.trim().length;
  const backCount = draftBack.trim().length;
  const isValid =
    frontCount >= FLASHCARD_TEXT_MIN_LENGTH &&
    frontCount <= FLASHCARD_TEXT_MAX_LENGTH &&
    backCount >= FLASHCARD_TEXT_MIN_LENGTH &&
    backCount <= FLASHCARD_TEXT_MAX_LENGTH;

  const isSaving = flashcard.isSaving;
  const isDisabled = disabled || isSaving;

  if (isEditing) {
    // Edit mode
    return (
      <div className="rounded-lg border bg-card p-4 space-y-4" onKeyDown={handleKeyDown}>
        <div className="flex items-center justify-between">
          <OriginBadge origin={flashcard.origin} />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isDisabled}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isDisabled || !isValid}
            >
              {isSaving ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Przód</span>
              <span
                className={`text-xs ${
                  frontCount > FLASHCARD_TEXT_MAX_LENGTH
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {frontCount} / {FLASHCARD_TEXT_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              ref={frontRef}
              value={draftFront}
              onChange={(e) => {
                setDraftFront(e.target.value);
                if (errors.front) setErrors((prev) => ({ ...prev, front: undefined }));
              }}
              disabled={isDisabled}
              className={`min-h-[80px] resize-y ${errors.front ? 'border-destructive' : ''}`}
              aria-invalid={!!errors.front}
            />
            {errors.front && <p className="text-xs text-destructive">{errors.front}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tył</span>
              <span
                className={`text-xs ${
                  backCount > FLASHCARD_TEXT_MAX_LENGTH
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {backCount} / {FLASHCARD_TEXT_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              ref={backRef}
              value={draftBack}
              onChange={(e) => {
                setDraftBack(e.target.value);
                if (errors.back) setErrors((prev) => ({ ...prev, back: undefined }));
              }}
              disabled={isDisabled}
              className={`min-h-[80px] resize-y ${errors.back ? 'border-destructive' : ''}`}
              aria-invalid={!!errors.back}
            />
            {errors.back && <p className="text-xs text-destructive">{errors.back}</p>}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Skróty: <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> anuluj,{' '}
          <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Enter</kbd> zapisz
        </p>
      </div>
    );
  }

  // View mode
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <OriginBadge origin={flashcard.origin} />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            disabled={isDisabled}
          >
            Edytuj
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDisabled}
          >
            Usuń
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <span className="text-sm font-medium text-muted-foreground">Przód:</span>
          <p className="mt-1 text-sm whitespace-pre-wrap break-words">{flashcard.front_text}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-muted-foreground">Tył:</span>
          <p className="mt-1 text-sm whitespace-pre-wrap break-words">{flashcard.back_text}</p>
        </div>
      </div>

      {flashcard.last_reviewed_at && (
        <p className="text-xs text-muted-foreground">
          Ostatnio przeglądane: {new Date(flashcard.last_reviewed_at).toLocaleDateString('pl-PL')}
        </p>
      )}
    </div>
  );
}

