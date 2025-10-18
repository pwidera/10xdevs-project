import { useCallback } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { SourceForm } from "./ai-generator/SourceForm";
import { ProposalsSection } from "./ai-generator/ProposalsSection";
import { useAiGenerator } from "./hooks/useAiGenerator";
import * as aiApi from "@/lib/api/ai-generator.api";

export default function GeneratePage() {
  const { state, actions } = useAiGenerator();

  // ============================================================================
  // GENERATE FLASHCARDS
  // ============================================================================

  const handleGenerate = useCallback(async () => {
    // Check if there are unsaved accepted proposals
    if (state.acceptedCount > 0) {
      const confirmed = window.confirm(
        `Masz ${state.acceptedCount} niezapisanych zaakceptowanych propozycji. ` +
          "Wygenerowanie nowych propozycji spowoduje ich utratę. Czy chcesz kontynuować?"
      );

      if (!confirmed) {
        return;
      }
    }

    actions.generateStart();

    try {
      const response = await aiApi.generateFlashcards({
        source_text: state.sourceText,
        language: state.language,
        max_proposals: state.maxProposals,
      });

      actions.generateSuccess(
        {
          id: response.generation_session.id,
          created_at: response.generation_session.created_at,
          proposals_count: response.generation_session.proposals_count,
          source_text_length: response.generation_session.source_text_length,
        },
        response.proposals
      );

      toast.success("Propozycje wygenerowane!", {
        description: `Wygenerowano ${response.proposals.length} propozycji fiszek.`,
      });

      // Scroll to proposals section
      setTimeout(() => {
        const proposalsSection = document.querySelector("[data-proposals-section]");
        if (proposalsSection) {
          proposalsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (error) {
      console.error("Generation error:", error);

      const errorMessage = aiApi.getErrorMessage(error);
      actions.generateFailure(errorMessage);

      toast.error("Błąd generowania", {
        description: errorMessage,
      });
    }
  }, [state.sourceText, state.language, state.maxProposals, state.acceptedCount, actions]);

  // ============================================================================
  // SAVE ACCEPTED PROPOSALS
  // ============================================================================

  const handleSaveSelected = useCallback(async () => {
    if (!state.session) {
      toast.error("Błąd", {
        description: "Brak sesji generowania. Wygeneruj nowe propozycje.",
      });
      return;
    }

    if (state.acceptedCount === 0) {
      toast.error("Błąd", {
        description: "Nie zaakceptowano żadnych propozycji.",
      });
      return;
    }

    // Get accepted proposals
    const acceptedProposals = state.proposals
      .filter((p) => p.status === "accepted")
      .map((p) => ({
        front_text: p.front_text,
        back_text: p.back_text,
      }));

    if (acceptedProposals.length > 20) {
      toast.error("Błąd", {
        description: "Można zapisać maksymalnie 20 fiszek na raz.",
      });
      return;
    }

    actions.saveStart();

    try {
      const response = await aiApi.acceptProposals({
        generation_session_id: state.session.id,
        cards: acceptedProposals,
      });

      actions.saveSuccess();

      toast.success("Fiszki zapisane!", {
        description: `Zapisano ${response.saved_count} ${
          response.saved_count === 1 ? "fiszkę" : response.saved_count < 5 ? "fiszki" : "fiszek"
        }.`,
      });
    } catch (error) {
      console.error("Save error:", error);

      const errorMessage = aiApi.getErrorMessage(error);
      actions.saveFailure(errorMessage);

      toast.error("Błąd zapisu", {
        description: errorMessage,
      });
    }
  }, [state.session, state.acceptedCount, state.proposals, actions]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Generator Fiszek AI
          </h1>
          <p className="text-muted-foreground text-lg">
            Wklej tekst, a AI wygeneruje dla Ciebie propozycje fiszek edukacyjnych
          </p>
        </header>

        {/* Source Form */}
        <div className="mb-12">
          <SourceForm
            sourceText={state.sourceText}
            language={state.language}
            maxProposals={state.maxProposals}
            charCount={state.charCount}
            isValid={state.isValid}
            isGenerating={state.isGenerating}
            hasProposals={state.proposals.length > 0}
            onTextChange={actions.setText}
            onLanguageChange={actions.setLanguage}
            onMaxProposalsChange={actions.setMaxProposals}
            onSubmit={handleGenerate}
          />
        </div>

        {/* Proposals Section */}
        {state.proposals.length > 0 && (
          <div data-proposals-section>
            <ProposalsSection
              proposals={state.proposals}
              acceptedCount={state.acceptedCount}
              rejectedCount={state.rejectedCount}
              pendingCount={state.pendingCount}
              isSaving={state.isSaving}
              onAccept={actions.acceptOne}
              onReject={actions.rejectOne}
              onRevealToggle={actions.toggleReveal}
              onBulkAccept={actions.bulkAcceptRemaining}
              onBulkReject={actions.bulkRejectRemaining}
              onSaveSelected={handleSaveSelected}
            />
          </div>
        )}
      </div>

      {/* Toaster for notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
