# Plan implementacji widoku Generator AI (Wejście + Propozycje)

## 1. Przegląd
Widok umożliwia wklejenie tekstu (100–10 000 znaków), wybranie języka (pl/en/bez preferencji) i liczby propozycji (1–20), a następnie wygenerowanie do 20 propozycji fiszek Q&A. Użytkownik może przeglądać, akceptować lub odrzucać propozycje, wykonać akcje zbiorcze oraz zapisać wybrane fiszki do bazy (origin=AI_full). Propozycje przed zapisem nie są utrwalane; UI informuje o możliwości utraty po odświeżeniu.

## 2. Routing widoku
- Ścieżka: /app/generate (strona Astro)
- API: 
  - POST /api/ai/generate — generowanie propozycji (bez zapisu)
  - POST /api/ai/accept — zapis zaakceptowanych propozycji (zbiorczo)

## 3. Struktura komponentów
- GeneratePage (React island osadzony w /app/generate)
  - SourceForm
    - TextareaWithCounter (zlicza 100–10 000)
    - LanguageSelect (pl/en/none)
    - NumberInput (1–20)
    - GenerateButton
    - LossInfoBanner (US-016)
  - ProposalsSection
    - BulkActionBar (Zatwierdź pozostałe / Odrzuć pozostałe)
    - ProposalList
      - ProposalCard × N (front/back + akcje: zaakceptuj/odrzuć/reveal)
    - SaveSelectedBar (Zapisz wybrane + licznik)
  - Toaster (powiadomienia)

## 4. Szczegóły komponentów
### GeneratePage
- Opis: Kontener widoku, trzyma stan, orkiestruje wywołania API i renderuje sekcje.
- Elementy: nagłówek, SourceForm, ProposalsSection, Toaster.
- Zdarzenia: init, onGenerate, onAcceptSelection, onBulkAccept, onBulkReject.
- Walidacja: delegowana do SourceForm i logiki hooka (zakresy długości/wartości).
- Typy: AiGeneratorState, Actions, GenerateFlashcardsCommand/Response, AcceptProposalsCommand/Response.
- Propsy: brak (strona samodzielna), ewentualnie feature flags.

### SourceForm
- Opis: Formularz wejścia do generowania.
- Elementy: TextareaWithCounter, LanguageSelect, NumberInput, GenerateButton, LossInfoBanner.
- Zdarzenia: onTextChange, onLanguageChange, onMaxChange, onSubmitGenerate.
- Walidacja:
  - source_text: 100–10 000 znaków (disabled przycisku poza zakresem, komunikat błędu).
  - max_proposals: 1–20 (clamp przy zmianie).
  - language: "pl" | "en" | null (wartość null dla „bez preferencji”).
- Typy: { sourceText: string; language: 'pl'|'en'|null; maxProposals: number }.
- Propsy: value, errors, isGenerating, onChange*, onSubmit.

### TextareaWithCounter
- Opis: Pole tekstowe z licznikem znaków i stanem błędu.
- Elementy: textarea, licznik, opis a11y.
- Zdarzenia: onChange, onBlur.
- Walidacja: dynamiczna walidacja długości i stanu (<=10 000, >=100).
- Typy: { value: string; count: number; isInvalid: boolean; }.
- Propsy: value, max=10000, min=100, onChange.

### LanguageSelect
- Opis: Wybór preferencji języka dla promptu.
- Elementy: select (shadcn/ui) z opcjami: „Automatycznie/Brak” (null), „Polski” (pl), „English” (en).
- Zdarzenia: onChange.
- Walidacja: brak dodatkowej (null dopuszczalne).
- Typy: 'pl' | 'en' | null.
- Propsy: value, onChange.

### NumberInput
- Opis: Liczba propozycji do wygenerowania.
- Elementy: input typu number ze strzałkami.
- Zdarzenia: onChange, onBlur (clamp 1–20).
- Walidacja: 1–20, domyślnie 20.
- Typy: number.
- Propsy: value, min=1, max=20, onChange.

### GenerateButton
- Opis: Wywołuje generowanie.
- Elementy: button (primary) + spinner.
- Zdarzenia: onClick/onSubmit.
- Walidacja: disabled, jeśli source_text poza 100–10 000 lub isGenerating.
- Typy: { disabled: boolean; loading: boolean }.
- Propsy: disabled, loading, onClick.

### LossInfoBanner
- Opis: Informacja o braku zapisu propozycji przed akceptacją (US-016).
- Elementy: alert/info banner.
- Zdarzenia: brak.
- Walidacja: n/a.
- Typy: { visible: boolean }.
- Propsy: visible.

