import { Badge } from '@/components/ui/badge';
import { ORIGIN_LABELS } from '../types/flashcards.types';
import type { OriginBadgeProps } from '../types/flashcards.types';

/**
 * Visual badge for flashcard origin
 * - manual: neutral/outline
 * - AI_full: blue/default
 * - AI_edited: purple/secondary
 */
export function OriginBadge({ origin }: OriginBadgeProps) {
  const label = ORIGIN_LABELS[origin];

  // Determine variant and custom classes based on origin
  const getVariantAndClass = () => {
    switch (origin) {
      case 'manual':
        return {
          variant: 'outline' as const,
          className: 'border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-300',
        };
      case 'AI_full':
        return {
          variant: 'default' as const,
          className: 'bg-blue-500 text-white border-blue-500 dark:bg-blue-600 dark:border-blue-600',
        };
      case 'AI_edited':
        return {
          variant: 'secondary' as const,
          className: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
        };
      default:
        return {
          variant: 'outline' as const,
          className: '',
        };
    }
  };

  const { variant, className } = getVariantAndClass();

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

