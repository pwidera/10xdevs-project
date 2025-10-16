import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ConfirmDialogProps } from '../types/flashcards.types';

/**
 * Confirmation dialog for destructive actions (e.g., delete flashcard)
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Czy na pewno?',
  description = 'Ta akcja jest nieodwracalna.',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Anuluj
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
          >
            Potwierdź
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

