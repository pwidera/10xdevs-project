# AI Generator Components

Komponenty dla funkcji generowania fiszek przy użyciu AI.

## Struktura komponentów

```
GeneratePage (główny kontener)
├── SourceForm (formularz wejściowy)
│   ├── TextareaWithCounter (pole tekstowe z licznikiem)
│   ├── LanguageSelect (wybór języka)
│   ├── NumberInput (liczba propozycji)
│   ├── GenerateButton (przycisk generowania)
│   └── LossInfoBanner (informacja o utracie danych)
│
└── ProposalsSection (sekcja propozycji)
    ├── BulkActionBar (akcje zbiorcze)
    ├── ProposalList (lista propozycji)
    │   └── ProposalCard × N (pojedyncza propozycja)
    └── SaveSelectedBar (pasek zapisu)
```

## Komponenty

### GeneratePage
Główny kontener widoku. Zarządza stanem za pomocą hooka `useAiGenerator` i orkiestruje wywołania API.

**Funkcjonalności:**
- Generowanie propozycji fiszek z AI
- Zapisywanie zaakceptowanych propozycji
- Obsługa błędów z toast notifications
- Potwierdzenie nadpisania niezapisanych propozycji

### SourceForm
Formularz wejściowy do generowania propozycji.

**Props:**
- `sourceText`, `language`, `maxProposals` - wartości formularza
- `isValid`, `isGenerating` - stany walidacji i ładowania
- `hasProposals` - czy są wygenerowane propozycje
- `onTextChange`, `onLanguageChange`, `onMaxProposalsChange`, `onSubmit` - handlery

### TextareaWithCounter
Pole tekstowe z licznikiem znaków i walidacją.

**Walidacja:**
- Min: 100 znaków
- Max: 10000 znaków
- Komunikaty błędów w czasie rzeczywistym

**Dostępność:**
- `aria-invalid` dla stanu błędu
- `aria-describedby` dla opisu i błędów
- `aria-live` dla licznika i błędów

### LanguageSelect
Wybór preferencji języka dla AI.

**Opcje:**
- `null` - Automatycznie / Brak preferencji
- `'pl'` - Polski
- `'en'` - English

### NumberInput
Pole numeryczne z automatycznym clamp.

**Zakres:** 1-20 (domyślnie 20)

### ProposalCard
Pojedyncza karta propozycji fiszki.

**Funkcjonalności:**
- Wyświetlanie przodu i tyłu fiszki
- Toggle pokazywania odpowiedzi
- Przyciski Akceptuj/Odrzuć (tylko dla pending)
- Skróty klawiaturowe:
  - `A` - akceptuj
  - `R` - odrzuć
  - `Spacja/Enter` - pokaż/ukryj odpowiedź

**Statusy wizualne:**
- Pending: normalna karta
- Accepted: zielona ramka i tło
- Rejected: czerwona ramka i tło, opacity 60%

### BulkActionBar
Pasek akcji zbiorczych z licznikami.

**Funkcjonalności:**
- Liczniki: pending, accepted, rejected
- "Zatwierdź pozostałe" - akceptuje wszystkie pending
- "Odrzuć pozostałe" - odrzuca wszystkie pending

### SaveSelectedBar
Sticky bar na dole ekranu do zapisu zaakceptowanych fiszek.

**Funkcjonalności:**
- Licznik zaakceptowanych fiszek
- Przycisk "Zapisz wybrane"
- Disabled gdy brak akceptacji lub podczas zapisywania
- Spinner podczas zapisywania

## Hook: useAiGenerator

Hook zarządzający stanem generatora AI za pomocą `useReducer`.

**Stan:**
```typescript
{
  sourceText: string;
  language: 'pl' | 'en' | null;
  maxProposals: number;
  charCount: number;
  isValid: boolean;
  isGenerating: boolean;
  generationError?: string;
  session?: { id, created_at, proposals_count, source_text_length };
  proposals: ProposalVM[];
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  isSaving: boolean;
  saveError?: string;
}
```

**Akcje:**
- `setText`, `setLanguage`, `setMaxProposals` - aktualizacja formularza
- `generateStart`, `generateSuccess`, `generateFailure` - generowanie
- `acceptOne`, `rejectOne` - akcje na pojedynczej propozycji
- `bulkAcceptRemaining`, `bulkRejectRemaining` - akcje zbiorcze
- `toggleReveal` - pokazywanie/ukrywanie odpowiedzi
- `saveStart`, `saveSuccess`, `saveFailure` - zapisywanie
- `reset` - reset stanu

## API Client: ai-generator.api.ts

Klient API dla frontendu (w `src/lib/api/`).

**Metody:**
- `generateFlashcards(command)` - POST /api/ai/generate
- `acceptProposals(command)` - POST /api/ai/accept
- `getErrorMessage(error)` - mapowanie błędów na komunikaty PL

**Błędy:**
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `ConflictError` (409)
- `UnprocessableEntityError` (422)
- `RateLimitError` (429)
- `ServerError` (500)
- `BadGatewayError` (502)
- `GatewayTimeoutError` (504)

## Routing

**Ścieżka:** `/app/generate`

**Plik:** `src/pages/app/generate.astro`

## Dostępność (a11y)

Wszystkie komponenty implementują:
- Semantyczny HTML (role, aria-*)
- Obsługę klawiatury
- Focus management
- Screen reader support
- Komunikaty live regions

## Responsywność

- Mobile-first design
- Breakpointy: sm, md, lg
- Grid adaptacyjny dla ProposalList (1/2/3 kolumny)
- Sticky SaveSelectedBar na mobile

