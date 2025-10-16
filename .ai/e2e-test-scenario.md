# E2E: Generowanie i zatwierdzanie fiszek (Playwright)

## Status implementacji
✅ **ZAIMPLEMENTOWANE** - Testy znajdują się w `e2e/flashcards-generation.spec.ts`

## Cel
Zweryfikować, że nowy użytkownik może zarejestrować się, wygenerować 5 fiszek z podanego tekstu, zatwierdzić je i zobaczyć je na liście fiszek, gdzie każda ma typ „AI”.

## Założenia / Prerekwizyty
- Test wykorzystuje przeglądarkę sterowaną przez Playwright.
- Aplikacja jest dostępna pod adresem bazowym `BASE_URL` (np. `http://localhost:3000`).
- Formularz rejestracji jest dostępny z poziomu strony głównej lub poprzez link „Zarejestruj”/„Sign up”.
- UI posiada stabilne selektory (najlepiej `data-testid=...`). Poniżej podano przykładowe propozycje; dostosuj do faktycznych selektorów aplikacji.

## Dane testowe
- EMAIL_DOMAIN: `e2etest.com`
- EMAIL (generowany w teście): `test+<timestamp>@e2etest.com`
- PASSWORD: `Playwright123!`
- FLASHCARDS_COUNT: `5`
- TEXT_SOURCE:
  """
  Fotosynteza (stgr. φῶς – światło, σύνθεσις – łączenie) – proces wytwarzania związków organicznych z materii nieorganicznej zachodzący w komórkach zawierających chlorofil lub bakteriochlorofil, przy udziale światła. Jest to jedna z najważniejszych przemian biochemicznych na Ziemi[1]. Proces ten utrzymuje wysoki poziom tlenu w atmosferze oraz przyczynia się do wzrostu ilości węgla organicznego w puli węgla, zwiększając masę materii organicznej kosztem materii nieorganicznej
  """

## Kroki testu
1) Wejdź na stronę główną
   - `GET {BASE_URL}/`
   - Oczekiwane: Strona ładuje się poprawnie (np. widoczny nagłówek/welcome/CTA). Opcjonalnie sprawdź, że przycisk/link do rejestracji jest widoczny.

2) Zarejestruj nowego użytkownika (email z domeną `@e2etest.com`)
   - Przejdź do formularza rejestracji (np. kliknij „Zarejestruj” lub `goto {BASE_URL}/auth/register`).
   - Wprowadź: EMAIL = `test+<timestamp>@e2etest.com`, PASSWORD = `Playwright123!` (i potwierdzenie, jeśli wymagane).
   - Zatwierdź formularz rejestracji.
   - Oczekiwane: Rejestracja kończy się sukcesem i użytkownik jest zalogowany/redirectowany (np. do `/app` lub innej strony startowej w aplikacji).

3) Przejdź na stronę generowania fiszek
   - `goto {BASE_URL}/app/generate`
   - Oczekiwane: Widoczne pole wprowadzania tekstu źródłowego oraz kontrolka liczby fiszek (np. input/slider) i przycisk „Generuj”.

4) Wygeneruj 5 fiszek z podanego tekstu
   - Wklej do pola tekstowego wartość `TEXT_SOURCE`.
   - Ustaw `FLASHCARDS_COUNT = 5` (jeśli istnieje kontrolka ilości) lub wybierz opcję 5.
   - Kliknij „Generuj”.
   - Poczekaj na zakończenie generowania (np. oczekuj na zniknięcie loadera lub pojawienie się listy fiszek).
   - Oczekiwane: Pojawia się lista dokładnie 5 nowych fiszek, każda oznaczona typem „AI” i w stanie wymagającym zatwierdzenia (np. Draft/Nowe).

5) Zatwierdź wszystkie nowo wygenerowane fiszki
   - Jeśli istnieje masowa akcja, kliknij „Zatwierdź wszystko”.
   - Jeśli nie, iteracyjnie klikaj „Zatwierdź” na każdej fiszce.
   - Oczekiwane: Wszystkie 5 fiszek zmienia status na zatwierdzone (np. „Approved”/„Zatwierdzone”).

6) Przejdź na stronę listy fiszek
   - `goto {BASE_URL}/app/flashcard`
   - Oczekiwane: Lista fiszek ładuje się poprawnie.

7) Weryfikacja końcowa
   - Zweryfikuj, że widoczne są dokładnie 5 fiszek odpowiadających nowo wygenerowanym.
   - Zweryfikuj, że każda z nich ma typ „AI” (np. znaczek/badge „AI” albo metadane „Typ: AI”).

