import { useState, useEffect, useCallback } from "react";
import * as flashcardsApi from "@/lib/api/flashcards.api";
import type { FlashcardsFiltersVM, FlashcardsListVM, FlashcardRowVM } from "../types/flashcards.types";
import type { FlashcardDTO } from "../../types";

/**
 * Convert FlashcardDTO to FlashcardRowVM with editing state
 */
function toRowVM(dto: FlashcardDTO): FlashcardRowVM {
  return {
    ...dto,
    isEditing: false,
    draftFront: dto.front_text,
    draftBack: dto.back_text,
    isSaving: false,
  };
}

/**
 * Hook for fetching and managing flashcards list
 * Handles loading, error states, and automatic refetch on filter changes
 */
export function useFlashcardsQuery(filters: FlashcardsFiltersVM) {
  const [state, setState] = useState<FlashcardsListVM>({
    items: [],
    page: filters.page,
    page_size: filters.page_size,
    total: 0,
    isLoading: true,
    error: undefined,
  });

  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Fetch flashcards
  const fetchFlashcards = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const query = {
        page: filters.page,
        page_size: filters.page_size,
        q: filters.q || undefined,
        origin: filters.origin || undefined,
        sort: filters.sort,
      };

      const response = await flashcardsApi.getFlashcards(query);

      const items = response.items.map(toRowVM);

      setState({
        items,
        page: response.page,
        page_size: response.page_size,
        total: response.total,
        isLoading: false,
        error: undefined,
      });
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);

      const errorMessage = flashcardsApi.getErrorMessage(error);

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [filters]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards, refetchTrigger]);

  // Manual refetch function
  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  // Update single item in the list (after edit)
  const updateItem = useCallback((id: string, updates: Partial<FlashcardRowVM>) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  }, []);

  // Remove item from the list (after delete)
  const removeItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
      total: prev.total - 1,
    }));
  }, []);

  return {
    ...state,
    refetch,
    updateItem,
    removeItem,
  };
}