### ProposalsSection
- Opis: Prezentuje listę propozycji i akcje zbiorcze.
- Elementy: BulkActionBar, ProposalList, SaveSelectedBar.
- Zdarzenia: onBulkAccept, onBulkReject, onSaveSelected.
- Walidacja: limit zaakceptowanych ≤20.
- Typy: ProposalVM[], Counters.
- Propsy: proposals, onAccept, onReject, onBulk*, onSaveSelected, disabled stany.

### BulkActionBar
- Opis: Akcje na wszystkich „pending”: „Zatwierdź pozostałe”, „Odrzuć pozostałe”.
- Elementy: 2 przyciski + licznik.
- Zdarzenia: onBulkAcceptRemaining, onBulkRejectRemaining.
- Walidacja: działa wyłącznie na status=pending.
- Typy: { pendingCount: number }.
- Propsy: pendingCount, onBulkAccept, onBulkReject.

### ProposalList
- Opis: Lista kart propozycji (do 20).
- Elementy: grid/lista kart ProposalCard.
- Zdarzenia: delegowane: onAccept(id), onReject(id), onRevealToggle(id).
- Walidacja: brak dodatkowej.
- Typy: ProposalVM[].
- Propsy: proposals, onAccept, onReject, onRevealToggle.

### ProposalCard
- Opis: Pojedyncza propozycja z przodem/tyłem i akcjami.
- Elementy: karta, front/back, przyciski Akceptuj/Odrzuć, toggle „Pokaż odpowiedź”.
- Zdarzenia: onAccept, onReject, onRevealToggle, skróty klawiaturowe (A/R/Space).
- Walidacja: front/back ≤1000 (pochodzi z API; UI dodatkowo przycina preview, pełny tekst w tooltips/expandable).
- Typy: ProposalVM.
- Propsy: proposal, onAccept, onReject, onRevealToggle, autoFocus.

### SaveSelectedBar
- Opis: Pasek akcji zapisu z licznikiem zaakceptowanych.
- Elementy: button „Zapisz wybrane”, licznik acceptedCount/pendingCount.
- Zdarzenia: onClick -> POST /api/ai/accept.
- Walidacja: disabled, gdy acceptedCount=0 lub isSaving.
- Typy: { acceptedCount: number; isSaving: boolean }.
- Propsy: acceptedCount, isSaving, onSave.

## 5. Typy
- Reuse z src/types.ts:
  - GenerateFlashcardsCommand: { source_text: string; language: 'pl'|'en'|null; max_proposals?: number }
  - GenerateFlashcardsResponse: { generation_session: { id: uuid; proposals_count: number; source_text_length: number; created_at: string }; proposals: { front_text: string; back_text: string }[] }
  - AcceptProposalsCommand: { generation_session_id: string; cards: { front_text: string; back_text: string }[] }
  - AcceptProposalsResponse: { saved_count: number; flashcards: FlashcardDTO[] }
- ViewModel (frontend):
  - ProposalStatus = 'pending' | 'accepted' | 'rejected'
  - ProposalVM = { id: string; front_text: string; back_text: string; status: ProposalStatus; revealed: boolean }
  - AiGeneratorState = {
    sourceText: string;
    language: 'pl'|'en'|null;
    maxProposals: number;
    charCount: number;
    isValid: boolean;
    isGenerating: boolean;
    generationError?: string;
    session?: { id: string; created_at: string; proposals_count: number; source_text_length: number };
    proposals: ProposalVM[];
    acceptedCount: number; rejectedCount: number; pendingCount: number;
    isSaving: boolean; saveError?: string;
  }

## 6. Zarządzanie stanem
- React useReducer w dedykowanym hooku useAiGenerator() do deterministycznych przejść statusów: pending → accepted/rejected; reset po nowym generowaniu.
- Akcje: setText, setLanguage, setMax, generateStart/success/failure, acceptOne(id), rejectOne(id), bulkAcceptRemaining, bulkRejectRemaining, toggleReveal(id), saveStart/success/failure, reset.
- Pochodne liczniki utrzymywane w reducerze (unikamy kosztownych redukcji w renderze).
- Focus management: po sukcesie generate ustaw focus na pierwszej ProposalCard; po zapisie focus na toast oraz przycisk „Generuj”.

## 7. Integracja API
- POST /api/ai/generate
  - Body: GenerateFlashcardsCommand
  - 200: GenerateFlashcardsResponse (sesja + proposals)
  - 400/401/500/502/504: obsługa błędów (walidacja, auth, usługa AI)
  - Implementacja zwraca testową sesję gdy auth/db wyłączone — UI nie zakłada trwałości propozycji
