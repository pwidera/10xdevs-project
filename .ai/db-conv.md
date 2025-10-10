<conversation_summary>
<decisions>
1. Użytkownicy: źródło prawdy Supabase Auth; we własnych tabelach używamy user_id (uuid) z FK do auth.users(id) ON DELETE CASCADE.
2. Brak encji decków/tagów w MVP.
3. Flashcards – pola: id (uuid), user_id, front_text (text, 1–1000, NOT NULL), back_text (text, 1–1000, NOT NULL), origin (ENUM: AI_full|AI_edited|manual), generation_session_id (uuid, NULL dla manual), last_reviewed_at (timestamptz, NULL), created_at/updated_at (timestamptz).
4. origin jako Postgres ENUM (flashcard_origin).
5. Zmiana origin: AI_full → AI_edited przy edycji treści; w innym wypadku origin pozostaje niezmienny.
6. Fiszki AI powiązane z generation_sessions (generation_session_id); manualne mają NULL.
7. generation_sessions bez pól model_name/provider.
8. Brak zapisu surowego wejścia i odrzuconych propozycji AI.
9. Ograniczenia: CHECK długości front/back (1–1000); NOT NULL; reguły spójności dla origin ↔ generation_session_id.
10. acceptance_rate w generation_sessions – kolumna generowana (stored) z accepted_count/proposals_count.
11. Sesja nauki: wybór 5 fiszek wg ORDER BY last_reviewed_at ASC NULLS FIRST, created_at ASC LIMIT 5.
12. Brak pola next_due_at w MVP.
13. Zdarzenia nauki: tylko aktualizacja last_reviewed_at; bez tabeli review_events.
14. Wyszukiwanie: ILIKE; indeksy GIN pg_trgm na lower(front_text), lower(back_text).
15. Indeksy: flashcards PK(id); (user_id); (user_id, created_at DESC); (user_id, last_reviewed_at, created_at); (user_id, origin). generation_sessions PK(id); (user_id, created_at DESC).
16. Duplikaty treści dozwolone (brak unikatowych ograniczeń front+back per user).
18. Usunięcie konta: kaskadowe usuwanie fiszek i sesji (FK do auth.users ON DELETE CASCADE).
19. Spójność origin/generation_session_id wymuszona: AI_* ⇒ wymagane generation_session_id, manual ⇒ generation_session_id IS NULL; dozwolona tylko zmiana origin AI_full → AI_edited.
20. Niezmienność: user_id i generation_session_id niezmienne po utworzeniu; origin – tylko dozwolona zmiana jak wyżej.
</decisions>

<matched_recommendations>
1. Użycie Supabase Auth jako źródła userów i FK do auth.users(id) z ON DELETE CASCADE (zgodne z 1, 18).
2. Brak decków/tagów w MVP (zgodne z 2).
3. Model flashcards z polami i ograniczeniami długości, NOT NULL (zgodne z 3, 9).
4. origin jako ENUM i reguły spójności z generation_session_id (zgodne z 4, 19).
5. Dopuszczenie zmiany origin przy edycji: AI_full → AI_edited (zgodne z 5, 19, 20).
6. Powiązanie fiszek AI z generation_sessions; manualne bez powiązania (zgodne z 6, 19).
7. generation_sessions: metryki bez model/provider; acceptance_rate jako kolumna generowana (zgodne z 7, 10).
8. Brak przechowywania wejścia/propozycji AI (zgodne z 8).
9. Strategia wyboru 5 fiszek do nauki i odpowiednie indeksy (zgodne z 11, 15).
10. Wyszukiwanie ILIKE wsparte GIN pg_trgm (zgodne z 14, 15).
</matched_recommendations>

<database_planning_summary>
Główne wymagania schematu:
- Minimalny model danych do zarządzania fiszkami Q&A, z rozróżnieniem pochodzenia (AI_full/AI_edited/manual) oraz podstawową telemetrią generowania i prostą nauką bez ocen.
- Izolacja danych per użytkownik i możliwość trwałego usuwania danych wraz z kontem.

