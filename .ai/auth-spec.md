# Specyfikacja architektury: rejestracja, logowanie, zmiana/odzyskiwanie hasła, usuwanie konta (US-001, US-002, US-003, US-003B, US-004)

Dokument opisuje architekturę funkcjonalności uwierzytelniania i zarządzania kontem użytkownika dla 10xFlashAI, zgodną z PRD (.ai/prd.md) oraz stackiem (.ai/tech-stack.md). Uwzględnia Astro 5 (SSR, output: "server"), React 19 dla formularzy interaktywnych, Tailwind 4 i shadcn/ui, oraz Supabase (Postgres + Supabase Auth). Nie wprowadza zmian łamiących obecne działanie generatora i strukturę aplikacji.

---

## 1. Architektura interfejsu użytkownika

### 1.1. Struktura routingu (auth vs non-auth)
- Publiczne (bez logowania) — wyłącznie ekran powitalny:
  - `/` (Welcome): strona powitalna (statyczna treść, CTA do logowania/rejestracji). Wykorzysta istniejący komponent `src/components/Welcome.astro`.
- Strony dedykowane dla auth (wymóg):
  - `/auth/login` (Logowanie: email + hasło)
  - `/auth/register` (Rejestracja: email + hasło + potwierdzenie hasła)
  - `/auth/forgot-password` (Odzyskiwanie hasła: podanie emaila)
  - `/auth/change-password` (Zmiana hasła: stare + nowe + potwierdzenie) — dostępna tylko dla zalogowanych
  - `/auth/delete-account` (Usunięcie konta z potwierdzeniem) — dostępna tylko dla zalogowanych
- Część aplikacyjna (chroniona, tylko po zalogowaniu):
  - `/app/*` (np. istniejące `/app/generate`) — cały prefix chroniony middlewarem.

Uwagi do istniejących plików:
- Obecnie `src/pages/index.astro` przekierowuje do `/app/generate`. Po wdrożeniu auth powinno:
  - dla niezalogowanego: renderować Welcome (bez przekierowania),
  - dla zalogowanego: 302 do `/app/generate`.
- Zmianę zachowania należy wdrożyć bez naruszania działania generatora; logikę warunkowego redirectu osadzimy w SSR na podstawie sesji (Astro.locals).

### 1.2. Layout i top bar (przycisk w prawym górnym rogu)
- `src/layouts/Layout.astro` zostanie rozszerzony o nagłówek z prawym górnym obszarem akcji:
  - Gdy niezalogowany: przyciski „Zaloguj” (link do `/auth/login`) i „Zarejestruj” (`/auth/register`).
  - Gdy zalogowany: menu użytkownika z akcjami: „Wyloguj”, „Zmień hasło”, „Usuń konto”. „Wyloguj” wywołuje akcję backendową i po 302 wraca do `/`.
- Layout pozostaje SSR; stan auth dostępny przez `Astro.locals.user` ustawiany w middleware.

### 1.3. Podział odpowiedzialności Astro (SSR) vs React (klient)
- Strony Astro:
  - Zapewniają SSR, routing, ochronę tras (guard) i przekazywanie stanu sesji do layoutu/stron.
  - Renderują minimalny markup + mount punkt dla formularza React.
- Komponenty React (client-side):
  - Formularze: walidacja onBlur/onSubmit, komunikaty błędów, stany ładowania/sukcesu.
  - Komunikacja z backendem przez endpointy `/api/auth/*` (fetch, JSON), bez użycia dostawców zewnętrznych logowania.
  - UI oparty o shadcn/ui + Tailwind. Zgodnie ze stackiem: React 19 (SSR bezpośrednio w Astro, interaktywność w formularzach).

