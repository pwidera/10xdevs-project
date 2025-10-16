# Plan implementacji widoku Flashcards (Lista/Wyszukiwanie/Edycja/Usuwanie + Dodaj ręcznie)

## 1. Przegląd
Widok umożliwia użytkownikowi:
- przeglądanie i wyszukiwanie zapisanych fiszek (pochodzenie: AI lub ręczne),
- edycję inline (front/back, 1..1000 znaków),
- usuwanie z potwierdzeniem,
- dodawanie fiszki ręcznie (oddzielna trasa /app/flashcards/new).

Spełnia wymagania PRD i historyjek US-008, US-009, US-010, US-011, US-012. Integruje się z endpointami REST (Astro API + Supabase RLS). UI oparty o React 19 + shadcn/ui + Tailwind.

## 2. Routing widoku
- Lista/Wyszukiwanie/Edycja/Usuwanie: /app/flashcards
- Dodaj ręcznie: /app/flashcards/new

API (po stronie klienta):
- GET /api/flashcards?q=&page=&page_size=&origin=&sort=
- PUT /api/flashcards/{id}
- DELETE /api/flashcards/{id}
- POST /api/flashcards

## 3. Struktura komponentów
- FlashcardsPage (kontener trasy /app/flashcards)
  - FlashcardsToolbar
    - SearchInput (debounce)
    - SelectOrigin (manual | AI_full | AI_edited)
    - SelectSort (created_at_desc [domyślnie] | created_at_asc | last_reviewed_at_asc | last_reviewed_at_desc)
  - FlashcardsList (lista/szkielet/pusta lista)
    - FlashcardRow (pojedyncza pozycja)
      - OriginBadge (AI/manual/edited)
      - InlineEdit (front/back z licznikami, Save/Cancel, Enter/Esc)
      - RowActions (Edit/Save/Cancel/Delete)
  - Pagination
  - ConfirmDialog (usuwanie)
  - Toast (globalny system powiadomień)
- FlashcardCreatePage (kontener trasy /app/flashcards/new)
  - FlashcardForm (front/back z licznikami + przycisk Zapisz)

## 4. Szczegóły komponentów
### FlashcardsPage
- Opis: Widok kontenerowy listy, łączy toolbar, listę i paginację, zarządza filtrami w URL i pobiera dane.
- Główne elementy: Toolbar, List, Pagination, ConfirmDialog, Toast.
- Interakcje: zmiana filtrów, edycje wierszy, usuwanie, paginacja.
- Walidacja: filtry page>=1, page_size 1..100, sort/origin z enumów; obsługa pustego q.
- Typy: używa FlashcardsListQuery, FlashcardsListResponse; VM: FlashcardsFiltersVM, FlashcardsListVM.
- Propsy: brak (komponent routowy).

### FlashcardsToolbar
- Opis: Steruje filtrami listy (q, origin, sort). Aktualizuje URLSearchParams i wywołuje refetch.
- Elementy: SearchInput, SelectOrigin, SelectSort.
- Interakcje: wpisywanie q (debounce 300–500 ms), wybór origin/sort (natychmiastowe odświeżenie, reset page=1).
- Walidacja: brak wymagana poza dopuszczalnymi wartościami selectów.
- Typy: używa FlashcardOrigin, FlashcardSortOption; VM: FlashcardsFiltersVM.
- Propsy: value i onChange dla q/origin/sort.

### SearchInput
- Opis: Pole wyszukiwania po front_text i back_text z debounce.
- Elementy: Input z ikoną, licznik opcjonalny (nie wymagany), aria-label.
- Interakcje: onChange (debounced), onClear.
- Walidacja: brak (pusty string dozwolony).
- Typy: string.
- Propsy: value: string, onChange: (v: string) => void, debounceMs?: number.

### SelectOrigin
- Opis: Filtr pochodzenia (manual | AI_full | AI_edited). Wyświetlaj w UI jako: Ręczne, AI, AI (edytowane).
- Elementy: Select shadcn/ui.
- Interakcje: onChange.
- Walidacja: enum.
- Typy: FlashcardOrigin | undefined/null (brak filtra) w UI.
- Propsy: value, onChange.

### SelectSort
- Opis: Sortowanie listy (domyślnie created_at_desc).
- Elementy: Select.
- Interakcje: onChange.
- Walidacja: FlashcardSortOption.
- Typy: FlashcardSortOption.
- Propsy: value, onChange.

### FlashcardsList
- Opis: Renderuje listę fiszek, stany loading/empty/error oraz skeletony.
- Elementy: Lista (np. Table/List), SkeletonRow, EmptyState.
- Interakcje: deleguje zdarzenia do wierszy.
- Walidacja: brak.
- Typy: FlashcardsListResponse, FlashcardRowVM.
- Propsy: items: FlashcardRowVM[], loading: boolean, error?: string, onEditSave, onEditCancel, onDelete.

