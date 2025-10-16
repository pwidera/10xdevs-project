import { useId } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type LanguageSelectProps = {
  value: 'pl' | 'en' | null;
  onChange: (value: 'pl' | 'en' | null) => void;
  disabled?: boolean;
};

export function LanguageSelect({ value, onChange, disabled = false }: LanguageSelectProps) {
  const id = useId();

  const handleValueChange = (newValue: string) => {
    if (newValue === 'none') {
      onChange(null);
    } else if (newValue === 'pl' || newValue === 'en') {
      onChange(newValue);
    }
  };

  const selectValue = value === null ? 'none' : value;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Preferowany język</Label>
      
      <Select name="language" value={selectValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Wybierz język" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Automatycznie / Brak preferencji</SelectItem>
          <SelectItem value="pl">Polski</SelectItem>
          <SelectItem value="en">English</SelectItem>
        </SelectContent>
      </Select>

      <p className="text-xs text-muted-foreground">
        AI dostosuje język fiszek do wybranej preferencji
      </p>
    </div>
  );
}

