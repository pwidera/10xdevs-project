# API Endpoint Implementation Plan: /flashcards

## 1. Przegląd punktu końcowego
Punkt końcowy zarządza fiszkami użytkownika: tworzenie (pojedyncze lub wsadowe), listowanie z paginacją i filtrowaniem, pobranie pojedynczej fiszki, edycja inline oraz usuwanie. Implementacja zgodna z Supabase (PostgreSQL + RLS) i konwencjami Astro API. Weryfikacja wejścia przez Zod, dostęp wyłącznie dla zalogowanych.

Zakres:
- POST /flashcards — utworzenie 1..20 fiszek (manualnie lub powiązanych z sesją AI)
- GET /flashcards — listowanie z paginacją, filtrowaniem, wyszukiwaniem
- GET /flashcards/{id} — pobranie fiszki
- PUT /flashcards/{id} — edycja pól front_text/back_text
- DELETE /flashcards/{id} — trwałe usunięcie

## 2. Szczegóły żądania
- Metoda/URL:
  - POST /flashcards
  - GET /flashcards
  - GET /flashcards/{id}
  - PUT /flashcards/{id}
  - DELETE /flashcards/{id}

- Parametry i body (zgodne ze specyfikacją):
  - POST body (single): { front_text: string (1..1000), back_text: string (1..1000), origin?: "manual"|"AI_full"|"AI_edited", generation_session_id?: uuid }
  - POST body (batch): [ { ...jak wyżej... }, ... ] (1..20)
  - GET /flashcards query: page (default 1), page_size (1..100, default 20), q (ILIKE na lower(front_text/back_text)), origin (manual|AI_full|AI_edited), sort (created_at_desc|created_at_asc|last_reviewed_at_asc|last_reviewed_at_desc)
  - GET /flashcards/{id}: path param id (uuid)
  - PUT /flashcards/{id} body: { front_text?: string (1..1000), back_text?: string (1..1000) }
  - DELETE /flashcards/{id}: path param id (uuid)

- Reguły biznesowe kluczowe:
  - origin domyślnie "manual".
  - Jeśli origin IN ("AI_full","AI_edited") ⇒ generation_session_id jest WYMAGANE i musi należeć do bieżącego użytkownika.
  - Jeśli origin = "manual" ⇒ generation_session_id MUSI być null.
  - Operacja wsadowa jest transakcyjna (all-or-nothing), max 20 pozycji.
  - user_id i generation_session_id są niezmienne; origin może się zmienić wyłącznie AI_full → AI_edited (DB trigger przy zmianie treści).

## 3. Wykorzystywane typy
- Z pliku src/types.ts (gotowe DTO/Command):
  - CreateFlashcardCommand, CreateFlashcardsBatchCommand, CreateFlashcardsResponse
  - FlashcardsListQuery, FlashcardsListResponse, FlashcardDTO
  - UpdateFlashcardCommand, UpdateFlashcardResponse
  - DeleteFlashcardResponse
  - FlashcardOrigin, FlashcardSortOption

- Schematy Zod (do dodania w src/lib/validation/flashcards.schema.ts):
  - CreateFlashcardSchema, CreateFlashcardsBatchSchema (trim + 1..1000; batch length 1..20)
  - FlashcardsListQuerySchema (page>=1, page_size 1..100, sort enum, origin enum, q string optional)
  - UpdateFlashcardSchema (co najmniej 1 pole; każde 1..1000 po trim)
  - IdParamSchema (uuid)

## 3. Szczegóły odpowiedzi
- POST /flashcards → 201 Created
  { saved_count: number, flashcards: [ { id, front_text, back_text, origin, generation_session_id|null, created_at, updated_at } ] }

- GET /flashcards → 200 OK
  { items: [ { id, front_text, back_text, origin, last_reviewed_at|null, created_at, updated_at } ], page, page_size, total }

- GET /flashcards/{id} → 200 OK
  { id, front_text, back_text, origin, last_reviewed_at|null, created_at, updated_at }

- PUT /flashcards/{id} → 200 OK
  { id, front_text, back_text, origin, updated_at }