8) Usuń konto użytkownika
   - Kliknij link „Usuń konto" w top barze (nawigacja w nagłówku).
   - Zostaniesz przekierowany na stronę `/auth/delete-account`.
   - Wpisz „USUŃ" w pole potwierdzenia.
   - Kliknij przycisk „Usuń konto".
   - Oczekiwane: Konto zostaje usunięte, użytkownik zostaje wylogowany i przekierowany na stronę główną (`/`).
   - Opcjonalnie: Spróbuj zalogować się ponownie tym samym emailem - powinno się nie udać (błąd „Invalid login credentials").

## Assercje (przykładowe w Playwright)
- Liczba fiszek: `await expect(page.getByTestId('flashcard-item')).toHaveCount(5)`
- Typ AI na każdej fiszce: dla każdego elementu `flashcard-item` oczekuj obecności `getByTestId('flashcard-type').toHaveText(/AI/i)` lub badge z tekstem „AI”.

## Proponowane selektory (dostosuj do aplikacji)
- Rejestracja:
  - Email: `[data-testid="auth-register-email"]`
  - Hasło: `[data-testid="auth-register-password"]`
  - Zatwierdzenie: `[data-testid="auth-register-submit"]`
- Generowanie:
  - Pole tekstowe: `[data-testid="generate-textarea"]`
  - Ilość fiszek: `[data-testid="generate-count"]`
  - Generuj: `[data-testid="generate-submit"]`
  - Loader: `[data-testid="generate-loading"]`
  - Fiszka (kontener): `[data-testid="generated-flashcard-item"]`
  - Zatwierdź wszystko: `[data-testid="approve-all"]`
  - Zatwierdź pojedynczą: `[data-testid="approve-item"]`
- Lista fiszek:
  - Element fiszki: `[data-testid="flashcard-item"]`
  - Typ fiszki: `[data-testid="flashcard-type"]`
- Usuwanie konta:
  - Link w top barze: `a[href="/auth/delete-account"]` lub `[data-testid="delete-account-link"]`
  - Pole potwierdzenia: `input[name="confirm"]` lub `[data-testid="delete-account-confirm"]`
  - Przycisk usuń: `button[type="submit"]` lub `[data-testid="delete-account-submit"]`

## Wskazówki implementacyjne (Playwright)
- Generowanie unikalnego emaila:
  ```ts
  const email = `test+${Date.now()}@e2etest.com`;
  ```
- Czekanie na zakończenie generowania:
  - `await page.waitForSelector('[data-testid="generated-flashcard-item"]', { state: 'visible' });`
  - lub czekanie na zniknięcie loadera: `await page.waitForSelector('[data-testid="generate-loading"]', { state: 'detached' });`
- Weryfikacja typu „AI” na każdej fiszce:
  - Pobierz wszystkie elementy fiszek i dla każdego asercja na typ/badge „AI”.

## Kryteria zaliczenia
- Użytkownik może się zarejestrować na emailu w domenie `@e2etest.com` i zostać zalogowany.
- Wygenerowane zostaje dokładnie 5 fiszek z podanego tekstu.
- Wszystkie 5 fiszek zostaje zatwierdzonych.
- Na stronie `/app/flashcard` są widoczne te 5 fiszek i każda posiada typ „AI”.
- Użytkownik może usunąć swoje konto poprzez link w top barze.
- Po usunięciu konta użytkownik jest wylogowany i przekierowany na stronę główną.
- Próba ponownego zalogowania tym samym emailem kończy się błędem.

---

## Pliki implementacji

### Testy E2E
- **Główny test:** `e2e/flashcards-generation.spec.ts`
  - Scenariusz 1: Pełny flow generowania i zatwierdzania (7 kroków)
  - Scenariusz 2: Indywidualne zatwierdzanie propozycji

### Page Object Models
- **AuthPage:** `e2e/page-objects/auth.page.ts`
  - Rejestracja i logowanie użytkowników
  - Generowanie unikalnych emaili testowych

- **GeneratePage:** `e2e/page-objects/generate.page.ts`
  - Generowanie fiszek z tekstu źródłowego
  - Zarządzanie propozycjami (accept/reject/bulk actions)
  - Zapisywanie zaakceptowanych fiszek

- **FlashcardsPage:** `e2e/page-objects/flashcards.page.ts`
  - Przeglądanie listy fiszek
  - Weryfikacja typu i zawartości fiszek
  - Operacje CRUD na fiszkach

### Dokumentacja
- **README:** `e2e/README.md`
  - Instrukcje uruchamiania testów
  - Dokumentacja Page Object Models
  - Best practices i debugging

### Uruchomienie testów
```bash
# Wszystkie testy E2E
npm run test:e2e

# Tryb interaktywny (UI)
npx playwright test --ui

# Konkretny test
npx playwright test e2e/flashcards-generation.spec.ts

# Z widoczną przeglądarką
npx playwright test --headed

# Debug mode
npx playwright test --debug
```
