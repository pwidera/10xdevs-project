# Plan realizacji US-001, US-002, US-003, US-003B, US-004 (10xFlashAI)

## 0) Status wstępnego audytu kodu i wytycznych
- PRD: zdefiniowane historie US-001…US-004 (+US-003B) w .ai/prd.md.
- Architektura auth w .ai/auth-spec.md: Astro 5 (SSR, output: "server"), React 19 dla formularzy, Supabase Auth, dedykowane trasy `/auth/*`, ochrona `/app/*`, middleware SSR.
- Wytyczne front: `.augment/rules/imported/astroinstructions.md`, `reactinstructions.md`, `frontendinstructions.md` — wskazują m.in. SSR, middleware, zod, separację logiki do `src/lib/services` oraz React tylko dla interaktywności.
- Wytyczne back: `.github/instructions/backend.instructions.md` — używać `context.locals` i typów z `src/db/supabase.client.ts`.
- Integracja Supabase Auth (must): `.augment/rules/imported/supabase-auth.md` — użyć `@supabase/ssr`, cookies via `getAll`/`setAll`, middleware z `auth.getUser()`.
- Stan repo (kluczowe pliki):
  - `src/db/supabase.client.ts` używa `@supabase/supabase-js` (client) bez SSR cookies.
  - `src/middleware/index.ts` jedynie wstrzykuje `supabaseClient` do `locals` — brak `getUser()`, ochrony tras i SSR cookie bridging.
  - `astro.config.mjs`: `output: "server"` (OK).
  - Brak pakietu `@supabase/ssr` w `package.json` (do dodania).

Wniosek: potrzebna migracja na serwerowy klient Supabase z `@supabase/ssr`, rozbudowa middleware, dodanie endpointów `/api/auth/*` i stron `/auth/*`, plus polityki bezpieczeństwa i e‑maile dla resetu/odzyskiwania.

## 1) Decyzje/założenia wymagające potwierdzenia (blokery)
1. Tryb odzyskiwania hasła (US-003B): reset-link (rekomendowany) czy generowanie nowego hasła i wysyłka e‑mailem (zgodnie z PRD)? Jeśli generowanie — podać dostępny SMTP i akceptowalną politykę siły hasła.
2. Rejestracja: auto‑login po udanym sign‑up czy wymagane potwierdzenie e‑mail (Supabase email confirmation)? Jeśli potwierdzenie — flow po rejestracji i zawartość komunikatu.
3. Konfiguracja środowiska: dostępność `SUPABASE_URL`, `SUPABASE_KEY` (anon) i `SUPABASE_SERVICE_ROLE_KEY` (tylko serwer, dla admin API delete/reset). Jaki SMTP (host/port/user/from)?
4. Zachowanie routingu: `"/"` jako publiczny Welcome dla niezalogowanych i 302 do `/app/generate` po zalogowaniu — potwierdzić. Czy są inne publiczne strony, które mają pozostać dostępne bez auth?
5. RLS i schemat danych: czy tabele fiszek mają już FK `user_id -> auth.users` i aktywne polityki `user_id = auth.uid()` dla CRUD? Jeśli nie — czy wdrażamy teraz minimalne polityki i CASCADE delete (na potrzeby US-004)?

Poniższy plan zakłada domyślne ustawienia z .ai/auth-spec.md i dostosuje szczegóły po odpowiedziach.

## 2) Architektura docelowa (high-level)
- SSR: Astro middleware tworzy `server client` Supabase (z `@supabase/ssr`) per request i ustawia `locals: { supabase, session?, user? }`.
- Ochrona tras: `/app/*` i wybrane `/auth/*` (change-password, delete-account) wymagają zalogowania; redirect do `/auth/login?next=...`.
- API: `src/pages/api/auth/*` (POST, JSON) wywołują serwisy: `AuthService`, `EmailService`, `UserDataService` z walidacją `zod` i zunifikowanym schematem odpowiedzi.
- UI: Strony Astro `/auth/*` renderują layout i mountują formularze React (shadcn/ui), obsługa błędów i stanów.

## 3) Plan implementacji — kroki
1) Dependencje i typy (bez uruchamiania teraz):
   - Dodać `@supabase/ssr` (npm i @supabase/ssr) oraz upewnić się, że `@supabase/supabase-js` jest aktualne.
   - Uzupełnić `src/env.d.ts` o ewentualne nowe zmienne (np. SERVICE_ROLE, SMTP). Zaktualizować `.env.example`.

2) Serwerowy klient Supabase:
   - Dodać `src/db/supabase.server.ts` (lub rozszerzyć istniejący wzorcem z supabase-auth.md): `createServerClient`, `cookies: { getAll, setAll }`, `cookieOptions` (httpOnly, secure, sameSite=lax, path=/).
   - Zachować `src/db/supabase.client.ts` wyłącznie dla ewentualnych nietajnych operacji klienta (nie dla auth).

3) Middleware SSR (`src/middleware/index.ts`):
   - Tworzyć server client per request; wywołać `auth.getUser()` i ustawić `locals.user`.
   - Egzekwować allowlist i redirecty (publiczne: `/`, `/auth/login`, `/auth/register`, `/auth/forgot-password`, statyki; chronione: `/app/*`, `/auth/change-password`, `/auth/delete-account`).