### FlashcardRow
- Opis: Pojedyncza fiszka z badge origin i edycją inline front/back.
- Elementy: OriginBadge, dwie komórki front/back (input/textarea w trybie edycji), przyciski Save/Cancel, Delete.
- Interakcje: 
  - Klik „Edytuj” → tryb edycji; Enter → Save; Esc → Cancel.
  - Zmiana pól aktualizuje draft i liczniki znaków.
  - Klik „Usuń” → ConfirmDialog.
- Walidacja: front/back: trim, 1..1000 znaków; Save disabled jeśli niezmienione lub nieprawidłowe.
- Typy: UpdateFlashcardCommand, UpdateFlashcardResponse, DeleteFlashcardResponse; VM: FlashcardRowVM.
- Propsy: item: FlashcardRowVM, onSave: (id, cmd) => Promise<void>, onCancel: (id) => void, onDelete: (id) => void.

### OriginBadge
- Opis: Wizualna etykieta pochodzenia.
- Elementy: Badge kolorystyczny: manual → „Manual”, AI_full → „AI”, AI_edited → „Edited”.
- Interakcje: brak.
- Walidacja: enum.
- Typy: FlashcardOrigin.
- Propsy: origin: FlashcardOrigin.

### Pagination
- Opis: Kontrola zmiany strony i rozmiaru strony.
- Elementy: Paginator (numeracja, Prev/Next), PageSize select (opcjonalnie: 10/20/50/100).
- Interakcje: onPageChange, onPageSizeChange (reset page=1 przy zmianie size).
- Walidacja: page>=1, page_size 1..100.
- Typy: liczby.
- Propsy: page, pageSize, total, onChange.

### ConfirmDialog
- Opis: Modal z potwierdzeniem usunięcia.
- Elementy: Dialog shadcn/ui, przyciski Potwierdź/Anuluj.
- Interakcje: onConfirm → DELETE; onOpenChange.
- Walidacja: brak.
- Typy: boolean + id.
- Propsy: open, onOpenChange, onConfirm(id: string).

### Toast
- Opis: Globalne powiadomienia sukces/błąd.
- Elementy: shadcn/ui toast.
- Interakcje: pasywne.
- Walidacja: —
- Typy: string/enum.
- Propsy: użycie przez hook/helper.

### FlashcardCreatePage
- Opis: Widok dodawania ręcznego. Formularz front/back z walidacją i licznikami; po sukcesie toast + przekierowanie do /app/flashcards.
- Elementy: FlashcardForm.
- Interakcje: submit formularza.
- Walidacja: front/back 1..1000 po trim, brak pustych pól.
- Typy: CreateFlashcardCommand, CreateFlashcardsResponse.
- Propsy: brak (routowy).

### FlashcardForm
- Opis: Formularz z dwoma polami i przyciskiem Zapisz.
- Elementy: Textarea front, Textarea back, liczniki znaków, przycisk Zapisz (disabled kiedy niepoprawne), link „Anuluj/Wróć”.
- Interakcje: onChange, onSubmit.
- Walidacja: 1..1000 po trim; wyróżnienie błędów; focus w pierwszym błędnym polu.
- Typy: CreateFlashcardCommand.
- Propsy: onSubmit(cmd: CreateFlashcardCommand): Promise<void>, disabled?: boolean.

## 5. Typy
- DTO z backendu (src/types.ts):
  - FlashcardDTO, FlashcardsListQuery, FlashcardsListResponse,
  - CreateFlashcardCommand, CreateFlashcardsResponse,
  - UpdateFlashcardCommand, UpdateFlashcardResponse,
  - DeleteFlashcardResponse, FlashcardOrigin, FlashcardSortOption.
- Nowe VM (frontend):
  - FlashcardsFiltersVM: { q: string; origin: FlashcardOrigin | null; sort: FlashcardSortOption; page: number; page_size: number }
  - FlashcardRowVM: FlashcardDTO & { isEditing: boolean; draftFront: string; draftBack: string; isSaving: boolean; error?: string }
  - FlashcardsListVM: { items: FlashcardRowVM[]; page: number; page_size: number; total: number; isLoading: boolean; error?: string }

## 6. Zarządzanie stanem
- Źródło prawdy filtrów: URLSearchParams (q, origin, sort, page, page_size). Sync w obie strony.
- useDebouncedValue(q, 300–500 ms) → aktualizacja parametru q i refetch.
- useFlashcardsQuery(filters): fetch GET /api/flashcards; zwraca FlashcardsListVM; loading/skeletony.
- Edycja per-wiersz: lokalny stan wiersza (isEditing, draftFront, draftBack, isSaving). „Enter” zapisuje, „Esc” anuluje.
- Usuwanie: stan ConfirmDialog (open, id). Po sukcesie: odśwież listę; jeżeli strona > 1 i po usunięciu lista pusta → cofnij page o 1.
- Formularz tworzenia: lokalny stan pól; po sukcesie reset i nawigacja do listy + toast.

## 7. Integracja API
- GET /api/flashcards
  - Query: FlashcardsListQuery { page=1, page_size=20, q?, origin?, sort='created_at_desc' }
  - Response: FlashcardsListResponse { items, page, page_size, total }
