# Architektura UI dla 10xFlashAI

## 1. Przegląd struktury UI

Aplikacja 10xFlashAI to narzędzie do szybkiego tworzenia i nauki fiszek (Q&A) z pomocą AI. UI organizuje się wokół trzech głównych obszarów:
- Tworzenie fiszek: generator AI (propozycje bez zapisu do czasu akceptacji) + ręczne dodawanie.
- Zarządzanie fiszkami: lista z wyszukiwaniem, edycją inline i usuwaniem.
- Nauka: proste sesje w porcjach po 5 fiszek z rejestrowaniem przeglądu.
Dodatkowo: uwierzytelnianie, ustawienia konta oraz telemetria sesji generowania (Generation Sessions).

Nawigacja: top navbar z dostępem do profilu/wylogowania oraz lewy sidebar (desktop) z linkami do: Dashboard, Generate, Flashcards, Study, Generation Sessions, Account. Na mobile – burger menu.

## 2. Lista widoków

### 2.1 Auth – Rejestracja
- Ścieżka widoku: /auth/register
- Główny cel: Utworzenie konta (email + hasło) w Supabase Auth.
- Kluczowe informacje do wyświetlenia: Formularz (email, hasło, potwierdzenie), walidacje, komunikaty błędów.
- Kluczowe komponenty widoku: TextInput (email), PasswordInput x2, Button „Zarejestruj”, Link do logowania, Alert błędu.
- UX/a11y/bezpieczeństwo:
  - Walidacja form po blur i przy submit; focus na pierwszym błędnym polu.
  - Czytelne komunikaty błędów; wsparcie klawiatury i screen readerów (label/aria-describedby).
  - Hasło nie logowane; maskowanie; polityka minimalnej długości.
- API/Integracja: Supabase Auth – signUp.
- Historyjki: US-001.

### 2.2 Auth – Logowanie
- Ścieżka widoku: /auth/login
- Główny cel: Uwierzytelnienie użytkownika i przekierowanie do /app (Dashboard).
- Kluczowe informacje: Formularz (email, hasło), błędy.
- Komponenty: TextInput, PasswordInput, Button „Zaloguj”, Link do rejestracji.
- UX/a11y/bezpieczeństwo: Przekierowanie po sukcesie; blokada tras /app* dla niezalogowanych; pamiętanie stanu ładowania.
- API: Supabase Auth – signIn; obsługa 401.
- Historyjki: US-002.

### 2.3 Auth – Zmiana hasła
- Ścieżka widoku: /app/account/change-password
- Główny cel: Zmiana hasła.
- Kluczowe informacje: Formularz (aktualne hasło opcjonalnie/nowe/konfirmacja), komunikaty.
- Komponenty: PasswordInput x2/3, Button „Zmień hasło”, Alert sukcesu/błędu.
- UX/a11y/bezpieczeństwo: Walidacje długości i zgodności; focus management; brak wycieków treści.
- API: Supabase Auth – update password.
- Historyjki: US-003.

### 2.4 Auth – Wylogowanie
- Ścieżka widoku: Akcja z top navbar (brak dedykowanej trasy)
- Cel: Zakończenie sesji i powrót do /auth/login.
- API: Supabase Auth – signOut.
- Historyjki: US-017.

### 2.5 Account – Usunięcie konta
- Ścieżka widoku: /app/account/delete
- Główny cel: Trwałe usunięcie konta i powiązanych fiszek (po potwierdzeniu).
- Kluczowe informacje: Ostrzeżenie o nieodwracalności; modal potwierdzenia.
- Komponenty: DangerButton, ConfirmDialog, Toast.
- UX/a11y/bezpieczeństwo: Wymagane jasne potwierdzenie (np. wpisanie „USUŃ”); po sukcesie wylogowanie; RLS po stronie DB.
- API: dedykowana akcja backendowa (zgodna z politykami RLS); po sukcesie signOut.
- Historyjki: US-004.

### 2.6 Dashboard
- Ścieżka widoku: /app
- Główny cel: Szybkie wejście w główne działania i status skrótowy.
- Kluczowe informacje: CTA do Generate/Study/Add manual; skrót do ostatniej sesji nauki; link do Generation Sessions.
- Komponenty: Cards z CTA, Recent activity, Linki szybkiego startu.
- UX/a11y/bezpieczeństwo: Prosty układ kart; responsywność; treści dostępne tylko dla zalogowanych.
- API: brak bezpośrednich wywołań; linki nawigacyjne.
- Historyjki: wspiera US-005..US-015 pośrednio.

