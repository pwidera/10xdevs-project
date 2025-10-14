import { BulkActionBar } from './BulkActionBar';
import { ProposalList } from './ProposalList';
import { SaveSelectedBar } from './SaveSelectedBar';
import type { ProposalVM } from '../types/ai-generator.types';

type ProposalsSectionProps = {
  proposals: ProposalVM[];
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  isSaving: boolean;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRevealToggle: (id: string) => void;
  onBulkAccept: () => void;
  onBulkReject: () => void;
  onSaveSelected: () => void;
};

export function ProposalsSection({
  proposals,
  acceptedCount,
  rejectedCount,
  pendingCount,
  isSaving,
  onAccept,
  onReject,
  onRevealToggle,
  onBulkAccept,
  onBulkReject,
  onSaveSelected,
}: ProposalsSectionProps) {
  if (proposals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Propozycje fiszek</h2>
        
        <BulkActionBar
          pendingCount={pendingCount}
          acceptedCount={acceptedCount}
          rejectedCount={rejectedCount}
          onBulkAccept={onBulkAccept}
          onBulkReject={onBulkReject}
        />
      </div>

      <ProposalList
        proposals={proposals}
        onAccept={onAccept}
        onReject={onReject}
        onRevealToggle={onRevealToggle}
      />

      <SaveSelectedBar
        acceptedCount={acceptedCount}
        isSaving={isSaving}
        onSave={onSaveSelected}
      />
    </div>
  );
}

