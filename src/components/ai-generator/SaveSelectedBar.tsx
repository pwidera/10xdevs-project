import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveSelectedBarProps {
  acceptedCount: number;
  isSaving: boolean;
  onSave: () => void;
}

export function SaveSelectedBar({ acceptedCount, isSaving, onSave }: SaveSelectedBarProps) {
  const canSave = acceptedCount > 0 && !isSaving;

  return (
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="text-sm text-muted-foreground">
          {acceptedCount === 0 ? (
            <span>Zaakceptuj propozycje, aby je zapisać</span>
          ) : (
            <span>
              Gotowe do zapisania:{" "}
              <span className="font-semibold text-foreground">
                {acceptedCount} {acceptedCount === 1 ? "fiszka" : acceptedCount < 5 ? "fiszki" : "fiszek"}
              </span>
            </span>
          )}
        </div>

        <Button
          onClick={onSave}
          disabled={!canSave}
          size="lg"
          className="w-full sm:w-auto min-w-[200px]"
          aria-label={`Zapisz ${acceptedCount} zaakceptowanych fiszek`}
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" />
              Zapisywanie...
            </>
          ) : (
            <>
              <Save />
              Zapisz wybrane ({acceptedCount})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
