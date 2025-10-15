## Plan testów: 10xFlashAI (Astro + React + Supabase + OpenRouter)

### 1. Wprowadzenie i cele testowania
Celem testów jest zapewnienie jakości funkcjonalnej i niefunkcjonalnej aplikacji 10xFlashAI — webowej aplikacji do generowania i nauki fiszek, z backendem opartym o Supabase i integracją AI (OpenRouter). Plan obejmuje strategię, zakres, narzędzia, środowisko i kryteria akceptacji, dopasowane do architektury:
- Frontend: Astro 5 + React 19, TypeScript 5, Tailwind 4, shadcn/ui
- API: Astro endpoints (src/pages/api/*)
- Backend: Supabase (PostgreSQL, Auth, SDK)
- AI: OpenRouter (zewnętrzne API)
- CI/CD: GitHub Actions, docelowo Docker/DigitalOcean

Cele nadrzędne:
- Zweryfikować poprawność kluczowych przepływów (rejestracja/logowanie, generowanie propozycji, akceptacja, CRUD fiszek, sesje nauki, analityka).
- Zapewnić stabilność, bezpieczeństwo i wydajność API (szczególnie /api/ai/generate).
- Ustalić ramy E2E do regresji i bramki jakościowej w CI.

### 2. Zakres testów
W zakresie:
- API (Astro): /api/auth/*, /api/ai/generate, /api/ai/accept
- UI: strony Astro (index, /app/generate, auth) oraz komponenty React (GeneratePage, komponenty ui)
- Integracja Supabase (Auth, dostępy per-user), zapisy sesji generowania
- Integracja OpenRouter (stub/mocking w testach)
- Walidacje (Zod), obsługa błędów, komunikaty
- Niefunkcjonalne: wydajność, bezpieczeństwo, dostępność, UX podstawowe
Poza zakresem MVP: zaawansowane algorytmy SRS, importy dokumentów, integracje zewnętrzne (wg README)

### 3. Typy i strategia testów
- Testy jednostkowe (Unit)
  - Zakres: utilsy (src/lib/utils.ts), walidacje Zod (src/lib/validation/*), serwisy domenowe (src/lib/services/*: ai-generation.service, generation-session.service, itp.).
  - Metodyka: mocki dla IO (OpenRouter, Supabase). Sprawdzenie ścieżek sukcesu i błędu, walidacji i mapowania danych.
- Testy komponentów (Component)
  - React 19: komponenty generowania i UI (shadcn/ui), formularze, walidacje, stany ładowania.
  - Astro: render stron i integracja slotów/wycinków z komponentami React (testy integracyjne UI lub E2E).
- Testy integracyjne (API-level)
  - Endpoints w src/pages/api/* testowane z mockiem `context` i `locals.supabase` oraz stubem OpenRouter.
  - Scenariusze: poprawne 200, błędy 400/401/502/504/500, zapis sesji generacji.
- Testy E2E (przeglądarkowe)
  - Przepływy: rejestracja/logowanie/wylogowanie, generowanie propozycji (stub AI), akceptacja/odrzucanie (pojedynczo/masowo), CRUD fiszek, sesja nauki, wyszukiwanie, usuwanie konta.
  - Mockowanie OpenRouter przez MSW w warstwie przeglądarkowej lub proxy.
- Testy wydajnościowe
  - Cel: /api/ai/generate i krytyczne CRUD-y. Metryki: p50/p95/p99, throughput, błędy pod obciążeniem, timeouts.
- Testy bezpieczeństwa (podstawowe)
  - Autentykacja (Supabase), autoryzacja per-user, walidacja wejścia (Zod), ochrona przed wyciekiem danych między użytkownikami.
- Testy dostępności (A11y)
  - Kluczowe widoki: auth, generate, lista fiszek, sesja nauki. Kontrole semantyki, fokusów i kontrastów.
- Testy regresji wizualnej (opcjonalnie)
  - Snapshoty krytycznych widoków przy zmianach UI.

Rekomendowane narzędzia (do wprowadzenia):
- Unit/Component: Vitest + @testing-library/react, @testing-library/user-event, ts-node/tsx
- API/Integracja: Vitest + supertest (lub bezpośrednie wywołanie APIRoute z mockowanym kontekstem)
- E2E: Playwright (stabilne, szybkie; CI-friendly)
- Mocki: MSW (przeglądarka i Node) do OpenRouter; wstrzyknięcie lokalnego Supabase klienta testowego
- Wydajność: k6 lub autocannon (HTTP)
- A11y: axe-core/Playwright-axe

### 4. Scenariusze testowe (przykładowe, priorytetyzowane)
P0 — krytyczne, P1 — wysokie, P2 — średnie.

4.1. Autentykacja (Supabase)
- P0: Rejestracja nowego użytkownika (happy path) — e-mail, hasło; walidacje błędnych danych.
- P0: Logowanie poprawne i błędne (zły e-mail/hasło, brak konta, blokada brute-force — jeśli istnieje).
- P0: Wylogowanie (czyszczenie sesji, brak dostępu do zasobów chronionych).
- P1: Zmiana hasła; reset hasła (przepływy linków/komunikatów zgodnie z UI).
- P1: Usunięcie konta (i skojarzonych fiszek) — potwierdzenie i efekt w DB.

4.2. Generowanie AI (/api/ai/generate)
- P0: 200 Success — valid input (100–10k znaków), PLN/EN, max 20 propozycji; zwrot: proposals, generation_session.
- P0: 401 Unauthorized — brak/niepoprawny token; symulacja braku usera z `locals.supabase`.
- P0: 400 Validation error — błędny JSON, za krótki/za długi tekst, zły max_proposals, nieobsługiwany language.
- P0: 502 Bad gateway — błąd OpenRouter (OpenRouterError) — mapping na 502.
- P0: 504 Gateway timeout — czas oczekiwania (OpenRouterTimeoutError) — mapping na 504.
- P1: 500 Internal server error — brak OPENROUTER_API_KEY lub niespodziewany błąd; poprawna treść komunikatu.
- P1: Czas trwania generacji i maks. limit propozycji (20) — respektowane.

4.3. Akceptacja propozycji (/api/ai/accept)
- P0: Akceptacja jednej i wielu propozycji — zapis tylko zaakceptowanych; walidacja danych wejściowych.
- P1: Odporność na duplikaty i konflikty (np. powtórna akceptacja tej samej propozycji).

4.4. CRUD fiszek (UI + API)
- P0: Dodanie manualnej fiszki (limit 1000 znaków na stronę, walidacje i komunikaty błędów).
- P0: Edycja inline zapisanych fiszek i trwałość zmian.
- P0: Lista i wyszukiwanie po front/back (filtrowanie działa i nie ujawnia cudzych danych).
- P0: Usuwanie fiszek (bez kosza w MVP) — potwierdzenie i brak w liście.

4.5. Sesje nauki
- P1: Pobranie 5 fiszek wg najdawniej przeglądanych (last_reviewed_at) — logika doboru.
- P1: Nawigacja poprzednia/następna, odsłanianie odpowiedzi — UX i stan komponentów.

4.6. Analityka
- P2: Zapis liczby wygenerowanych propozycji, liczby akceptacji i współczynnika akceptacji na sesję generacji.
- P2: Brak utrwalania odrzuconych propozycji.

4.7. Niefunkcjonalne
- Wydajność P0: /api/ai/generate — p95 ≤ X s (wartość do ustalenia), stabilność pod obciążeniem.
- Bezpieczeństwo P0: Brak wycieków między użytkownikami (izolacja per userId), brak akcji bez tokena.
- A11y P1: Brak krytycznych błędów axe; fokusy i kontrasty OK w kluczowych widokach.

### 5. Środowisko testowe
- Node 22.14.0 (zgodnie z README). Przeglądarka: Chromium (Playwright) + ewentualnie WebKit/Firefox smoke.
- Zmienne środowiskowe (test):
  - OPENROUTER_API_KEY: testowy klucz lub stub przez MSW (preferowane: brak realnych calli w CI)
  - SUPABASE_URL, SUPABASE_ANON_KEY: dedykowany projekt testowy lub lokalna instancja
- Dane testowe: seed użytkowników/kart, cleanup per test suite (idempotencja testów).
- Serwer: astro dev/preview, lub testy bezserwerowe (bezpośrednie wywołanie APIRoute z mockami).

### 6. Narzędzia do testowania (propozycja wdrożenia)
- Jednostkowe/Integracyjne: Vitest, @testing-library/react, MSW, supertest
- E2E: Playwright (+ @axe-core/playwright do a11y)
- Wydajność: k6 lub autocannon
- Jakość: ESLint, Prettier (już skonfigurowane), TypeScript strict
- Raportowanie: HTML/JUnit (Playwright/Vitest), integracja z GitHub Actions (artefakty)

Uwaga: Obecnie w repo brak skonfigurowanego runnera testów — wdrożyć powyższe narzędzia jako pierwszy krok (bez uruchamiania instalacji w tej chwili).

### 7. Harmonogram testów (proponowany)
- Tydzień 1: 
  - Setup narzędzi testowych (Vitest, Playwright, MSW), szkielety testów, seed danych
  - Pierwsze unit/integration dla walidacji Zod i serwisów (ai-generation, session)
- Tydzień 2:
  - Testy API dla /api/ai/generate i /api/ai/accept (pełna macierz statusów)
  - E2E: auth (rejestracja/logowanie/wylogowanie), podstawowe UI generate
- Tydzień 3:
  - E2E: CRUD fiszek, sesje nauki, wyszukiwanie, usuwanie konta
  - A11y smoke (+ poprawki)
- Tydzień 4:
  - Wydajność: /api/ai/generate (baseline, tuning)
  - Regresja pełna, stabilizacja testów, włączenie gate’ów w CI

### 8. Kryteria akceptacji
- Funkcjonalne:
  - 100% przypadków P0 przechodzi (unit/integration/E2E)
  - ≥95% przypadków P1 przechodzi; P2 według uzgodnień
- Jakość kodu:
  - Brak błędów ESLint, brak ostrzeżeń typu w krytycznych ścieżkach
  - Pokrycie (docelowo): unit+integration lines ≥ 70% w serwisach i walidacjach
- Wydajność:
  - /api/ai/generate p95 ≤ X s (ustalić) w środowisku testowym
  - Brak spike’ów błędów 5xx przy RPS Y (ustalić baseline)
- A11y:
  - Brak krytycznych naruszeń axe w widokach P0
- Bezpieczeństwo:
  - Brak eskalacji uprawnień; brak dostępu do danych innych użytkowników w E2E/API testach

### 9. Role i odpowiedzialności
- QA (Owner planu):
  - Definiowanie strategii, scenariuszy, utrzymanie stabilności testów, raportowanie jakości
- Dev:
  - Współtworzenie testów jednostkowych/integracyjnych, dostarczanie fixture’ów/moków
- Tech Lead/Architekt:
  - Decyzje w sprawie kryteriów akceptacji, budżetu jakości i priorytetów
- DevOps:
  - Integracja z CI/CD, konfiguracja artefaktów raportowych, tajemnice w CI (secrets)

### 10. Procedury raportowania błędów
- System: GitHub Issues (etykiety: bug, priority: P0/P1/P2, area: api/ui/auth/ai)
- Zgłoszenie powinno zawierać:
  - Tytuł i opis, środowisko (commit SHA, wersja), kroki reprodukcji, oczekiwane vs. aktualne
  - Załączniki: zrzuty ekranu, logi (API, konsola), pliki HAR, trace Playwright
  - Klasyfikację wagi (P0 — blokuje, P1 — krytyczny bez obejścia, P2 — średni)
- Triage w 24h, potwierdzenie priorytetu przez TL/QA, przypisanie do zespołu
- Zamknięcie po: fix, test regresji (odtworzenie scenariusza), weryfikacja QA

### 11. Integracja z CI/CD (ramy)
- Pull Request:
  - Lint + typecheck + unit/integration (szybkie)
  - Playwright smoke (auth + generate happy path, z mockiem AI)
- Pre-release/Nightly:
  - Pełne E2E (wszystkie P0/P1), testy wydajnościowe w oknie poza szczytem
- Artefakty: raporty JUnit/HTML, screenshoty/trace z E2E, metryki perf

### 12. Ryzyka i mitigacje
- Zewnętrzne API (OpenRouter): fluktuacje i limity
  - Mitigacja: pełny mocking w testach; testy kontraktowe na małej próbce ręcznie
- Izolacja danych per-user (Supabase):
  - Mitigacja: testy negatywne dostępu krzyżowego; osobne konta testowe i cleanup
- Brak obecnie runnera testów w repo:
  - Mitigacja: wprowadzić Vitest/Playwright w sprincie 1; dodać minimalny smoke w CI przed rozbudową

