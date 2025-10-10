# API Endpoint Implementation Plan: POST /ai/generate

## 1. Przegląd punktu końcowego

Endpoint `POST /ai/generate` umożliwia użytkownikom generowanie do 20 propozycji fiszek edukacyjnych z dostarczonego tekstu źródłowego przy użyciu modeli AI dostępnych przez OpenRouter. Endpoint tworzy rekord sesji generowania w bazie danych dla celów telemetrycznych i audytowych, ale **nie persystuje** samych propozycji fiszek - zapisywane są tylko metryki (liczba propozycji, długość tekstu, hash SHA-256 tekstu źródłowego, czas generowania).

**Kluczowe cechy:**
- Wymaga uwierzytelnienia użytkownika (JWT token z Supabase)
- Waliduje długość tekstu źródłowego (100-10000 znaków)
- Komunikuje się z OpenRouter API do generowania propozycji
- Zapisuje metadane sesji do tabeli `generation_sessions`
- Zwraca propozycje fiszek bez ich persystowania

## 2. Szczegóły żądania

### Metoda HTTP
`POST`

### Struktura URL
`/api/ai/generate`

### Nagłówki
- `Authorization: Bearer <supabase_jwt_token>` (wymagany)
- `Content-Type: application/json` (wymagany)

### Parametry

#### Wymagane parametry (Request Body JSON):
- **`source_text`** (string): Tekst źródłowy do wygenerowania fiszek
  - Minimalna długość: 100 znaków
  - Maksymalna długość: 10000 znaków
  - Przykład: "Fotosynteza to proces, w którym rośliny przekształcają światło słoneczne w energię chemiczną..."

- **`language`** ("pl" | "en" | null): Język w jakim mają być generowane fiszki
  - Wartości dozwolone: `"pl"`, `"en"`, `null`
  - Przykład: `"pl"`

#### Opcjonalne parametry (Request Body JSON):
- **`max_proposals`** (number): Maksymalna liczba propozycji do wygenerowania
  - Zakres: 1-20
  - Wartość domyślna: 20
  - Przykład: `15`

### Przykład Request Body:
```json
{
  "source_text": "Fotosynteza to proces biochemiczny zachodzący w chloroplastach roślin zielonych, w którym energia świetlna jest przekształcana w energię chemiczną. W procesie tym dwutlenek węgla i woda są przekształcane w glukozę i tlen.",
  "language": "pl",
  "max_proposals": 10
}
```

## 3. Wykorzystywane typy

### Istniejące typy z `src/types.ts`:

**Command Model (Request):**
```typescript
export type GenerateFlashcardsCommand = {
  source_text: string;        // 100-10000 chars
  language: Language | null;  // 'pl' | 'en' | null
  max_proposals?: number;     // 1-20, default 20
};

export type Language = 'pl' | 'en';
```

**Response DTOs:**
```typescript
export type GenerateFlashcardsResponse = {
  generation_session: GenerationSessionSummaryDTO;
  proposals: FlashcardProposalDTO[];
};

export type GenerationSessionSummaryDTO = Pick<
  Tables<'generation_sessions'>,
  | 'id'
  | 'proposals_count'
  | 'source_text_length'
  | 'created_at'
>;

export type FlashcardProposalDTO = {
  front_text: string; // max 1000 chars
  back_text: string;  // max 1000 chars
};
```

### Nowe typy do utworzenia (w serwisach):

**Dla serwisu AI Generation:**
```typescript
// src/lib/services/ai-generation.service.ts
type OpenRouterRequest = {
  model: string;
  messages: Array<{
    role: 'system' | 'user';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
};

type OpenRouterResponse = {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};
```

**Dla serwisu Generation Session:**
```typescript
// src/lib/services/generation-session.service.ts
type CreateGenerationSessionParams = {
  userId: string;
  proposalsCount: number;
  sourceTextLength: number;
  sourceTextHash: string;
  generateDuration?: number;
};
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

**Struktura odpowiedzi:**
```json
{
  "generation_session": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "proposals_count": 10,
    "source_text_length": 245,
    "created_at": "2025-10-10T14:30:00.000Z"
  },
  "proposals": [
    {
      "front_text": "Co to jest fotosynteza?",
      "back_text": "Proces biochemiczny zachodzący w chloroplastach roślin zielonych, w którym energia świetlna jest przekształcana w energię chemiczną."
    },
    {
      "front_text": "Jakie substancje są wykorzystywane w fotosyntezie?",
      "back_text": "Dwutlenek węgla (CO₂) i woda (H₂O)."
    }
  ]
}
```

### Błędy

#### 400 Bad Request - Błędy walidacji
```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "source_text",
      "message": "source_text must be at least 100 characters"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token"
}
```



#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Failed to generate flashcards"
}
```

