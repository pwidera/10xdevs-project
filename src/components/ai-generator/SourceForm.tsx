import { TextareaWithCounter } from "./TextareaWithCounter";
import { LanguageSelect } from "./LanguageSelect";
import { NumberInput } from "./NumberInput";
import { GenerateButton } from "./GenerateButton";
import { LossInfoBanner } from "./LossInfoBanner";

interface SourceFormProps {
  sourceText: string;
  language: "pl" | "en" | null;
  maxProposals: number;
  charCount: number;
  isValid: boolean;
  isGenerating: boolean;
  hasProposals: boolean;
  onTextChange: (text: string) => void;
  onLanguageChange: (language: "pl" | "en" | null) => void;
  onMaxProposalsChange: (max: number) => void;
  onSubmit: () => void;
}

export function SourceForm({
  sourceText,
  language,
  maxProposals,
  isValid,
  isGenerating,
  hasProposals,
  onTextChange,
  onLanguageChange,
  onMaxProposalsChange,
  onSubmit,
}: SourceFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && !isGenerating) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <TextareaWithCounter value={sourceText} onChange={onTextChange} min={100} max={10000} disabled={isGenerating} />

        <div className="grid gap-4 sm:grid-cols-2">
          <LanguageSelect value={language} onChange={onLanguageChange} disabled={isGenerating} />

          <NumberInput value={maxProposals} onChange={onMaxProposalsChange} min={1} max={20} disabled={isGenerating} />
        </div>
      </div>

      <GenerateButton onClick={onSubmit} disabled={!isValid || isGenerating} loading={isGenerating} />

      {hasProposals && <LossInfoBanner visible={true} />}
    </form>
  );
}
