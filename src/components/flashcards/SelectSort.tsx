import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SORT_LABELS } from '../types/flashcards.types';
import type { SelectSortProps } from '../types/flashcards.types';
import type { FlashcardSortOption } from '../../types';

const SORT_OPTIONS: FlashcardSortOption[] = [
  'created_at_desc',
  'created_at_asc',
  'last_reviewed_at_asc',
  'last_reviewed_at_desc',
];

/**
 * Select component for sorting flashcards
 * Options: Najnowsze, Najstarsze, Najdawniej przeglądane, Ostatnio przeglądane
 */
export function SelectSort({
  value,
  onChange,
  disabled = false,
}: SelectSortProps) {
  const handleValueChange = (newValue: string) => {
    onChange(newValue as FlashcardSortOption);
  };

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-[200px]" aria-label="Sortuj fiszki">
        <SelectValue placeholder="Sortowanie" />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option} value={option}>
            {SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