#### 504 Gateway Timeout
```json
{
  "error": "Gateway timeout",
  "message": "AI service did not respond in time"
}
```

## 5. Przepływ danych

### Diagram przepływu:

```
1. Klient → POST /api/ai/generate + JWT token
                ↓
2. Middleware Astro → Weryfikacja JWT i dodanie supabase do context.locals
                ↓
3. Endpoint Handler → Walidacja danych wejściowych (Zod)
                ↓
4. Endpoint Handler → Pobranie user_id z auth.uid()
                ↓
5. AI Generation Service → Obliczenie SHA-256 hash z source_text
                ↓
6. AI Generation Service → Wywołanie OpenRouter API
                ↓
7. AI Generation Service → Parsowanie odpowiedzi AI (JSON)
                ↓
8. Generation Session Service → Zapis sesji do tabeli generation_sessions
                ↓
9. Endpoint Handler → Zwrócenie odpowiedzi 200 OK z proposals
                ↓
10. Klient ← JSON response
```

### Interakcje z zewnętrznymi usługami:

**Supabase (PostgreSQL):**
- Weryfikacja JWT tokenu
- Zapis do tabeli `generation_sessions`
- RLS zapewnia izolację danych użytkowników

**OpenRouter API:**
- Endpoint: `https://openrouter.ai/api/v1/chat/completions`
- Metoda: POST
- Nagłówki:
  - `Authorization: Bearer ${OPENROUTER_API_KEY}`
  - `Content-Type: application/json`
- Timeout: 30 sekund
- Retry: 1 próba przy błędzie 5xx

## 6. Względy bezpieczeństwa

### 1. Uwierzytelnianie i autoryzacja
- Każde żądanie musi zawierać prawidłowy JWT token w nagłówku `Authorization: Bearer <token>`
- Token jest weryfikowany przez Supabase przy wywołaniu `auth.getUser()`
- RLS automatycznie zapewnia, że `user_id = auth.uid()` przy zapisie sesji

### 2. Ochrona kluczy API
- `OPENROUTER_API_KEY` przechowywany wyłącznie w zmiennych środowiskowych serwera
- Nigdy nie jest wysyłany do klienta
- Używany tylko w kodzie serwerowym

### 3. Walidacja i sanityzacja danych
```typescript
const GenerateFlashcardsSchema = z.object({
  source_text: z.string().min(100).max(10000),
  language: z.enum(['pl', 'en']).nullable(),
  max_proposals: z.number().int().min(1).max(20).default(20)
});
```



### 5. Ograniczenia rozmiaru żądania
- Maksymalny rozmiar body: 15 KB
- Timeout żądania: 45 sekund
- Maksymalna długość `source_text`: 10000 znaków

### 6. Ochrona przed atakami
- **SQL Injection:** Używanie Supabase SDK z parametryzowanymi zapytaniami
- **Prompt Injection:** Ograniczenie długości `source_text`, walidacja odpowiedzi AI
- **CSRF:** Wymagany JWT token w nagłówku (nie w cookie)

## 7. Obsługa błędów

### Scenariusze błędów i kody statusu

| Scenariusz | Kod | Komunikat |
|------------|-----|-----------|
| `source_text` < 100 znaków | 400 | "source_text must be at least 100 characters" |
| `source_text` > 10000 znaków | 400 | "source_text must not exceed 10000 characters" |
| Nieprawidłowy `language` | 400 | "language must be 'pl', 'en', or null" |
| `max_proposals` poza zakresem | 400 | "max_proposals must be between 1 and 20" |
| Brak tokenu JWT | 401 | "Missing or invalid authentication token" |
| Token wygasł | 401 | "Token has expired" |
| Błąd OpenRouter API | 502 | "AI service temporarily unavailable" |
| Timeout OpenRouter | 504 | "AI service did not respond in time" |
| Błąd zapisu do bazy | 500 | "Failed to save generation session" |


### Struktura obsługi błędów w kodzie

