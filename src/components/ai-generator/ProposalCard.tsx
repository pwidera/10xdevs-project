import { useEffect, useRef } from 'react';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ProposalVM } from '../types/ai-generator.types';

type ProposalCardProps = {
  proposal: ProposalVM;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRevealToggle: (id: string) => void;
  autoFocus?: boolean;
};

export function ProposalCard({
  proposal,
  onAccept,
  onReject,
  onRevealToggle,
  autoFocus = false,
}: ProposalCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && cardRef.current) {
      cardRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only handle keyboard shortcuts for pending proposals
    if (proposal.status !== 'pending') return;

    switch (e.key.toLowerCase()) {
      case 'a':
        e.preventDefault();
        onAccept(proposal.id);
        break;
      case 'r':
        e.preventDefault();
        onReject(proposal.id);
        break;
      case ' ':
      case 'enter':
        e.preventDefault();
        onRevealToggle(proposal.id);
        break;
    }
  };

  const isPending = proposal.status === 'pending';
  const isAccepted = proposal.status === 'accepted';
  const isRejected = proposal.status === 'rejected';

  const cardClassName = cn(
    'transition-all duration-200',
    {
      'border-2 border-green-500 bg-green-50 dark:bg-green-950/20': isAccepted,
      'border-2 border-red-500 bg-red-50 dark:bg-red-950/20 opacity-60': isRejected,
      'hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring': isPending,
    }
  );

  return (
    <Card
      ref={cardRef}
      className={cardClassName}
      tabIndex={isPending ? 0 : -1}
      onKeyDown={handleKeyDown}
      role="article"
      aria-label={`Propozycja fiszki: ${proposal.front_text}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Przód</h3>
            <p className="text-base font-medium break-words">{proposal.front_text}</p>
          </div>
          
          {isAccepted && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 shrink-0">
              <Check className="size-5" />
              <span className="text-xs font-medium">Zaakceptowano</span>
            </div>
          )}
          
          {isRejected && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400 shrink-0">
              <X className="size-5" />
              <span className="text-xs font-medium">Odrzucono</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Tył</h3>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRevealToggle(proposal.id)}
              aria-pressed={proposal.revealed}
              aria-label={proposal.revealed ? 'Ukryj odpowiedź' : 'Pokaż odpowiedź'}
              className="h-7 gap-1.5"
            >
              {proposal.revealed ? (
                <>
                  <EyeOff className="size-4" />
                  <span className="text-xs">Ukryj</span>
                </>
              ) : (
                <>
                  <Eye className="size-4" />
                  <span className="text-xs">Pokaż</span>
                </>
              )}
            </Button>
          </div>

          {proposal.revealed && (
            <p className="text-base break-words animate-in fade-in duration-200">
              {proposal.back_text}
            </p>
          )}
        </div>
      </CardContent>

      {isPending && (
        <CardFooter className="flex gap-2 pt-3 border-t">
          <Button
            variant="default"
            size="sm"
            onClick={() => onAccept(proposal.id)}
            className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            aria-label="Zaakceptuj tę fiszkę (klawisz A)"
          >
            <Check className="size-4" />
            Akceptuj
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(proposal.id)}
            className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
            aria-label="Odrzuć tę fiszkę (klawisz R)"
          >
            <X className="size-4" />
            Odrzuć
          </Button>
        </CardFooter>
      )}

      {isPending && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground text-center">
            Skróty: <kbd className="px-1 py-0.5 bg-muted rounded text-xs">A</kbd> akceptuj,{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">R</kbd> odrzuć,{' '}
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Spacja</kbd> pokaż/ukryj
          </p>
        </div>
      )}
    </Card>
  );
}

