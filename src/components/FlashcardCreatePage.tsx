import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashcardForm } from "./flashcards/FlashcardForm";
import * as flashcardsApi from "@/lib/api/flashcards.api";
import { toast } from "sonner";

/**
 * Page for creating new flashcards manually
 */
export default function FlashcardCreatePage() {
  // Handle form submission
  const handleSubmit = useCallback(async (frontText: string, backText: string) => {
    try {
      await flashcardsApi.createFlashcard({
        front_text: frontText,
        back_text: backText,
      });

      toast.success("Fiszka została utworzona");

      // Redirect to flashcards list after short delay
      setTimeout(() => {
        window.location.href = "/app/flashcards";
      }, 1000);
    } catch (error) {
      console.error("Failed to create flashcard:", error);

      const errorMessage = flashcardsApi.getErrorMessage(error);
      toast.error(errorMessage);

      // Re-throw to prevent form reset
      throw error;
    }
  }, []);

  // Navigate back to list
  const handleBackClick = () => {
    window.location.href = "/app/flashcards";
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={handleBackClick} className="mb-4 -ml-2">
          <svg
            className="h-4 w-4 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Powrót do listy
        </Button>

        <h1 className="text-3xl font-bold mb-2">Dodaj nową fiszkę</h1>
        <p className="text-muted-foreground">Utwórz fiszkę ręcznie, wpisując treść przodu i tyłu</p>
      </div>

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle>Nowa fiszka</CardTitle>
          <CardDescription>
            Wypełnij oba pola, aby utworzyć fiszkę. Każde pole może zawierać od 1 do 1000 znaków.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FlashcardForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>

      {/* Help text */}
      <div className="mt-6 p-4 rounded-lg bg-muted/50">
        <h3 className="text-sm font-medium mb-2">💡 Wskazówki</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Przód fiszki to pytanie lub pojęcie do zapamiętania</li>
          <li>• Tył fiszki to odpowiedź lub definicja</li>
          <li>• Możesz używać wieloliniowego tekstu</li>
          <li>• Fiszka zostanie oznaczona jako &quot;Ręczna&quot;</li>
        </ul>
      </div>
    </div>
  );
}