```typescript
export const POST: APIRoute = async (context) => {
  try {
    // 1. Walidacja wejścia
    const validatedData = GenerateFlashcardsSchema.parse(requestBody);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        details: error.errors
      }), { status: 400 });
    }
  }

  try {
    // 2. Autoryzacja
    const { data: { user }, error } = await context.locals.supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid authentication token'
      }), { status: 401 });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Unauthorized'
    }), { status: 401 });
  }

  try {
    // 3. Generowanie propozycji
    const proposals = await aiGenerationService.generateFlashcards(...);
  } catch (error) {
    if (error instanceof OpenRouterTimeoutError) {
      return new Response(JSON.stringify({
        error: 'Gateway timeout'
      }), { status: 504 });
    }
    if (error instanceof OpenRouterError) {
      return new Response(JSON.stringify({
        error: 'Bad gateway'
      }), { status: 502 });
    }
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), { status: 500 });
  }
};
```

## 8. Rozważania dotyczące wydajności

### 1. Potencjalne wąskie gardła

#### a) Wywołanie OpenRouter API (największe wąskie gardło)
- **Czas odpowiedzi:** 5-30 sekund w zależności od modelu i długości tekstu
- **Wpływ:** Blokuje handler endpointu do momentu otrzymania odpowiedzi
- **Mitygacja:**
  - Timeout 30 sekund
  - Wybór szybszego modelu (np. Claude 3 Haiku, GPT-3.5-turbo)
  - Optymalizacja promptu (krótsze instrukcje)

#### b) Obliczanie SHA-256 hash
- **Czas:** ~1-5ms dla 10000 znaków
- **Wpływ:** Minimalny
- **Mitygacja:** Użycie Web Crypto API (natywne, szybkie)

#### c) Zapis do bazy danych
- **Czas:** ~10-50ms
- **Wpływ:** Niski
- **Mitygacja:** Indeksy na `user_id` i `created_at`, connection pooling

### 2. Strategie optymalizacji

#### a) Wybór modelu AI
**Rekomendacja:** Użycie szybszego i tańszego modelu dla MVP

| Model | Czas odpowiedzi | Koszt | Jakość |
|-------|-----------------|-------|--------|
| GPT-4 | 15-30s | Wysoki | Najwyższa |
| GPT-3.5-turbo | 3-8s | Niski | Wysoka |
| Claude 3 Haiku | 2-5s | Niski | Wysoka |

**Implementacja:**
```typescript
const MODEL = 'anthropic/claude-3-haiku'; // Szybki i tani
```

#### b) Optymalizacja promptu
- Krótkie, jasne instrukcje
- Strukturyzowany format odpowiedzi (JSON)
- Przykłady few-shot (2-3 przykłady)
- Ograniczenie długości odpowiedzi (`max_tokens`)

#### c) Caching (opcjonalne, dla przyszłości)
- Cache propozycji na podstawie `source_text_hash`
- TTL: 24 godziny
- Storage: Redis lub in-memory cache
- Oszczędność: Unikanie powtórnych wywołań OpenRouter dla tego samego tekstu

#### d) Connection pooling
- Supabase domyślnie obsługuje connection pooling
- Konfiguracja w `supabase/config.toml`:
  ```toml
  [db.pooler]
  enabled = true
  pool_mode = "transaction"
  default_pool_size = 20
  ```



## 9. Etapy wdrożenia

### Krok 1: Przygotowanie środowiska i konfiguracji
**Czas: 15 min**

1.1. Dodanie zmiennej środowiskowej `OPENROUTER_API_KEY` do `.env`:
```bash
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

1.2. Weryfikacja istniejących zmiennych w `.env`:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Krok 2: Utworzenie schematu walidacji Zod
**Czas: 10 min**

2.1. Utworzenie katalogu `src/lib/validation/`

2.2. Utworzenie pliku `src/lib/validation/ai-generation.schema.ts`:
```typescript
import { z } from 'zod';

export const GenerateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .trim()
    .min(100, 'source_text must be at least 100 characters')
    .max(10000, 'source_text must not exceed 10000 characters'),
  language: z
    .enum(['pl', 'en'])
    .nullable(),
  max_proposals: z
    .number()
    .int('max_proposals must be an integer')
    .min(1, 'max_proposals must be at least 1')
    .max(20, 'max_proposals must not exceed 20')
    .default(20)
});