### 1.4. Nowe/istniejące komponenty UI (propozycja)
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ForgotPasswordForm.tsx`
- `src/components/auth/ChangePasswordForm.tsx`
- `src/components/auth/DeleteAccountConfirm.tsx`
- Wszystkie korzystają z:
  - `src/lib/validation/auth.schemas.ts` (zod/yup — walidacja po stronie klienta)
  - `src/lib/services/http.ts` (prosty wrapper fetch z obsługą błędów)
  - shadcn/ui: Input, Button, Form, Alert, Dialog

### 1.5. Walidacja i komunikaty błędów (frontend)
- Logowanie: wymagane `email` (format) i `password` (min. 8 znaków). Błąd ogólny „Nieprawidłowy email lub hasło” dla 401.
- Rejestracja: `email` (format), `password` (min. 8), `confirmPassword` = `password`. Konflikt 409: „Konto z tym adresem już istnieje”.
- Zmiana hasła: `currentPassword` wymagane (opcjonalnie — jeśli wymusi to backend), `newPassword` (min. 8), potwierdzenie zgodności. Sukces → banner „Hasło zmienione”.
- Odzyskiwanie hasła: `email` (format). Sukces → banner „Instrukcja została wysłana na e-mail” (lub „Nowe hasło wysłane”, patrz 3.3). Błędy niewyciekające informacji: zawsze 200 z komunikatem neutralnym, nawet jeśli email nie istnieje.
- Usunięcie konta: strona z ostrzeżeniem + formularz potwierdzenia (np. wpisanie `USUŃ`). Sukces → logout + redirect `/` + banner potwierdzający.

### 1.6. Główne scenariusze
- Po poprawnym logowaniu: redirect do `/app/generate`.
- Po rejestracji: auto-login lub przekierowanie do logowania (wg polityki — patrz 3.1). Domyślnie: auto-login.
- Błędne dane: formularz pokazuje inline errors; błędy backendu mapowane na przyjazne komunikaty.
- Ochrona tras `/app/*`: niezalogowany → 302 do `/auth/login?next=...`.

---

## 2. Logika backendowa (API, walidacja, błędy, SSR)

### 2.1. Warstwa SSR i middleware
- `src/middleware/index.ts` (rozszerzenie):
  - Użycie Supabase server client z obsługą cookie (patrz 3.2) do pobrania sesji i `user` na każde żądanie.
  - `context.locals = { supabase, session, user }`.
  - Ochrona tras: jeśli ścieżka zaczyna się od `/app/` lub jest jedną ze stron wymagających zalogowania (`/auth/change-password`, `/auth/delete-account`) i `!user` → redirect do `/auth/login?next=...`.
  - Allowlist publiczny: `/`, `/auth/login`, `/auth/register`, `/auth/forgot-password`, zasoby statyczne.

### 2.2. Endpointy API (Astro API routes)
- Namespace: `src/pages/api/auth/*` (metoda POST, JSON; wyjątek logout może być POST bez body):
  - `POST /api/auth/register` — body: { email, password } → 200/201; 409 gdy istnieje; walidacja; auto-login opcjonalny.
  - `POST /api/auth/login` — body: { email, password } → 200 i ustawienie sesji w cookie; 401 na błędne dane.
  - `POST /api/auth/logout` — unieważnienie sesji (clear cookies) → 200.
  - `POST /api/auth/password/change` — body: { currentPassword?, newPassword } → 200; 401 gdy brak sesji.
  - `POST /api/auth/password/forgot` — body: { email } → 200 niezależnie od istnienia konta.
  - `POST /api/auth/account/delete` — body: { confirm } → 200 po usunięciu danych i konta; 401 gdy brak sesji.

Kontrakty odpowiedzi:
- Sukces: `{ ok: true }` lub `{ ok: true, redirect?: string }`.
- Błąd walidacji: 400 `{ ok: false, code: 'VALIDATION_ERROR', details: {...} }`.
- Błąd auth: 401 `{ ok: false, code: 'UNAUTHORIZED' }`.
- Konflikt: 409 `{ ok: false, code: 'ALREADY_EXISTS' }`.
- Inne: 500 `{ ok: false, code: 'SERVER_ERROR' }`.

### 2.3. Walidacja wejścia (backend)
- Schematy z `zod` w `src/lib/validation/auth.server.schemas.ts` (niezależne od clientowych):
  - `loginSchema`, `registerSchema`, `changePasswordSchema`, `forgotPasswordSchema`, `deleteAccountSchema`.
- Fail-fast 400 przy niespełnieniu kryteriów (format email, min. długości haseł, potwierdzenia, tokeny itp.).

### 2.4. Obsługa wyjątków i mapowanie błędów
- Łapanie błędów Supabase i mapowanie do kodów HTTP + bezpiecznych komunikatów.
- Unikanie ujawniania istnienia konta w `/password/forgot` (zawsze 200 z neutralnym komunikatem).
- Logowanie serwerowe (konsola/logger) wyłącznie metadanych błędu bez danych wrażliwych.

### 2.5. Dane i powiązania (zgodność z PRD)
- Tabele fiszek muszą być powiązane po `user_id` (FK → `auth.users`).
- RLS: reguła `user_id = auth.uid()` dla SELECT/INSERT/UPDATE/DELETE, aby spełnić izolację danych (US-018 w PRD).
- Usuwanie konta (US-004):
  - Transakcja: usunięcie fiszek użytkownika (CASCADE lub kolejność: fiszki → konto) + `auth.admin.deleteUser(user.id)` (wymaga service role key).
  - Po operacji: terminarz wylogowania (czyszczenie sesji) i redirect.

### 2.6. SSR i renderowanie stron
- Zgodnie z `astro.config.mjs` (`output: "server"`, adapter node), wszystkie strony mogą wykorzystywać SSR.
- Strony auth i `/app/*` renderowane SSR z dostępem do `Astro.locals.user`:
  - Layout warunkowo pokazuje akcje (login/logout) i dostępne linki.
  - `index.astro` wykrywa `user` i warunkowo redirectuje na `/app/generate` (zachowując dotychczasowy flow generatora po zalogowaniu).

---

## 3. System autentykacji (Supabase + Astro)

### 3.1. Rejestracja i logowanie (US-001, US-002)
- Rejestracja: `supabase.auth.signUp({ email, password })` (na serwerze przez server client; alternatywnie w API route). Brak zewnętrznych providerów. Walidacja email/hasło po obu stronach.
- Logowanie: `supabase.auth.signInWithPassword({ email, password })` → zapis sesji w cookie (SSR). Po sukcesie redirect do `/app/generate`.
- Wylogowanie: `supabase.auth.signOut()` + czyszczenie cookie sesji.

Polityka auto-login po rejestracji:
- Domyślnie: po udanej rejestracji zaloguj i przenieś na `/app/generate`.
- Opcja (jeśli włączona w projekcie): wymagaj potwierdzenia email (wtedy po rejestracji komunikat „Sprawdź email”).

### 3.2. Klient Supabase (server vs client)
- `src/db/supabase.server.ts` (nowy): helper do `createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies })` — integracja z Astro Request/Response cookies.
- `src/db/supabase.client.ts` (istniejący) pozostaje do ewentualnych lekkich operacji po stronie klienta (nie dla wrażliwych akcji auth). Główne operacje auth realizuje server client.
- Middleware:
  - Tworzy server client per request i ustawia `context.locals.{ supabase, session, user }`.

### 3.3. Odzyskiwanie i zmiana hasła (US-003, US-003B)
- Zmiana hasła (zalogowany): `supabase.auth.updateUser({ password: newPassword })` — po sukcesie banner i ewentualny re-login.
- Odzyskiwanie hasła (niezalogowany): dwa tryby zgodnie z PRD i najlepszymi praktykami:
  1) Tryb rekomendowany (bezpieczniejszy): wysłanie linku resetującego (Supabase reset password) → strona `/auth/reset-password` ustawia nowe hasło.
  2) Tryb zgodny z PRD (US-003B – nadanie nowego hasła i wysłanie e-mailem):
     - Endpoint serwerowy generuje losowe silne hasło, używa Admin API (`supabase.auth.admin.updateUserById`) do ustawienia hasła, a następnie wysyła e-mail przez `EmailService` (SMTP). Wymaga `SUPABASE_SERVICE_ROLE_KEY` dostępnego wyłącznie na serwerze.
     - Ze względów bezpieczeństwa zaleca się dodatkowe zabezpieczenia anty‑enumeracyjne (zawsze 200) i throttling.

Konfiguracja maili:
- `EmailService` (abstrakcja) → implementacja SMTP lub Supabase SMTP. Przechowywanie szablonów wiadomości (reset, powiadomienie).

### 3.4. Usuwanie konta (US-004)
- Kolejność (w transakcji serwerowej):
  1) Usunięcie danych użytkownika w domenie (fiszki) — zgodnie z RLS, poprzez serwis domenowy.
  2) `auth.admin.deleteUser(user.id)` — wymaga service role key.
  3) `signOut` i czyszczenie cookie.
- UI: dedykowana strona z potwierdzeniem i ostrzeżeniami, po sukcesie redirect `/`.

### 3.5. Bezpieczeństwo
- Brak zewnętrznych providerów (Google/GitHub) — tylko email/hasło.
- RLS zawsze aktywne: każda operacja na fiszkach z `user_id = auth.uid()`.
- Ochrona tras SSR (middleware + allowlist publiczny) i brak przecieków informacji (np. przy resetach).
- Throttling i rate‑limit dla wrażliwych endpointów (`/login`, `/password/forgot`).
- Service Role Key tylko na serwerze (env), nigdy w bundle klienta.

---

## 4. Warstwa aplikacyjna: moduły i kontrakty

### 4.1. Serwisy
- `AuthService` (server):
  - `register(email, password)`, `login(email, password)`, `logout()`,
  - `changePassword(userId, newPassword, currentPassword?)`,
  - `forgotPassword(email)` (tryb 1 lub 2),
  - `deleteAccount(userId)` (usuwa dane domenowe i konto w Auth).
- `EmailService` (server):
  - `sendPasswordResetEmail(email, link|generatedPassword)`,
  - Szablony i konfiguracja SMTP.
- `UserDataService` (server):
  - `deleteAllForUser(userId)` — kaskadowe usunięcie fiszek użytkownika.

### 4.2. Endpoints → Serwisy (kontrakt)
- Każdy endpoint API waliduje wejście (zod), wywołuje odpowiednią metodę serwisu i zwraca zunifikowaną odpowiedź (`ok`, `code`, `details`).
- Błędy z Supabase mapowane do 401/409/500 zgodnie z sekcją 2.4.

### 4.3. Formularze React → Endpoints
- Formularze wysyłają JSON (POST), oczekują `{ ok: true }` lub struktury błędu.
- Po sukcesie obsługują redirect (z meta w response lub przez nawigację na froncie).

---

## 5. Zmiany konfiguracyjne i zgodność z istniejącym działaniem

- `astro.config.mjs` już jest w trybie SSR (`output: "server"`, adapter node) — bez zmian.
- `src/middleware/index.ts` wymaga rozbudowy o wstrzykiwanie `user` i ochronę tras (bez wpływu na generator poza wymogiem zalogowania, co spełnia PRD: tylko ekran powitalny publiczny).
- `src/pages/index.astro` zmieni zachowanie na warunkowe: publiczna strona Welcome dla niezalogowanych, redirect dla zalogowanych, dzięki czemu nie naruszamy działania `/app/generate` w kontekście zalogowanego użytkownika.
- Istniejąca logika generatora i domeny fiszek nie jest modyfikowana funkcjonalnie; jedynie egzekwujemy auth i izolację danych.

---

## 6. Walidacje i przypadki błędów (zagregowane)

- Email: poprawny format (regex/lib), niepusty.
- Hasło: min. 8 znaków, komunikat dostępny („co najmniej 8 znaków”).
- Potwierdzenie hasła: równość z `password`.
- Brak ujawniania istnienia konta przy odzyskiwaniu hasła.
- Mapowanie błędów: 400 (walidacja), 401 (auth), 409 (istniejący użytkownik), 500 (serwer).

---

## 7. Ochrona tras i nawigacja

- Middleware SSR egzekwuje dostęp do `/app/*` i stron zarządzania kontem.
- Linki w Layout.astro:
  - Niezalogowany: Login, Register (prawy górny róg).
  - Zalogowany: Logout, Change Password, Delete Account.
- Po loginie redirect do `/app/generate`; po logout do `/`.

---

## 8. Noty implementacyjne (bez kodu docelowego)

- Dodać `src/db/supabase.server.ts` (helper createServerClient z cookies astro).
- Rozbudować `src/middleware/index.ts` o:
  - Inicjalizację server client i `locals.user`.
  - Ochronę tras.
- Dodać strony Astro: `/auth/*` oraz publiczny `/`.
- Dodać endpointy API w `src/pages/api/auth/*` według 2.2.
- Przygotować schematy walidacji w `src/lib/validation/auth.*.ts` (client/server).
- Zapewnić w bazie RLS i FK `user_id` (po stronie Supabase: policies + cascade).
- Skonfigurować SMTP dla `EmailService` (reset link lub generowane hasło — tryb wybierany flagą środowiskową).

---

## 9. Zgodność z PRD (US-001…US-004, US-003B)

- US-001 (Rejestracja): formularz email+hasło+potwierdzenie; weryfikacja; po sukcesie możliwość zalogowania (domyślnie auto-login).
- US-002 (Logowanie): formularz email+hasło; poprawne logowanie przenosi do strony głównej aplikacji (`/app/generate`); błędy czytelne.
- US-003 (Zmiana hasła): strona dedykowana; walidacje; po zmianie logowanie nowym hasłem.
- US-003B (Odzyskiwanie hasła):
  - Tryb 1 (rekomendowany): reset link (Supabase),
  - Tryb 2 (ściśle wg PRD): generowane silne hasło + wysyłka na email przez `EmailService` (Admin API, service role key) — opisane i wspierane architektonicznie.
- US-004 (Usunięcie konta): dedykowana strona; potwierdzenie; usunięcie konta i fiszek; wylogowanie i potwierdzenie.
- „Tylko ekran powitalny publiczny”: wymuszone przez middleware i warunkowe SSR.
- „Brak zewnętrznych providerów”: tylko email/hasło (Supabase Auth).

---

## 10. Bezpieczeństwo i ryzyka

- Preferować reset link zamiast wysyłki nowego hasła (lepsza praktyka). Jeśli wymagane jest nadawanie nowego hasła (US-003B), zapewnić silną politykę haseł, brak ujawniania istnienia konta i rate‑limit.
- Nigdy nie umieszczać service role key w kliencie; operacje admin‑level wyłącznie serwerowo.
- RLS obowiązkowe dla wszystkich tabel użytkownika (izolacja danych zgodnie z PRD 3.4 i US-018).
- Obsłużyć CSRF (POST + sameSite cookies) i nagłówki bezpieczeństwa (po stronie adaptera node).

