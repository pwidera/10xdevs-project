import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ORIGIN_LABELS } from '../types/flashcards.types';
import type { SelectOriginProps } from '../types/flashcards.types';
import type { FlashcardOrigin } from '../../types';

const ORIGIN_OPTIONS: FlashcardOrigin[] = ['manual', 'AI_full', 'AI_edited'];

/**
 * Select component for filtering flashcards by origin
 * Displays: Wszystkie, Ręczne, AI, AI (edytowane)
 */
export function SelectOrigin({
  value,
  onChange,
  disabled = false,
}: SelectOriginProps) {
  const handleValueChange = (newValue: string) => {
    if (newValue === 'all') {
      onChange(null);
    } else {
      onChange(newValue as FlashcardOrigin);
    }
  };

  return (
    <Select
      value={value ?? 'all'}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px]" aria-label="Filtruj po pochodzeniu">
        <SelectValue placeholder="Pochodzenie" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Wszystkie</SelectItem>
        {ORIGIN_OPTIONS.map((origin) => (
          <SelectItem key={origin} value={origin}>
            {ORIGIN_LABELS[origin]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