export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsSchema>;
```

### Krok 3: Implementacja serwisu AI Generation
**Czas: 45 min**

3.1. Utworzenie katalogu `src/lib/services/`

3.2. Utworzenie pliku `src/lib/services/ai-generation.service.ts` z następującymi komponentami:
- Custom error classes: `OpenRouterError`, `OpenRouterTimeoutError`
- Types: `OpenRouterRequest`, `OpenRouterResponse`
- Class `AIGenerationService` z metodami:
  - `generateFlashcards()` - główna metoda generowania
  - `getSystemPrompt()` - budowanie system prompt
  - `buildPrompt()` - budowanie user prompt
  - `callOpenRouter()` - wywołanie API z timeout i retry
  - `parseResponse()` - parsowanie i walidacja odpowiedzi
  - `computeSourceTextHash()` - obliczanie SHA-256 hash
- Factory function: `createAIGenerationService()`

**Kluczowe elementy implementacji:**
- Model: `anthropic/claude-3-haiku` (szybki i tani)
- Timeout: 30 sekund
- Temperature: 0.7
- Max tokens: 4000
- Walidacja każdej propozycji (front_text i back_text)
- Ograniczenie długości do 1000 znaków

### Krok 4: Implementacja serwisu Generation Session
**Czas: 30 min**

4.1. Utworzenie pliku `src/lib/services/generation-session.service.ts`:

**Komponenty:**
- Type: `CreateGenerationSessionParams`
- Class `GenerationSessionService` z metodą:
  - `createSession()` - zapis sesji do bazy danych
- Factory function: `createGenerationSessionService()`

**Implementacja:**
```typescript
async createSession(params: CreateGenerationSessionParams): Promise<GenerationSessionSummaryDTO> {
  const { data, error } = await this.supabase
    .from('generation_sessions')
    .insert({
      user_id: params.userId,
      proposals_count: params.proposalsCount,
      source_text_length: params.sourceTextLength,
      source_text_hash: params.sourceTextHash,
      generate_duration: params.generateDuration,
      accepted_count: 0
    })
    .select('id, proposals_count, source_text_length, created_at')
    .single();

  if (error) throw new Error('Failed to save generation session');
  return data;
}
```

### Krok 5: Utworzenie endpointu API
**Czas: 45 min**

5.1. Utworzenie katalogu `src/pages/api/ai/`

5.2. Utworzenie pliku `src/pages/api/ai/generate.ts`:

**Struktura endpointu:**
```typescript
export const prerender = false;

export const POST: APIRoute = async (context) => {
  // 1. Parse request body
  // 2. Validate input (Zod)
  // 3. Authenticate user
  // 4. Generate flashcards using AI
  // 5. Save generation session
  // 6. Return response
};
```

**Obsługa błędów:**
- Try-catch dla każdego kroku
- Odpowiednie kody statusu (400, 401, 500, 502, 504)
- Logowanie błędów do konsoli
- Zwracanie user-friendly komunikatów

### Krok 6: Testowanie endpointu
**Czas: 30 min**

6.2. Weryfikacja w bazie danych:
```sql
SELECT * FROM generation_sessions ORDER BY created_at DESC LIMIT 5;
```

### Krok 7: Dokumentacja i finalizacja
**Czas: 15 min**

7.1. Aktualizacja dokumentacji API (jeśli istnieje)

7.2. Dodanie komentarzy JSDoc do kluczowych funkcji

7.3. Code review:
- Sprawdzenie zgodności z regułami implementacji
- Weryfikacja obsługi błędów
- Sprawdzenie bezpieczeństwa (brak wycieków kluczy API)

## 10. Podsumowanie

### Pliki do utworzenia:
1. `src/lib/validation/ai-generation.schema.ts` - Schema walidacji Zod
2. `src/lib/services/ai-generation.service.ts` - Serwis komunikacji z OpenRouter
3. `src/lib/services/generation-session.service.ts` - Serwis zarządzania sesjami
4. `src/pages/api/ai/generate.ts` - Endpoint API

### Zależności:
- Wszystkie wymagane typy już istnieją w `src/types.ts`
- Supabase client i middleware już skonfigurowane
- Zod już zainstalowany (do walidacji)

### Szacowany całkowity czas implementacji:
**~2.5 godziny** (włączając testowanie i dokumentację)

### Następne kroki po wdrożeniu:
1. Monitoring metryk wydajności i kosztów
2. Optymalizacja promptu na podstawie feedbacku użytkowników
3. Rozważenie implementacji cachingu dla często używanych tekstów
4. Dodanie testów jednostkowych i integracyjnych
5. Implementacja endpointu `/api/ai/accept` do akceptowania propozycji