4) Warstwa API (`src/pages/api/auth/*`):
   - Endpointy: `register`, `login`, `logout`, `password/change`, `password/forgot`, `account/delete`.
   - Walidacja `zod` (osobne pliki w `src/lib/validation/auth.server.schemas.ts`).
   - Mapowanie błędów: 400/401/409/500. Zwracać `{ ok: true, redirect? }`/`{ ok: false, code, details }`.

5) Serwisy (server):
   - `AuthService`: `register`, `login`, `logout`, `changePassword`, `forgotPassword` (tryb zależny od decyzji), `deleteAccount` (kaskadowe usunięcie danych + `auth.admin.deleteUser`).
   - `EmailService`: SMTP config + `sendPasswordResetEmail(email, link|generatedPassword)`.
   - `UserDataService`: `deleteAllForUser(userId)` — usunięcie fiszek (transakcja lub CASCADE).

6) Strony i formularze (UI):
   - `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/change-password` (guard: zalogowany), `/auth/delete-account` (guard: zalogowany).
   - Komponenty React w `src/components/auth/*` (LoginForm, RegisterForm, itd.), shadcn/ui, walidacja po stronie klienta (zod), obsługa redirectów i błędów.
   - Layout: nagłówek z prawym górnym menu (Login/Register vs Logout/Change/Delete na podstawie `Astro.locals.user`).

7) Index i nawigacja:
   - `src/pages/index.astro`: niezalogowany renderuje Welcome; zalogowany → 302 do `/app/generate`.
   - Ochrona `/app/*` (SSR + ewentualnie check w poszczególnych stronach).

8) Baza i bezpieczeństwo:
   - RLS: `user_id = auth.uid()` dla SELECT/INSERT/UPDATE/DELETE na tabelach fiszek; FK `user_id -> auth.users`.
   - Usuwanie konta: kolejność — dane domenowe → `auth.admin.deleteUser` → `signOut` → czyszczenie cookies.
   - Ograniczenie ujawniania informacji w `/password/forgot` (zawsze 200), rozważyć rate‑limit.

9) Testy i weryfikacja:
   - Jednostkowe: walidacje zod, mapowanie błędów serwisów.
   - Integracyjne (API routes): scenariusze 200/400/401/409; login→redirect; logout; change/forgot/delete.
   - E2E (lekko): ochrona tras (`/app/*`), redirecty z `/` i `/auth/*`.

10) Dokumentacja i DX:
   - Zaktualizować README/ENV, opisać konfigurację SMTP i kluczy.
   - Dodać notatki bezpieczeństwa: brak kluczy admin w kliencie, tylko na serwerze.

## 4) Kryteria akceptacji per US (mapowanie)
- US-001 (Rejestracja): formularz, walidacja, konflikt 409, (domyślnie auto‑login) → redirect do `/app/generate` lub komunikat o weryfikacji e‑mail.
- US-002 (Logowanie): formularz, 401 na błędne dane, sukces → `/app/generate`.
- US-003 (Zmiana hasła): strona chroniona, walidacje, `updateUser({ password })`, po sukcesie komunikat; logowanie nowym hasłem działa.
- US-003B (Odzyskiwanie hasła):
  - Tryb 1 (rekomendowany): reset link (Supabase) → strona ustawienia nowego hasła.
  - Tryb 2 (zgodny z PRD): generowane hasło + e‑mail (Admin API + SMTP) — bez ujawniania istnienia konta.
- US-004 (Usunięcie konta): strona z potwierdzeniem, kaskadowe usunięcie danych + `auth.admin.deleteUser`, signOut, redirect `/` i banner.

## 5) Harmonogram (propozycja przybliżona)
1. SSR Supabase client + middleware + redirecty (0.5–1 dnia).
2. API `/api/auth/*` + walidacje + serwisy (1 dzień).
3. Strony `/auth/*` + formularze React (1 dzień).
4. RLS/polityki i usuwanie konta (0.5 dnia).
5. Testy integracyjne/E2E, twarde przypadki i poprawki (0.5 dnia).

## 6) Ryzyka i mitigacje
- SMTP/brak dostępu do service role → uzgodnić wcześniej (blokery). Mitigacja: fallback do reset‑link zamiast generowania hasła.
- Zmiany RLS mogą wpływać na istniejące zapytania — najpierw testy i dry‑run na dev.
- Błędy w cookie bridging → stosować `getAll/setAll` i testy ręczne login/logout.

## 7) Checklist wdrożeniowy
- [ ] Zainstalowane `@supabase/ssr` i uzupełnione env/typy.
- [ ] Middleware ustawia `locals.user` i chroni trasy.
- [ ] Endpointy `/api/auth/*` działają zgodnie z kontraktami.
- [ ] UI `/auth/*` + layout top‑bar.
- [ ] RLS i usuwanie konta w pełni przetestowane.
- [ ] Testy integracyjne przechodzą; smoke test login→redirect, logout, change/forgot/delete.