- DELETE /flashcards/{id} → 200 OK
  { success: true }

- Kody błędów:
  - 400 Validation error (w batch: per-item details)
  - 401 Unauthorized
  - 403 Forbidden (np. sesja nie należy do użytkownika)
  - 404 Not found (fiszka lub sesja nie istnieje)
  - 422 Unprocessable Entity (batch > 20; origin/session mismatch)
  - 500 Internal server error

## 4. Przepływ danych
- Autoryzacja: Astro middleware ustawia context.locals.supabase i context.locals.user (Supabase JWT). Wszystkie zapytania DB przez tego klienta, honorując RLS.
- POST /flashcards:
  1) Parsowanie JSON + walidacja Zod (trim tekstów, 1..1000; batch 1..20).
  2) Ustal origin (default manual). Dla AI_*: zbierz unikalne generation_session_id, zweryfikuj, że istnieją i należą do usera (SELECT id FROM generation_sessions WHERE id IN (...) LIMIT ...). Jeśli którykolwiek brak/nie dostępny → 404 (lub 403 jeśli możliwe rozróżnienie), albo 422 dla mismatch manual/AI_* z session_id.
  3) Zbuduj rekordy insert: user_id = auth.uid(), pola front/back/origin/generation_session_id.
  4) INSERT w jednej operacji (Supabase .insert([...]).select(...)) — transakcyjność w obrębie tabeli zapewnia all-or-nothing.
  5) Zwróć 201 z listą zapisanych fiszek i saved_count.

- GET /flashcards:
  1) Parsowanie query + walidacja (page/page_size/sort/origin/q).
  2) Budowa zapytania: filtr po origin (opcjonalnie), wyszukiwanie q przez .or("front_text.ilike.%q%,back_text.ilike.%q%") po lower() (GIN trgm).
  3) Sortowanie wg sort param.
  4) Paginacja: .range(offset, offset+page_size-1) oraz select z { count: 'exact' } → total.
  5) Zwróć 200 z items/page/page_size/total.

- GET /flashcards/{id}:
  1) Walidacja id (uuid), SELECT ... .eq('id', id).single() (RLS ogranicza do swojego usera).
  2) 200 z rekordem lub 404.

- PUT /flashcards/{id}:
  1) Walidacja body (co najmniej 1 pole; każde 1..1000 po trim), walidacja id.
  2) UPDATE ... .eq('id', id).select('id, front_text, back_text, origin, updated_at').single(). Origin pozostaje wg DB (trigger może zmienić AI_full→AI_edited).
  3) 200 z rekordem lub 404 (brak dostępu/nie istnieje) lub 400 (walidacja).

- DELETE /flashcards/{id}:
  1) Walidacja id.
  2) DELETE ... .eq('id', id) z .select('id') lub .throwOnError(false); jeśli brak rekordu → 404.
  3) 200 { success: true }.

## 5. Względy bezpieczeństwa
- Uwierzytelnianie: Supabase JWT (middleware). Endpointy wymagają zalogowania (401 jeśli brak/nieprawidłowy token).
- Autoryzacja: RLS na generation_sessions i flashcards (user_id = auth.uid()). Brak możliwości dostępu do cudzych rekordów.
- Walidacja danych: Zod (limity długości, zakresy, enumy). Trim wejść przed walidacją.
- Ochrona przed nadużyciami: limity page_size (≤100), batch (≤20), długości pól (≤1000). Debounce po stronie UI.
- CORS: pozostaje zgodnie z konfiguracją Astro; API używane z tego samego origin.
- Sekrety: brak ekspozycji kluczy; brak połączeń z usługami zewnętrznymi w tych endpointach.

## 6. Obsługa błędów
- Kształt odpowiedzi (spójny z istniejącymi endpointami): { error: string, message?: string, details?: any }.
- Mapowanie:
  - 400: ZodError → details: lista błędów (dla batch: per item { index, field_errors }).
  - 401: brak/nieprawidłowy JWT (auth.getUser()).
  - 403: wykryta niespójność własności sesji (jeśli możliwa do ustalenia), w praktyce RLS często skutkuje 404.
  - 404: rekord nie istnieje albo nie jest widoczny przez RLS.
  - 422: semantyczne błędy (batch >20, origin/session mismatch).
  - 500: nieoczekiwany błąd DB lub serwera (log do konsoli z requestId i user_id).

