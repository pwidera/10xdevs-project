import { CheckCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  onBulkAccept: () => void;
  onBulkReject: () => void;
}

export function BulkActionBar({
  pendingCount,
  acceptedCount,
  rejectedCount,
  onBulkAccept,
  onBulkReject,
}: BulkActionBarProps) {
  const hasPending = pendingCount > 0;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Status propozycji:</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-full bg-yellow-500" aria-hidden="true" />
          <span className="text-muted-foreground">
            Oczekujące: <span className="font-medium text-foreground">{pendingCount}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-full bg-green-500" aria-hidden="true" />
          <span className="text-muted-foreground">
            Zaakceptowane: <span className="font-medium text-foreground">{acceptedCount}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-muted-foreground">
            Odrzucone: <span className="font-medium text-foreground">{rejectedCount}</span>
          </span>
        </div>
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkAccept}
          disabled={!hasPending}
          className="flex-1 sm:flex-initial border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/20"
          aria-label={`Zatwierdź wszystkie pozostałe propozycje (${pendingCount})`}
        >
          <CheckCheck className="size-4" />
          Zatwierdź pozostałe
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onBulkReject}
          disabled={!hasPending}
          className="flex-1 sm:flex-initial border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
          aria-label={`Odrzuć wszystkie pozostałe propozycje (${pendingCount})`}
        >
          <XCircle className="size-4" />
          Odrzuć pozostałe
        </Button>
      </div>
    </div>
  );
}
