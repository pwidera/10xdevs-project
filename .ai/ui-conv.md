<conversation_summary>
<decisions>
1. Ustalenie kluczowych widoków zgodnie z rekomendacją: Auth, Dashboard, Generator AI + Przegląd propozycji, Lista fiszek (wyszukiwanie/filtry/edycja inline), Dodaj fiszkę, Sesja nauki (5), Ustawienia konta, Generation Sessions.
2. Dashboard z CTA do Generate/Study/Add manual oraz skrótem do ostatniej sesji nauki i linkiem do Generation Sessions.
3. Generator AI z selektorem języka (pl/en/null) i kontrolą max_proposals z walidacją.
4. Lista propozycji z akcjami jednostkowymi i zbiorczymi; sticky action bar.
5. Akceptacja AI: pojedynczy POST /ai/accept z wybranymi kartami, komunikat o powodzeniu.
6. Rezygnacja z ostrzeżeń/notek o braku zapisu propozycji przed akceptacją.
7. Widok Generation Sessions włączony.
8. Parametr q w /flashcards: zatwierdzony jako pole wyszukiwania (case-insensitive).
9. Paginacja listy fiszek: standardowa, bez udziwnień (page_size ~20).
10. Usuwanie fiszki: z potwierdzeniem i toastem sukcesu.
11. Nawigacja: top navbar + sidebar (desktop), burger na mobile.
12. Język interfejsu: tylko PL w MVP.
13. Edycja inline: przyciski Zapisz/Anuluj; Enter=Zapisz, Esc=Anuluj; loader/toast.
14. Szczegóły sesji generowania z linkiem do filtrowania listy fiszek po generation_session_id.
</decisions>

<matched_recommendations>
1. Hierarchia widoków i nawigacja jak w punkcie 1, 2, 11.
2. Generator AI: selektor języka i max_proposals; walidacje po stronie UI.
3. Propozycje AI: lista kart z akcjami akceptuj/odrzuć i akcjami zbiorczymi; jeden POST /ai/accept po wyborze.
4. Lista fiszek: wyszukiwanie „q” z debounce, paginacja standardowa, potwierdzenie usuwania, edycja inline z walidacją.
5. Generation Sessions: lista i szczegóły; filtrowanie fiszek po session_id z widoku szczegółów.
6. Nawigacja: top navbar + sidebar (desktop), burger (mobile); interfejs w języku PL.
</matched_recommendations>

<ui_architecture_planning_summary>
a. Główne wymagania UI:
- Szybkie generowanie i selekcja fiszek AI bez trwałego zapisu przed akceptacją.
- Pełny CRUD fiszek (create, list/search, inline edit, delete).
- Prosta nauka w porcjach po 5 kart bez ocen.
- Telemetria sesji generowania i widok sesji.
- Autentykacja (Supabase) i izolacja danych użytkownika.

b. Kluczowe widoki i przepływy:
- Auth: Logowanie/Rejestracja/Reset/Logout zgodnie z PRD.
- Dashboard: CTA do Generatora, Nauki i Dodawania; skrót do ostatniej sesji/ostatniego batcha; link do Generation Sessions.
- Generator AI: Textarea (100–10000), selektor języka i max_proposals; po POST /ai/generate wyświetlenie do 20 propozycji z akcjami jednostkowymi i zbiorczymi; po wyborze POST /ai/accept → toast z liczbą zapisanych.
- Lista fiszek: wyszukiwanie „q” (front/back), filtr origin (opcjonalnie), sort domyślnie created_at_desc; paginacja standardowa; edycja inline (Zapisz/Anuluj); usuwanie z potwierdzeniem.
- Dodaj fiszkę: formularz front/back z walidacją i licznikiem znaków.
- Sesja nauki: prezentacja 5 kart, reveal odpowiedzi, przyciski poprzednie/następne; po zakończeniu batch przygotowane wywołanie mark-reviewed (szczegóły do doprecyzowania).
- Generation Sessions: lista (najnowsze pierwsze) i szczegóły; z detalu link filtrujący listę fiszek po session_id.

c. Integracja z API i zarządzanie stanem:
- Autoryzacja: Supabase JWT Bearer w Authorization; guardy tras po 401.
- Wywołania: 
  - /ai/generate → render lokalny propozycji (bez zapisu),
  - /ai/accept → zapis zaakceptowanych (origin=AI_full),
  - /flashcards (GET/POST/PUT/DELETE) → CRUD i wyszukiwanie „q”,
  - /study/batch oraz /study/mark-reviewed → przepływ nauki,
  - /generation-sessions (GET) → telemetria.
- Stan i cache: TanStack Query (propozycja) dla zapytań; invalidacje po akceptacji/CRUD; optimistic updates dla edycji i usuwania; debounce wyszukiwania.
- Błędy: mapowanie 400/422 do błędów pól, 401 do logowania, 403/404 do notyfikacji, 429 do komunikatu z retry, 5xx toast + ponów (do potwierdzenia).

d. Responsywność, dostępność, bezpieczeństwo:
- Responsywność: layout mobile-first; sidebar chowany w burger na mobile; siatka kart 1–4 kolumny w zależności od szerokości.
- Dostępność: semantyczne buttony, focus ring, klawiaturowa obsługa edycji i akcji; kontrast AA; redukcja animacji (do doprecyzowania).
- Bezpieczeństwo: brak ekspozycji kluczy AI; wszystkie wywołania AI przez backend; tokeny przez Supabase SDK; CORS ograniczony do frontu.

e. Nierozwiązane przepływy szczegółowe:
- Zachowanie sesji nauki: dokładny moment POST /study/mark-reviewed (po każdej karcie vs po batchu), wsparcie „poprzednie” i cache lokalny kolejności.
- Strategia błędów i retry dla /ai/generate (timeout/cancel/retry).
- Filtry „origin” i „sort” w UI listy (włączone w MVP czy później).
- Szczegóły dostępności (ARIA dla reveal/flip), skróty klawiaturowe i gesty.
- Szczegóły zarządzania stanem (czy na pewno TanStack Query) i polityka invalidacji.
</ui_architecture_planning_summary>

<unresolved_issues>
1. Sesja nauki: zatwierdzenie momentu wywołania /study/mark-reviewed oraz zachowanie „poprzednie/następne”.
2. Decyzja o wdrożeniu filtrów origin/sort na liście w MVP.
3. Dokładne wytyczne a11y (ARIA role, klawisze skrótów, prefers-reduced-motion).
4. Strategia obsługi 429/timeout dla /ai/generate (UI throttle, retry policy).
5. Wybór biblioteki do zarządzania stanem/zapytań (TanStack Query) – potwierdzenie.
</unresolved_issues>
</conversation_summary>