- PUT /api/flashcards/{id}
  - Body: UpdateFlashcardCommand { front_text?: 1..1000, back_text?: 1..1000 } (co najmniej jedno pole)
  - Response: UpdateFlashcardResponse { id, front_text, back_text, origin, updated_at }
- DELETE /api/flashcards/{id}
  - Response: DeleteFlashcardResponse { success: true }
- POST /api/flashcards
  - Body: CreateFlashcardCommand { front_text: 1..1000, back_text: 1..1000, origin?: 'manual' }
  - Response: CreateFlashcardsResponse { saved_count, flashcards: FlashcardDTO[] }
- Kody błędów: 400/401/403/404/422/500 – mapowane na komunikaty w UI.

## 8. Interakcje użytkownika
- Wpisanie frazy w SearchInput → po debounce odświeża listę; page reset na 1.
- Zmiana origin/sort → natychmiast odświeża listę; page reset na 1.
- Klik „Edytuj” w wierszu → wejście w tryb edycji; Enter=Zapisz, Esc=Anuluj; Save disabled, gdy brak zmian lub walidacja nie przechodzi.
- Klik „Usuń” → ConfirmDialog; po potwierdzeniu DELETE i odświeżenie listy; toast sukcesu.
- Paginacja → zmiana page/page_size, refetch; zachowanie filtrów w URL.
- Dodaj ręcznie: wypełnienie pól, „Zapisz” → POST; toast + redirect na /app/flashcards; nowa fiszka widoczna na liście.

## 9. Warunki i walidacja
- front_text/back_text: trim, długość 1..1000.
- q: dowolny string (może być pusty).
- origin: enum (manual|AI_full|AI_edited) lub brak (usunięcie filtra).
- sort: FlashcardSortOption (domyślnie created_at_desc).
- page >= 1, page_size w zakresie 1..100.
- Save w edycji aktywny tylko, gdy draft różni się od oryginału i oba pola poprawne.
- Formularz tworzenia: focus na pierwszym błędnym polu; przycisk Zapisz disabled gdy niepoprawne.

## 10. Obsługa błędów
- 400/422 (walidacje): pokaż błędy per pole (np. „Maksymalnie 1000 znaków”), toast „Nie udało się zapisać zmian”.
- 401 (niezalogowany): przekierowanie do logowania lub komunikat „Zaloguj się, aby kontynuować”.
- 403/404 (RLS/nie istnieje): toast „Fiszka nie istnieje lub brak dostępu”; odśwież listę.
- 500 (serwer): toast „Wystąpił błąd serwera. Spróbuj ponownie.”
- Sieć/time-out: retry przy pobieraniu listy (np. przycisk „Spróbuj ponownie”); zachowaj edycje w wierszu do kolejnej próby.

## 11. Kroki implementacji
1. Typy i kontrakty
   - Potwierdź użycie typów z src/types.ts po stronie klienta (DTO/Command/Query).
   - Zdefiniuj VM: FlashcardsFiltersVM, FlashcardRowVM, FlashcardsListVM (tylko frontendowe).
2. Routing
   - Dodaj trasy: /app/flashcards i /app/flashcards/new (Astro + React islands dla interakcji).
3. Toolbar i synchronizacja URL
   - Zaimplementuj FlashcardsToolbar (SearchInput z debounce, SelectOrigin, SelectSort) i sync z URLSearchParams.
4. Pobieranie listy
   - Stwórz hook useFlashcardsQuery(filters) wywołujący GET /api/flashcards, obsłuż loading/skeleton/empty/error.
5. Lista i wiersze
   - Zaimplementuj FlashcardsList i FlashcardRow z OriginBadge i RowActions; licznik znaków przy edycji.
6. Edycja inline
   - Walidacja front/back (trim, 1..1000), Enter=Save, Esc=Cancel; PUT /api/flashcards/{id}; aktualizacja wiersza po sukcesie; toast.
7. Usuwanie
   - ConfirmDialog → DELETE /api/flashcards/{id}; po sukcesie odśwież listę i ewentualnie skoryguj page; toast.
8. Paginacja
   - Dodaj Pagination, reaguj na total i page_size; utrzymuj w URL.
9. Dodawanie ręczne
   - Widok /app/flashcards/new z FlashcardForm; walidacje; POST /api/flashcards (origin domyślnie manual); toast + redirect.
10. A11y i UX
   - Focus management (po otwarciu edycji, po błędach, po zamknięciu dialogu), aria-live dla toastów, skróty Enter/Esc.
11. Testy
   - Jednostkowe: walidacje, hook debounce, mapowanie filtrów↔URL.
   - Integracyjne (MSW): scenariusze GET/PUT/DELETE/POST, błędy 400/401/404/422/500, debounce szukania, paginacja.
12. Dopracowanie
   - Skeletony, edge-cases (pusta lista, ostatnia strona po usunięciach), optymalizacje renderów.