- Logowanie błędów: console.error z minimalnym kontekstem (route, user_id, requestId). Brak tabeli logów w DB — opcjonalnie można dodać w przyszłości (out of scope).

## 7. Rozważania dotyczące wydajności
- Indeksy z db-plan.md: btree (user_id, created_at), (user_id, last_reviewed_at, created_at), (user_id, origin) oraz GIN trgm na lower(front_text/back_text) — wykorzystywać zgodnie z sortem i wyszukiwaniem.
- Paginacja z exact count — przy dużej skali rozważyć paginację kursorową i count asynchroniczny.
- Jedno wstawienie batch (insert([...])) zamiast wielu pojedynczych insertów.
- Minimalne projekcje kolumn w SELECT/UPDATE.
- Trimowanie i wstępna walidacja przed DB redukuje błędne round-tripy.

## 8. Etapy wdrożenia
1) Typy i walidacje
   - Potwierdź użycie istniejących typów z src/types.ts.
   - Dodaj plik src/lib/validation/flashcards.schema.ts z: CreateFlashcardSchema, CreateFlashcardsBatchSchema, FlashcardsListQuerySchema, UpdateFlashcardSchema, IdParamSchema.

2) Warstwa usług
   - Utwórz src/lib/services/flashcard.service.ts (ekstrakcja logiki DB):
     - createOne(cmd: CreateFlashcardCommand, userId: string)
     - createBatch(cmds: CreateFlashcardsBatchCommand, userId: string)
     - list(query: FlashcardsListQuery, userId: string)
     - getById(id: string)
     - update(id: string, cmd: UpdateFlashcardCommand)
     - delete(id: string)
   - Weryfikacja generation_session_id: SELECT z generation_sessions dla usera, zbiorem unikalnych id; brak → 404/403; mismatch manual/AI_* → 422.

3) Endpointy Astro (export const prerender = false)
   - src/pages/api/flashcards/index.ts:
     - GET: autoryzacja → walidacja query → list() → 200
     - POST: autoryzacja → walidacja body → createOne/createBatch → 201
   - src/pages/api/flashcards/[id].ts:
     - GET: autoryzacja → walidacja id → getById → 200/404
     - PUT: autoryzacja → walidacja id+body → update → 200/400/404
     - DELETE: autoryzacja → walidacja id → delete → 200/404

4) Zgodność z regułami implementacji
   - Używaj context.locals.supabase (nie importuj klienta bezpośrednio).
   - Walidacja Zod; separacja do services; statusy HTTP zgodnie ze spec.

5) Testy (minimalny zakres)
   - Jednostkowe: walidacje Zod (szczególnie batch, q/sort/page_size, trim). 
   - Integracyjne (MSW lub realna baza dev):
     - POST single/manual, POST batch AI_* (z poprawną sesją), POST batch >20 → 422, mismatch → 422.
     - GET list z q/origin/sort/paginacją → poprawne total/order.
     - GET/PUT/DELETE {id} (w tym 404/401).

6) Dokumentacja
   - Uzupełnij README/API docs o przykłady request/response i kody błędów.

## 9. Mapowanie błędów i kody stanu (referencyjnie)
- 200 OK: GET /flashcards, GET /flashcards/{id}, PUT /flashcards/{id}
- 201 Created: POST /flashcards
- 400 Bad Request: błędne dane (ZodError, długości <1 lub >1000, pusty batch)
- 401 Unauthorized: brak/nieprawidłowy JWT
- 403 Forbidden: sesja generowania nie należy do użytkownika (jeśli wykrywalne)
- 404 Not Found: fiszka lub sesja nie istnieje (albo ukryta przez RLS)
- 422 Unprocessable Entity: batch >20; origin/session mismatch (manual z session_id lub AI_* bez session_id)
- 500 Internal Server Error: inne błędy serwera/DB