### 2.7 Generator AI (Wejście + Propozycje)
- Ścieżka widoku: /app/generate
- Główny cel: Wklejenie tekstu i wygenerowanie do 20 propozycji fiszek; selekcja i akceptacja.
- Kluczowe informacje: Textarea 100–10000 znaków (licznik), selektor języka (pl/en/null), max_proposals (1–20), lista propozycji po wygenerowaniu.
- Komponenty: Textarea z licznikiem, Select (język), NumberInput (max_proposals), Button „Generuj”, ProposalCard (front/back), BulkActionBar („zatwierdź/odrzuć pozostałe”), Button „Zapisz wybrane”.
- UX/a11y/bezpieczeństwo:
  - Walidacje długości po stronie UI; disabled dla przycisku poniżej 100 lub powyżej 10000 znaków.
  - Propozycje nie są zapisywane do czasu akceptacji; widoczny komunikat o utracie propozycji przy odświeżeniu (US-016).
  - Focus management i obsługa klawiatury (akceptuj/odrzuć); wysokie kontrasty; flip/reveal dostępny dla SR.
- API/Mapowanie:
  - POST /ai/generate → render propozycji (bez zapisu).
  - POST /ai/accept (zbiorczo wybrane) → zapis fiszek (origin=AI_full) + toast potwierdzenia.
- Historyjki: US-005, US-006, US-007, US-015, US-016.

### 2.8 Flashcards – Lista/Wyszukiwanie/Edycja/Usuwanie
- Ścieżka widoku: /app/flashcards
- Główny cel: Przegląd, wyszukiwanie, edycja inline, usuwanie fiszek (AI i ręcznych).
- Kluczowe informacje: Pole „q” (front/back), opcjonalny filtr origin, sort (domyślnie created_at_desc), paginacja, badge origin (AI/manual/edited).
- Komponenty: SearchInput z debounce, Select (origin), Select (sort), FlashcardRow z InlineEdit (front/back, 1..1000), Pagination, ConfirmDialog delete, Toast.
- UX/a11y/bezpieczeństwo:
  - Pełna edycja inline z przyciskami Zapisz/Anuluj; skróty Enter/Esc; walidacje długości.
  - Potwierdzenie usuwania; czytelne komunikaty; skeletony/loading.
  - RLS – widoczne wyłącznie własne fiszki.
- API/Mapowanie:
  - GET /flashcards?q=&page=&page_size=&origin=&sort=
  - PUT /flashcards/{id} (edycja)
  - DELETE /flashcards/{id}
- Historyjki: US-009, US-010, US-011, US-012.

### 2.9 Flashcards – Dodaj ręcznie
- Ścieżka widoku: /app/flashcards/new
- Główny cel: Ręczne utworzenie fiszki Q&A.
- Kluczowe informacje: Pola front/back (1..1000), liczniki znaków, walidacje.
- Komponenty: Textarea/Inputs z licznikami, Button „Zapisz”.
- UX/a11y/bezpieczeństwo: Walidacje i komunikaty; focus na błędach; po zapisie przekierowanie/toast.
- API: POST /flashcards (origin domyślnie manual).
- Historyjki: US-008.

### 2.10 Study – Sesja nauki (5)
- Ścieżka widoku: /app/study
- Główny cel: Prezentacja porcji 5 fiszek; odsłanianie odpowiedzi; rejestrowanie przeglądu.
- Kluczowe informacje: Lista 5 kart (front → reveal back), nawigacja „poprzednie/następne”.
- Komponenty: StudyCard (reveal), BatchNav (prev/next), Button „Odsłoń”, Button „Następne 5”.
- UX/a11y/bezpieczeństwo:
  - Kolejność wg last_reviewed_at ASC NULLS FIRST, potem created_at ASC.
  - Zdarzenie „przejrzane” po konsumpcji batcha – POST /study/mark-reviewed.
  - Obsługa klawiatury; czytelne stany; brak ocen (MVP).
- API/Mapowanie:
  - GET /study/batch?limit=5
  - POST /study/mark-reviewed { ids: [...] }
- Historyjki: US-013, US-014.

### 2.11 Generation Sessions – Lista
- Ścieżka widoku: /app/generation-sessions
- Główny cel: Przegląd sesji generowania (telemetria, akceptacje).
- Kluczowe informacje: Tabela: created_at, proposals_count, accepted_count, acceptance_rate, source_text_length, (opcjonalnie) hash; link do detalu.
- Komponenty: Table, Pagination, Link do detalu.
- UX/a11y/bezpieczeństwo: Sortowanie domyślnie po created_at DESC; RLS – tylko własne sesje.
- API: GET /generation-sessions (page, page_size, opcjonalnie source_text_hash).
- Historyjki: US-015.

### 2.12 Generation Sessions – Szczegóły
- Ścieżka widoku: /app/generation-sessions/:id
- Główny cel: Wgląd w metryki pojedynczej sesji; szybkie przejście do fiszek zapisanych z tej sesji.
- Kluczowe informacje: Dane sesji; przycisk/link filtrujący listę fiszek po generation_session_id.
- Komponenty: DescriptionList, Button/Link „Zobacz fiszki z tej sesji”.
- UX/a11y/bezpieczeństwo: Jasne etykiety, opisy pól; unikanie pokazywania wrażliwych treści.
- API: GET /generation-sessions/{id} (+ link do /app/flashcards?q=... lub filtr po session_id, jeśli dostępny).
- Historyjki: US-015.

