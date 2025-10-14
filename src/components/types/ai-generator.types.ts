/**
 * Frontend ViewModel types for AI Generator
 */

export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

export type ProposalVM = {
  id: string;
  front_text: string;
  back_text: string;
  status: ProposalStatus;
  revealed: boolean;
};

export type AiGeneratorState = {
  // Form inputs
  sourceText: string;
  language: 'pl' | 'en' | null;
  maxProposals: number;
  
  // Validation
  charCount: number;
  isValid: boolean;
  
  // Generation state
  isGenerating: boolean;
  generationError?: string;
  
  // Session data
  session?: {
    id: string;
    created_at: string;
    proposals_count: number;
    source_text_length: number;
  };
  
  // Proposals
  proposals: ProposalVM[];
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  
  // Save state
  isSaving: boolean;
  saveError?: string;
};

export type AiGeneratorAction =
  | { type: 'SET_TEXT'; payload: string }
  | { type: 'SET_LANGUAGE'; payload: 'pl' | 'en' | null }
  | { type: 'SET_MAX_PROPOSALS'; payload: number }
  | { type: 'GENERATE_START' }
  | { type: 'GENERATE_SUCCESS'; payload: { session: AiGeneratorState['session']; proposals: Array<{ front_text: string; back_text: string }> } }
  | { type: 'GENERATE_FAILURE'; payload: string }
  | { type: 'ACCEPT_ONE'; payload: string }
  | { type: 'REJECT_ONE'; payload: string }
  | { type: 'BULK_ACCEPT_REMAINING' }
  | { type: 'BULK_REJECT_REMAINING' }
  | { type: 'TOGGLE_REVEAL'; payload: string }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS' }
  | { type: 'SAVE_FAILURE'; payload: string }
  | { type: 'RESET' };

