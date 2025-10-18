import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function GenerateButton({ onClick, disabled = false, loading = false }: GenerateButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled || loading} className="w-full sm:w-auto" size="lg">
      {loading && <Loader2 className="animate-spin" />}
      {loading ? "Generowanie..." : "Generuj fiszki"}
    </Button>
  );
}
