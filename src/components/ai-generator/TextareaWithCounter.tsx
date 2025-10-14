import { useId } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type TextareaWithCounterProps = {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function TextareaWithCounter({
  value,
  onChange,
  min = 100,
  max = 10000,
  label = 'Tekst źródłowy',
  placeholder = 'Wklej tutaj tekst, z którego chcesz wygenerować fiszki...',
  disabled = false,
}: TextareaWithCounterProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  const count = value.length;
  const isInvalid = count > 0 && (count < min || count > max);
  const isTooShort = count > 0 && count < min;
  const isTooLong = count > max;

  let errorMessage = '';
  if (isTooShort) {
    errorMessage = `Tekst jest za krótki. Minimum ${min} znaków (obecnie: ${count}).`;
  } else if (isTooLong) {
    errorMessage = `Tekst jest za długi. Maksimum ${max} znaków (obecnie: ${count}).`;
  }

  const counterColor = cn({
    'text-muted-foreground': !isInvalid,
    'text-destructive font-medium': isInvalid,
  });

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={isInvalid}
        aria-describedby={`${descriptionId} ${isInvalid ? errorId : ''}`}
        className="min-h-32 resize-y"
        rows={8}
      />

      <div className="flex items-center justify-between gap-4">
        <div id={descriptionId} className="text-xs text-muted-foreground">
          Wprowadź tekst o długości {min}–{max} znaków
        </div>
        
        <div className={cn('text-xs tabular-nums', counterColor)} aria-live="polite">
          {count} / {max}
        </div>
      </div>

      {isInvalid && (
        <div
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
          aria-live="assertive"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}

