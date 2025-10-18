import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FLASHCARD_TEXT_MIN_LENGTH, FLASHCARD_TEXT_MAX_LENGTH } from "../types/flashcards.types";
import type { FlashcardFormProps } from "../types/flashcards.types";

/**
 * Form for creating or editing a flashcard
 * Includes front/back text fields with character counters and validation
 */
export function FlashcardForm({ onSubmit, disabled = false, initialFront = "", initialBack = "" }: FlashcardFormProps) {
  const [frontText, setFrontText] = useState(initialFront);
  const [backText, setBackText] = useState(initialBack);
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const frontRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);

  // Validate single field
  const validateField = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();

    if (trimmed.length < FLASHCARD_TEXT_MIN_LENGTH) {
      return "Pole nie może być puste.";
    }

    if (trimmed.length > FLASHCARD_TEXT_MAX_LENGTH) {
      return `Maksymalnie ${FLASHCARD_TEXT_MAX_LENGTH} znaków.`;
    }

    return undefined;
  }, []);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const frontError = validateField(frontText, "front");
    const backError = validateField(backText, "back");

    setErrors({
      front: frontError,
      back: backError,
    });

    return !frontError && !backError;
  }, [frontText, backText, validateField]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        // Focus first invalid field
        if (errors.front && frontRef.current) {
          frontRef.current.focus();
        } else if (errors.back && backRef.current) {
          backRef.current.focus();
        }
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit(frontText.trim(), backText.trim());

        // Reset form on success
        setFrontText("");
        setBackText("");
        setErrors({});
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [frontText, backText, validateForm, onSubmit, errors]
  );

  // Clear error when user starts typing
  const handleFrontChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setFrontText(e.target.value);
      if (errors.front) {
        setErrors((prev) => ({ ...prev, front: undefined }));
      }
    },
    [errors.front]
  );

  const handleBackChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setBackText(e.target.value);
      if (errors.back) {
        setErrors((prev) => ({ ...prev, back: undefined }));
      }
    },
    [errors.back]
  );

  // Calculate character counts
  const frontCount = frontText.trim().length;
  const backCount = backText.trim().length;

  // Check if form is valid
  const isValid =
    frontCount >= FLASHCARD_TEXT_MIN_LENGTH &&
    frontCount <= FLASHCARD_TEXT_MAX_LENGTH &&
    backCount >= FLASHCARD_TEXT_MIN_LENGTH &&
    backCount <= FLASHCARD_TEXT_MAX_LENGTH;

  const isDisabled = disabled || isSubmitting || !isValid;

  // Focus front field on mount
  useEffect(() => {
    if (frontRef.current) {
      frontRef.current.focus();
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Front text field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="front-text">
            Przód fiszki <span className="text-destructive">*</span>
          </Label>
          <span
            className={`text-sm ${
              frontCount > FLASHCARD_TEXT_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {frontCount} / {FLASHCARD_TEXT_MAX_LENGTH}
          </span>
        </div>

        <Textarea
          ref={frontRef}
          id="front-text"
          value={frontText}
          onChange={handleFrontChange}
          placeholder="Wpisz treść przodu fiszki..."
          disabled={disabled || isSubmitting}
          className={`min-h-[120px] resize-y ${errors.front ? "border-destructive" : ""}`}
          aria-invalid={!!errors.front}
          aria-describedby={errors.front ? "front-error" : undefined}
        />

        {errors.front && (
          <p id="front-error" className="text-sm text-destructive">
            {errors.front}
          </p>
        )}
      </div>

      {/* Back text field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="back-text">
            Tył fiszki <span className="text-destructive">*</span>
          </Label>
          <span
            className={`text-sm ${
              backCount > FLASHCARD_TEXT_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {backCount} / {FLASHCARD_TEXT_MAX_LENGTH}
          </span>
        </div>

        <Textarea
          ref={backRef}
          id="back-text"
          value={backText}
          onChange={handleBackChange}
          placeholder="Wpisz treść tyłu fiszki..."
          disabled={disabled || isSubmitting}
          className={`min-h-[120px] resize-y ${errors.back ? "border-destructive" : ""}`}
          aria-invalid={!!errors.back}
          aria-describedby={errors.back ? "back-error" : undefined}
        />

        {errors.back && (
          <p id="back-error" className="text-sm text-destructive">
            {errors.back}
          </p>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isDisabled} className="min-w-[120px]">
          {isSubmitting ? "Zapisywanie..." : "Zapisz fiszkę"}
        </Button>
      </div>
    </form>
  );
}
