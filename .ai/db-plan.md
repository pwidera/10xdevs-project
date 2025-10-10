## 1. Tabele, kolumny, typy i ograniczenia

### 1.1. Typy niestandardowe
- flashcard_origin (ENUM): 'AI_full', 'AI_edited', 'manual'

### 1.2. Tabela: generation_sessions
- id: uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
- user_id: uuid, NOT NULL, FK → auth.users(id) ON DELETE CASCADE
- proposals_count: smallint, NOT NULL, CHECK (proposals_count BETWEEN 0 AND 20)
- accepted_count: smallint, NOT NULL, CHECK (accepted_count BETWEEN 0 AND proposals_count)
- acceptance_rate: numeric(5,4), GENERATED ALWAYS AS (accepted_count::numeric / NULLIF(proposals_count, 0)) STORED
- generate_duration: integer, NULLABLE, CHECK (generate_duration >= 0) — czas generowania w milisekundach
- source_text_length: smallint, NOT NULL, CHECK (source_text_length BETWEEN 100 AND 10000)
- source_text_hash: text, NOT NULL, CHECK (char_length(source_text_hash) = 64) — np. SHA-256 (hex)
- created_at: timestamptz, NOT NULL, DEFAULT now()

Ograniczenia i uwagi:
- Prosty rejestr metryk każdej sesji generowania (bez przechowywania surowych wejść i odrzuconych propozycji).
- Zgodność z PRD: source_text_length odzwierciedla zakres wejścia (100–10000 znaków); przechowujemy wyłącznie skrót źródła.

### 1.3. Tabela: flashcards
- id: uuid, PRIMARY KEY, DEFAULT gen_random_uuid()
- user_id: uuid, NOT NULL, FK → auth.users(id) ON DELETE CASCADE
- front_text: text, NOT NULL, CHECK (char_length(front_text) BETWEEN 1 AND 1000)
- back_text: text, NOT NULL, CHECK (char_length(back_text) BETWEEN 1 AND 1000)
- origin: flashcard_origin, NOT NULL
- generation_session_id: uuid, NULLABLE, FK → generation_sessions(id) ON DELETE RESTRICT
- last_reviewed_at: timestamptz, NULLABLE
- created_at: timestamptz, NOT NULL, DEFAULT now()
- updated_at: timestamptz, NOT NULL, DEFAULT now()

Ograniczenia i uwagi:
- Spójność origin ↔ generation_session_id:
  - Jeśli origin IN ('AI_full','AI_edited') ⇒ generation_session_id IS NOT NULL
  - Jeśli origin = 'manual' ⇒ generation_session_id IS NULL
- Niezmienność wybranych pól (wymuszana triggerami):
  - user_id i generation_session_id niezmienne po utworzeniu rekordu
  - origin może zmienić się wyłącznie z 'AI_full' → 'AI_edited' (np. po edycji treści)
- Brak unikalności treści; dozwolone duplikaty front_text/back_text.


## 2. Relacje między tabelami
- auth.users 1 ↔ N generation_sessions (FK: generation_sessions.user_id → auth.users.id, ON DELETE CASCADE)
- auth.users 1 ↔ N flashcards (FK: flashcards.user_id → auth.users.id, ON DELETE CASCADE)
- generation_sessions 1 ↔ N flashcards (FK: flashcards.generation_session_id → generation_sessions.id, ON DELETE RESTRICT)

Kardynalność i reguły:
- Fiszki pochodzące z AI są powiązane z konkretną sesją generowania (AI_full/AI_edited)
- Fiszki ręczne (origin = 'manual') nie mają powiązania z sesją generowania
- Usunięcie konta użytkownika kaskadowo usuwa jego sesje generowania i fiszki
- Sesji generowania nie można usunąć, jeśli istnieją do niej przypięte fiszki (RESTRICT)


## 3. Indeksy

Wymagane rozszerzenie: pg_trgm (dla wyszukiwania ILIKE po tekście)

