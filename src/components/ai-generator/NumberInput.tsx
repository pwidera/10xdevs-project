import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type NumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  disabled?: boolean;
};

export function NumberInput({
  value,
  onChange,
  min = 1,
  max = 20,
  label = 'Liczba propozycji',
  disabled = false,
}: NumberInputProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    // Clamp value on blur
    const clamped = Math.max(min, Math.min(max, value));
    if (clamped !== value) {
      onChange(clamped);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      
      <Input
        id={id}
        name="maxProposals"
        type="number"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        disabled={disabled}
        aria-describedby={descriptionId}
        className="w-full"
      />

      <p id={descriptionId} className="text-xs text-muted-foreground">
        Wybierz liczbę fiszek do wygenerowania ({min}–{max})
      </p>
    </div>
  );
}