### 2.13 Account – Ustawienia profilu
- Ścieżka widoku: /app/account
- Główny cel: Scentralizowane akcje konta: zmiana hasła, usunięcie konta, wylogowanie.
- Kluczowe informacje: Sekcje: Bezpieczeństwo (zmiana hasła), Zarządzanie (usuń konto), Sesja (wyloguj).
- Komponenty: Section, Buttons, ConfirmDialog.
- UX/a11y/bezpieczeństwo: Wyraźne ostrzeżenia, stany ładowania, odseparowanie akcji destrukcyjnych.
- API: patrz widoki 2.3–2.5.
- Historyjki: US-003, US-004, US-017.

## 3. Mapa podróży użytkownika

Główny przepływ AI-assisted creation:
1) Rejestracja/Logowanie → Dashboard.
2) Dashboard → Generator AI (/app/generate).
3) Wklejenie tekstu (100–10000), wybór języka i max_proposals → POST /ai/generate.
4) Ogląd propozycji (do 20), selekcja: akcje jednostkowe lub „zatwierdź/odrzuć pozostałe”.
5) Klik „Zapisz wybrane” → POST /ai/accept; toast z liczbą zapisanych.
6) Przejście do listy fiszek lub kontynuacja generowania.

CRUD i nauka:
- Ręczne dodanie: /app/flashcards/new → POST /flashcards → redirect/toast → /app/flashcards.
- Lista: /app/flashcards → GET /flashcards z q/paginacją/filtrami → edycja inline (PUT) → usuwanie (DELETE, confirm).
- Nauka: /app/study → GET /study/batch (5) → reveal → „Następne 5” → POST /study/mark-reviewed.

Zarządzanie kontem i telemetria:
- Ustawienia konta: zmiana hasła, usunięcie konta (confirm), wylogowanie.
- Generation Sessions: lista → detal → link do fiszek z danej sesji.

Mapowanie historyjek → kroki:
- US-001..002 (Auth), US-003..004 (Account), US-005..007 (Generate/Accept), US-008..012 (CRUD), US-013..014 (Study), US-015 (Telemetry), US-016 (Komunikat o utracie propozycji), US-017 (Logout), US-018 (RLS: dostęp wyłącznie do własnych danych – egzekwowane na poziomie API i UI guardów).

## 4. Układ i struktura nawigacji

- Top navbar: logo, nawigacja globalna (Dashboard, Generate, Flashcards, Study, Sessions), menu użytkownika (Account, Logout).
- Sidebar (desktop): stałe linki do sekcji; na mobile chowany w burger menu.
- Ochrona tras: /auth/* dostępne publicznie; /app/* wyłącznie dla zalogowanych (sprawdzenie tokena; przekierowanie na /auth/login przy 401).
- Breadcrumby i nagłówki stron dla orientacji; aktywne stany linków.

## 5. Kluczowe komponenty

- TextareaWithCounter: walidacja zakresu znaków; opis błędów; a11y.
- ProposalCard: przód/tył (1000 max), akcje Akceptuj/Odrzuć, stan wybrania.
- BulkActionBar: „zatwierdź/odrzuć pozostałe”, licznik wybranych.
- FlashcardRow: wyświetlanie z badge origin (manual/AI_full/AI_edited), InlineEdit z walidacją.
- SearchInput (z debounce), Filters (origin/sort), Pagination.
- StudyCard: reveal odpowiedzi, obsługa klawiatury; wsparcie prefers-reduced-motion.
- ConfirmDialog: dla akcji destrukcyjnych (delete card, delete account).
- Toast/Alert: statusy sukcesu/błędu, w tym 429/timeout dla /ai/generate.
- ProtectedRoute/RouteGuards: wymuszanie zalogowania; obsługa 401/403.

Dodatkowe względy (edge cases, zgodność z API, bezpieczeństwo):
- Walidacje zgodne z API: source_text 100..10000; front/back 1..1000; batchy do 20; sort i paginacja jak w planie.
- Błędy: 400/422 → komunikaty pól; 401 → redirect do loginu; 403/404 → notyfikacja „brak dostępu/nie znaleziono”; 429 → informacja o limicie i sugestia ponowienia; 5xx → ogólny błąd i opcja retry.
- Utrata propozycji przed akceptacją (US-016): stały banner ostrzegawczy w widoku /app/generate.
- RLS i prywatność (US-018): UI nie pokazuje cudzych danych; wszystkie żądania z JWT; brak ekspozycji klucza AI.
- Wydajność i UX: skeletony, optimistic update dla edycji/usuwania; debounce wyszukiwania; zachowanie wyboru w propozycjach (max 20 – prosta implementacja).
- Dostępność: semantyczne elementy, focus ring, role/aria dla flip/reveal; klawisze Enter/Esc w edycji; kontrast AA; wsparcie dla screen readerów.

