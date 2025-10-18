import { ProposalCard } from "./ProposalCard";
import type { ProposalVM } from "../types/ai-generator.types";

interface ProposalListProps {
  proposals: ProposalVM[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRevealToggle: (id: string) => void;
}

export function ProposalList({ proposals, onAccept, onReject, onRevealToggle }: ProposalListProps) {
  if (proposals.length === 0) {
    return null;
  }

  return (
    <div
      className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      role="list"
      aria-label="Lista propozycji fiszek"
    >
      {proposals.map((proposal, index) => (
        <div key={proposal.id} role="listitem">
          <ProposalCard
            proposal={proposal}
            onAccept={onAccept}
            onReject={onReject}
            onRevealToggle={onRevealToggle}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={index === 0}
          />
        </div>
      ))}
    </div>
  );
}