Kluczowe encje i relacje:
- auth.users (Supabase) – źródło prawdy dla użytkowników.
- generation_sessions: id, user_id(FK→auth.users ON DELETE CASCADE), proposals_count (0–20), accepted_count (0..proposals_count), acceptance_rate (generated), created_at (timestamptz).
- flashcards: id, user_id(FK→auth.users ON DELETE CASCADE), front_text, back_text, origin (ENUM), generation_session_id (FK→generation_sessions, NULL dla manual), last_reviewed_at, created_at, updated_at.
- Relacje: auth.users 1↔N flashcards; auth.users 1↔N generation_sessions; generation_sessions 1↔N flashcards (tylko dla AI_*).

Typy danych i ograniczenia:
- front_text/back_text: text + CHECK char_length BETWEEN 1 AND 1000, NOT NULL.
- origin: ENUM flashcard_origin ('AI_full','AI_edited','manual').
- generation_sessions: CHECK (proposals_count BETWEEN 0 AND 20) oraz (accepted_count BETWEEN 0 AND proposals_count); acceptance_rate = generated stored numeric(5,4) = accepted_count/NULLIF(proposals_count,0).
- Spójność: CHECK dla origin/generation_session_id: AI_* ⇒ NOT NULL, manual ⇒ NULL.
- Niezmienność: trigger BEFORE UPDATE blokujący zmiany user_id i generation_session_id; origin – tylko AI_full → AI_edited.

Strategie indeksowania i wydajność:
- flashcards: PK(id); idx(user_id); idx(user_id, created_at DESC); idx(user_id, last_reviewed_at, created_at) dla wyboru 5 fiszek; idx(user_id, origin) dla raportów; GIN pg_trgm na lower(front_text), lower(back_text) dla ILIKE.
- generation_sessions: PK(id); idx(user_id, created_at DESC).
- Zapytania nauki: ORDER BY last_reviewed_at ASC NULLS FIRST, created_at ASC LIMIT 5.

Bezpieczeństwo i RLS:
- Dane użytkowników izolowane per user_id; FK do auth.users zapewnia kaskadowe usuwanie.
- Zalecane RLS (do potwierdzenia): SELECT/INSERT/UPDATE/DELETE tylko gdy user_id = auth.uid(); WITH CHECK user_id = auth.uid(); service_role omija RLS.
- Dodatkowe zabezpieczenia: default user_id = auth.uid() przy INSERT; triggery immutability jak wyżej.

Skalowalność:
- Brak partycjonowania w MVP; indeksy pokrywają najważniejsze przypadki. Trigramy zapewnią przyzwoitą wydajność wyszukiwania PL/EN.
- Możliwość przyszłego rozszerzenia o decki/tagi, review_events, next_due_at bez łamania istniejących kontraktów.

Implementacja specyficzna dla PostgreSQL/Supabase:
- Wymaga rozszerzenia pg_trgm do indeksów GIN na ILIKE.
- Triggery updated_at (BEFORE UPDATE) oraz triggery blokujące zmiany pól immutowalnych.
- ENUM flashcard_origin.
</database_planning_summary>

<unresolved_issues>
1. Polityki RLS – czy przyjąć dokładnie: SELECT/INSERT/UPDATE/DELETE z USING/WITH CHECK user_id = auth.uid() dla obu tabel? (Nie potwierdzono wprost punktu 17.)
2. Nazewnictwo: last_reviewed_at vs reviewed_at – ujednolicić (w odpowiedzi padło "reviewed_at").
3. Precyzja typu acceptance_rate (np. numeric(5,4) vs double precision) i czy ma być STORED generated czy liczona w widoku.
4. Czy dozwolone jest usunięcie generation_session mającej powiązane fiszki? (RESTRICT sugerowane, ale nieuzgodnione.)
5. Potwierdzenie włączenia rozszerzenia pg_trgm w środowisku Supabase.
6. Semantyka zmiany origin: czy wymuszać zmianę tylko gdy front_text/back_text faktycznie różnią się od wersji akceptowanej? (Trigger porównujący treść.)
7. Dokładny format i strefa czasowa dla timestamptz (domyślnie UTC).
</unresolved_issues>
</conversation_summary>