- POST /api/ai/accept
  - Body: AcceptProposalsCommand z generation_session_id (z poprzedniej odpowiedzi) i cards = tylko zaakceptowane
  - 201: AcceptProposalsResponse (saved_count, flashcards)
  - 400/403/409/422: mapowanie na komunikaty
- fetch: ścieżki względne, same-origin; przekazywanie cookies (auth) domyślnie.

## 8. Interakcje użytkownika
- Wprowadzenie/edycja tekstu: licznik znaków, komunikaty przy przekroczeniu zakresu.
- Wybór języka: opcjonalny; null = brak preferencji.
- Zmiana max_proposals: clamp 1–20.
- Generuj: disabled dopóki tekst nie jest 100–10 000. Po kliknięciu spinner; po sukcesie banner o utracie danych i lista propozycji. Jeśli istnieją niesave’owane akceptacje i użytkownik ponownie generuje — modal z potwierdzeniem nadpisania.
- Na karcie: przyciski Akceptuj/Odrzuć; skróty klawiaturowe (A/R), Space/Enter → reveal; status wizualny (kolory, aria-pressed, aria-label).
- Akcje zbiorcze: działają tylko na pending; aktualizują statusy i liczniki.
- Zapisz wybrane: wysyła wyłącznie zaakceptowane; toast z „Zapisano X fiszek”; po sukcesie można pozostawić listę z oznaczeniem „zapisano” lub wyczyścić stan (MVP: pozostawiamy, ale zerujemy acceptedCount i blokujemy ponowny zapis bez nowych akceptacji).

## 9. Warunki i walidacja
- UI:
  - source_text: 100 ≤ length ≤ 10 000.
  - max_proposals: 1 ≤ value ≤ 20.
  - Button „Generuj” disabled poza zakresem lub gdy isGenerating.
  - Button „Zapisz wybrane” disabled, jeśli acceptedCount=0 lub isSaving.
- API kontrakty (cross-check w komponentach):
  - proposals: front/back ≤1000 — UI prezentuje bez możliwości edycji przed zapisem (MVP).
  - accept: cards length ≤20, generation_session_id wymagany.

## 10. Obsługa błędów
- 400 (generate): pokaż opis walidacji pod formularzem; scroll/aria-live.
- 401 (generate/accept): toast + CTA „Zaloguj się”, opcjonalnie redirect do /auth.
- 429 (generate): toast „Przekroczono limit — spróbuj później”.
- 500/502/504: toast „Błąd usługi AI — spróbuj ponownie”, przycisk Retry.
- 403 (accept): toast „Sesja nie należy do użytkownika” → wymuś nowe generowanie.
- 409 (accept): toast „Sesja nieznaleziona/anulowana” → wymuś nowe generowanie.
- 422 (accept): toast „Za dużo pozycji (max 20)” → UI i tak ogranicza; sanity check po stronie hooka.
- Sieć offline: banner „Brak połączenia”.

## 11. Kroki implementacji
1. Routing: utwórz stronę src/pages/app/generate.astro i osadź React island <GeneratePage client:load>.
2. UI bazowe: zbuduj SourceForm (TextareaWithCounter, LanguageSelect, NumberInput, GenerateButton, LossInfoBanner) w oparciu o shadcn/ui + Tailwind.
3. Hook useAiGenerator z useReducer: stan, akcje, walidacje; testy jednostkowe logiki reduktora (statusy i liczniki).
4. Integracja /api/ai/generate: serwis api.ai.generate(cmd) + obsługa błędów; wyświetlenie ProposalList.
5. Komponenty listy: ProposalList, ProposalCard ze skrótami klawiaturowymi i focus management.
6. BulkActionBar i SaveSelectedBar: implementacja akcji zbiorczych i zapisu; blokady przycisków zgodnie z walidacją.
7. Integracja /api/ai/accept: serwis api.ai.accept(payload) + toast potwierdzający saved_count; sanity check limitu 20.
8. A11y/UX: aria-live dla komunikatów, role=alert dla błędów, focus ringi, kontrasty, etykiety dla SR.
9. Komunikaty/Toasty: sukces zapisu, błędy generate/accept, rate limit, offline.
10. Edge cases: potwierdzenie nadpisania przy ponownym generate z niesave’owanymi akceptacjami.
11. QA: testy integracyjne komponentów (React Testing Library) i ręczny smoke na długich/pustych tekstach, granice 100/10 000 i 1/20.

