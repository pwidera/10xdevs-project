import { useReducer, useCallback } from 'react';
import type { AiGeneratorState, AiGeneratorAction, ProposalVM } from '../types/ai-generator.types';

const MIN_CHARS = 100;
const MAX_CHARS = 10000;
const MIN_PROPOSALS = 1;
const MAX_PROPOSALS = 20;

function createInitialState(): AiGeneratorState {
  return {
    sourceText: '',
    language: null,
    maxProposals: 20,
    charCount: 0,
    isValid: false,
    isGenerating: false,
    proposals: [],
    acceptedCount: 0,
    rejectedCount: 0,
    pendingCount: 0,
    isSaving: false,
  };
}

function validateText(text: string): boolean {
  const length = text.length;
  return length >= MIN_CHARS && length <= MAX_CHARS;
}

function calculateCounts(proposals: ProposalVM[]) {
  return proposals.reduce(
    (acc, p) => {
      if (p.status === 'accepted') acc.accepted++;
      else if (p.status === 'rejected') acc.rejected++;
      else acc.pending++;
      return acc;
    },
    { accepted: 0, rejected: 0, pending: 0 }
  );
}

function aiGeneratorReducer(state: AiGeneratorState, action: AiGeneratorAction): AiGeneratorState {
  switch (action.type) {
    case 'SET_TEXT': {
      const charCount = action.payload.length;
      const isValid = validateText(action.payload);
      return {
        ...state,
        sourceText: action.payload,
        charCount,
        isValid,
      };
    }

    case 'SET_LANGUAGE': {
      return {
        ...state,
        language: action.payload,
      };
    }

    case 'SET_MAX_PROPOSALS': {
      const clamped = Math.max(MIN_PROPOSALS, Math.min(MAX_PROPOSALS, action.payload));
      return {
        ...state,
        maxProposals: clamped,
      };
    }

    case 'GENERATE_START': {
      return {
        ...state,
        isGenerating: true,
        generationError: undefined,
      };
    }

    case 'GENERATE_SUCCESS': {
      const proposals: ProposalVM[] = action.payload.proposals.map((p, idx) => ({
        id: `proposal-${Date.now()}-${idx}`,
        front_text: p.front_text,
        back_text: p.back_text,
        status: 'pending' as const,
        revealed: false,
      }));

      const counts = calculateCounts(proposals);

      return {
        ...state,
        isGenerating: false,
        session: action.payload.session,
        proposals,
        acceptedCount: counts.accepted,
        rejectedCount: counts.rejected,
        pendingCount: counts.pending,
        generationError: undefined,
      };
    }

    case 'GENERATE_FAILURE': {
      return {
        ...state,
        isGenerating: false,
        generationError: action.payload,
      };
    }

    case 'ACCEPT_ONE': {
      const proposals = state.proposals.map((p) =>
        p.id === action.payload && p.status === 'pending'
          ? { ...p, status: 'accepted' as const }
          : p
      );
      const counts = calculateCounts(proposals);

      return {
        ...state,
        proposals,
        acceptedCount: counts.accepted,
        rejectedCount: counts.rejected,
        pendingCount: counts.pending,
      };
    }

    case 'REJECT_ONE': {
      const proposals = state.proposals.map((p) =>
        p.id === action.payload && p.status === 'pending'
          ? { ...p, status: 'rejected' as const }
          : p
      );
      const counts = calculateCounts(proposals);

      return {
        ...state,
        proposals,
        acceptedCount: counts.accepted,
        rejectedCount: counts.rejected,
        pendingCount: counts.pending,
      };
    }

    case 'BULK_ACCEPT_REMAINING': {
      const proposals = state.proposals.map((p) =>
        p.status === 'pending' ? { ...p, status: 'accepted' as const } : p
      );
      const counts = calculateCounts(proposals);

      return {
        ...state,
        proposals,
        acceptedCount: counts.accepted,
        rejectedCount: counts.rejected,
        pendingCount: counts.pending,
      };
    }

    case 'BULK_REJECT_REMAINING': {
      const proposals = state.proposals.map((p) =>
        p.status === 'pending' ? { ...p, status: 'rejected' as const } : p
      );
      const counts = calculateCounts(proposals);

      return {
        ...state,
        proposals,
        acceptedCount: counts.accepted,
        rejectedCount: counts.rejected,
        pendingCount: counts.pending,
      };
    }

    case 'TOGGLE_REVEAL': {
      const proposals = state.proposals.map((p) =>
        p.id === action.payload ? { ...p, revealed: !p.revealed } : p
      );

      return {
        ...state,
        proposals,
      };
    }

    case 'SAVE_START': {
      return {
        ...state,
        isSaving: true,
        saveError: undefined,
      };
    }

    case 'SAVE_SUCCESS': {
      return {
        ...state,
        isSaving: false,
        acceptedCount: 0,
        saveError: undefined,
      };
    }

    case 'SAVE_FAILURE': {
      return {
        ...state,
        isSaving: false,
        saveError: action.payload,
      };
    }

    case 'RESET': {
      return createInitialState();
    }

    default:
      return state;
  }
}

export function useAiGenerator() {
  const [state, dispatch] = useReducer(aiGeneratorReducer, undefined, createInitialState);

  const setText = useCallback((text: string) => {
    dispatch({ type: 'SET_TEXT', payload: text });
  }, []);

  const setLanguage = useCallback((language: 'pl' | 'en' | null) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  }, []);

  const setMaxProposals = useCallback((max: number) => {
    dispatch({ type: 'SET_MAX_PROPOSALS', payload: max });
  }, []);

  const generateStart = useCallback(() => {
    dispatch({ type: 'GENERATE_START' });
  }, []);

  const generateSuccess = useCallback(
    (session: AiGeneratorState['session'], proposals: Array<{ front_text: string; back_text: string }>) => {
      dispatch({ type: 'GENERATE_SUCCESS', payload: { session, proposals } });
    },
    []
  );

  const generateFailure = useCallback((error: string) => {
    dispatch({ type: 'GENERATE_FAILURE', payload: error });
  }, []);

  const acceptOne = useCallback((id: string) => {
    dispatch({ type: 'ACCEPT_ONE', payload: id });
  }, []);

  const rejectOne = useCallback((id: string) => {
    dispatch({ type: 'REJECT_ONE', payload: id });
  }, []);

  const bulkAcceptRemaining = useCallback(() => {
    dispatch({ type: 'BULK_ACCEPT_REMAINING' });
  }, []);

  const bulkRejectRemaining = useCallback(() => {
    dispatch({ type: 'BULK_REJECT_REMAINING' });
  }, []);

  const toggleReveal = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_REVEAL', payload: id });
  }, []);

  const saveStart = useCallback(() => {
    dispatch({ type: 'SAVE_START' });
  }, []);

  const saveSuccess = useCallback(() => {
    dispatch({ type: 'SAVE_SUCCESS' });
  }, []);

  const saveFailure = useCallback((error: string) => {
    dispatch({ type: 'SAVE_FAILURE', payload: error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    actions: {
      setText,
      setLanguage,
      setMaxProposals,
      generateStart,
      generateSuccess,
      generateFailure,
      acceptOne,
      rejectOne,
      bulkAcceptRemaining,
      bulkRejectRemaining,
      toggleReveal,
      saveStart,
      saveSuccess,
      saveFailure,
      reset,
    },
  };
}