### 3.1. generation_sessions
- PK: generation_sessions_pkey (id)
- IDX: generation_sessions_user_created_at_idx (btree(user_id, created_at DESC)) — listowanie sesji użytkownika po czasie
- IDX: generation_sessions_source_text_hash_idx (btree(source_text_hash)) — szybkie wyszukiwanie sesji po skrócie źródła

### 3.2. flashcards
- PK: flashcards_pkey (id)
- IDX: flashcards_user_id_idx (btree(user_id)) — filtrowanie danych per użytkownik
- IDX: flashcards_user_created_at_idx (btree(user_id, created_at DESC)) — listy/stronicowanie
- IDX: flashcards_user_reviewed_created_idx (btree(user_id, last_reviewed_at, created_at)) — wybór 5 fiszek wg last_reviewed_at ASC NULLS FIRST, created_at ASC
- IDX: flashcards_user_origin_idx (btree(user_id, origin)) — raportowanie udziału AI vs manual
- GIN: flashcards_front_text_trgm_idx (GIN(lower(front_text) gin_trgm_ops)) — wyszukiwanie ILIKE
- GIN: flashcards_back_text_trgm_idx (GIN(lower(back_text) gin_trgm_ops)) — wyszukiwanie ILIKE


## 4. Zasady PostgreSQL (RLS, triggery, rozszerzenia)

### 4.1. Rozszerzenia
- CREATE EXTENSION IF NOT EXISTS pg_trgm;

### 4.2. RLS (Row Level Security)
Włączone RLS dla: generation_sessions, flashcards.

Polityki (Supabase-kompatybilne):
- SELECT: USING (user_id = auth.uid())
- INSERT: WITH CHECK (user_id = auth.uid())
- UPDATE: USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())
- DELETE: USING (user_id = auth.uid())

Uwagi:
- Rola service_role omija RLS zgodnie z mechaniką Supabase
- Opcjonalnie: domyślne ustawianie user_id = auth.uid() w BEFORE INSERT, jeśli aplikacja nie ustawia jawnie

### 4.3. Triggery i funkcje
- Aktualizacja znacznika czasu:
  - BEFORE UPDATE ON flashcards → ustaw updated_at = now()
- Immutability i logika origin:
  - BEFORE UPDATE ON flashcards
    - Zablokuj zmianę user_id
    - Zablokuj zmianę generation_session_id
    - Dopuść zmianę origin wyłącznie z 'AI_full' do 'AI_edited'; w innych przypadkach odrzuć
- Spójność origin ↔ generation_session_id (opcjonalnie oprócz CHECK):
  - BEFORE INSERT/UPDATE waliduje reguły:
    - (origin IN ('AI_full','AI_edited') ⇒ generation_session_id IS NOT NULL)
    - (origin = 'manual' ⇒ generation_session_id IS NULL)


## 5. Dodatkowe uwagi i uzasadnienia
- Normalizacja: 3NF — brak decków/tagów w MVP upraszcza model; w przyszłości można dodać tabele decków/tagów oraz events (review_events) i np. next_due_at
- Wydajność wyszukiwania: trigramy na lower(front_text/back_text) pokrywają ILIKE w PL/EN; przy większej skali ewentualnie dedykowany full-text search
- Dobór 5 fiszek do nauki: ORDER BY last_reviewed_at ASC NULLS FIRST, created_at ASC LIMIT 5 — wsparty btree(user_id, last_reviewed_at, created_at)
- Telemetria jakości AI: proposals_count, accepted_count, acceptance_rate w generation_sessions; fiszki AI powiązane referencją dla audytu
- Spójność i kasowanie: FK do auth.users z ON DELETE CASCADE zapewnia usunięcie wszystkich danych użytkownika zgodnie z PRD
- Typy i zakresy: smallint dla liczników sesji (0–20), numeric(5,4) dla współczynnika akceptacji (unikamy błędów FP)
- Zgodność z Supabase: RLS oparte na auth.uid(); brak potrzeby przechowywania surowych danych we/wy modeli AI w MVP
