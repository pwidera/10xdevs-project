# E2E Tests - Playwright

Testy end-to-end dla aplikacji 10xFlashAI, zbudowane z wykorzystaniem Playwright.

## 📋 Spis treści

- [Struktura testów](#struktura-testów)
- [Uruchamianie testów](#uruchamianie-testów)
- [Page Object Model](#page-object-model)
- [Scenariusze testowe](#scenariusze-testowe)
- [Debugging](#debugging)
- [Best Practices](#best-practices)

## 🗂️ Struktura testów

```
e2e/
├── page-objects/           # Page Object Models (POM)
│   ├── auth.page.ts       # Strony autentykacji (login, register)
│   ├── generate.page.ts   # Strona generowania fiszek
│   ├── flashcards.page.ts # Strona listy fiszek
│   └── index.ts           # Centralny export Page Objects
├── fixtures.ts            # Custom Playwright fixtures
├── flashcards-generation.spec.ts  # Test głównego flow generowania
├── smoke.spec.ts          # Podstawowy test smoke
└── README.md              # Ten plik
```

## 🚀 Uruchamianie testów

### Wymagania wstępne

- Node.js 22.14.0
- Zainstalowane zależności: `npm install`
- Uruchomiona aplikacja lub skonfigurowany webServer w `playwright.config.ts`

### Komendy

```bash
# Uruchom wszystkie testy E2E (z buildem aplikacji)
npm run test:e2e

# Uruchom testy w trybie UI (interaktywny)
npx playwright test --ui

# Uruchom konkretny plik testowy
npx playwright test e2e/flashcards-generation.spec.ts

# Uruchom testy w trybie headed (widoczna przeglądarka)
npx playwright test --headed

# Uruchom testy w trybie debug
npx playwright test --debug

# Wygeneruj raport HTML
npm run test:e2e:report
```

### Tryb watch (development)

```bash
# W jednym terminalu: uruchom dev server
npm run dev

# W drugim terminalu: uruchom testy z watch
npx playwright test --ui
```

## 🎭 Page Object Model

Testy wykorzystują wzorzec Page Object Model dla lepszej maintainability i reusability.

### Sposób użycia

**Opcja 1: Bezpośredni import (standardowy)**
```typescript
import { test, expect } from '@playwright/test';
import { AuthPage, GeneratePage, FlashcardsPage } from './page-objects';

test('my test', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.gotoRegister();
});
```

**Opcja 2: Fixtures (zalecany)**
```typescript
import { test, expect } from './fixtures';

test('my test', async ({ authPage, generatePage }) => {
  // Page Objects są automatycznie dostępne jako fixtures
  await authPage.gotoRegister();
  await generatePage.goto();
});
```

### AuthPage (`page-objects/auth.page.ts`)

Obsługuje strony autentykacji:

```typescript
const authPage = new AuthPage(page);

// Rejestracja
await authPage.gotoRegister();
await authPage.register('user@e2etest.com', 'password123');
await authPage.waitForRegisterSuccess();

// Logowanie
await authPage.gotoLogin();
await authPage.login('user@e2etest.com', 'password123');
await authPage.waitForLoginSuccess();

// Generowanie unikalnego emaila testowego
const email = AuthPage.generateTestEmail('prefix'); // prefix+timestamp@e2etest.com
```

### GeneratePage (`page-objects/generate.page.ts`)

Obsługuje stronę generowania fiszek AI:

```typescript
const generatePage = new GeneratePage(page);

// Nawigacja
await generatePage.goto();

// Generowanie fiszek
await generatePage.generateFlashcards(sourceText, 5, 'pl');
await generatePage.waitForGenerationComplete();

// Zarządzanie propozycjami
await generatePage.acceptProposal(0);           // Akceptuj pierwszą
await generatePage.rejectProposal(1);           // Odrzuć drugą
await generatePage.acceptAllProposals();        // Akceptuj wszystkie pozostałe
await generatePage.saveAcceptedProposals();     // Zapisz zaakceptowane

// Sprawdzanie statusu
const acceptedCount = await generatePage.getAcceptedCount();
const pendingCount = await generatePage.getPendingCount();
```

### FlashcardsPage (`page-objects/flashcards.page.ts`)

Obsługuje stronę listy fiszek:

```typescript
const flashcardsPage = new FlashcardsPage(page);

// Nawigacja
await flashcardsPage.goto();
await flashcardsPage.waitForFlashcardsLoad();

// Sprawdzanie fiszek
const count = await flashcardsPage.getFlashcardsCount();
const allAreAI = await flashcardsPage.areAllFlashcardsAI();
const originText = await flashcardsPage.getOriginText(0);
const frontText = await flashcardsPage.getFrontText(0);
const backText = await flashcardsPage.getBackText(0);

// Operacje CRUD
await flashcardsPage.editFlashcard(0, 'New front', 'New back');
await flashcardsPage.deleteFlashcard(0);

// Filtrowanie i wyszukiwanie
await flashcardsPage.filterByOrigin('AI_full');
await flashcardsPage.search('fotosynteza');
```

## 📝 Scenariusze testowe

### Test główny: `flashcards-generation.spec.ts`

**Scenariusz 1: Pełny flow generowania i zatwierdzania**

1. ✅ Wejście na stronę główną
2. ✅ Rejestracja nowego użytkownika (`test+timestamp@e2etest.com`)
3. ✅ Przejście na `/app/generate`
4. ✅ Wygenerowanie 5 fiszek z tekstu o fotosyntezie
5. ✅ Zatwierdzenie wszystkich fiszek (bulk action)
6. ✅ Przejście na `/app/flashcard`
7. ✅ Weryfikacja: 5 fiszek widocznych, wszystkie typu AI

**Scenariusz 2: Indywidualne zatwierdzanie propozycji**

1. ✅ Rejestracja użytkownika
2. ✅ Wygenerowanie 3 fiszek
3. ✅ Zatwierdzenie 2 pierwszych, odrzucenie 3. propozycji
4. ✅ Weryfikacja: tylko 2 fiszki zapisane

### Test smoke: `smoke.spec.ts`

- ✅ Podstawowy test ładowania strony głównej

## 🐛 Debugging

### Playwright Inspector

```bash
# Uruchom test w trybie debug
npx playwright test --debug

# Debug konkretnego testu
npx playwright test e2e/flashcards-generation.spec.ts --debug
```

### Trace Viewer

Traces są automatycznie zapisywane przy pierwszym retry (konfiguracja: `trace: 'on-first-retry'`).

```bash
# Otwórz trace viewer
npx playwright show-trace trace.zip
```

### Screenshots i Videos

Dodaj do testu:

```typescript
// Screenshot
await page.screenshot({ path: 'screenshot.png' });

// Screenshot całej strony
await page.screenshot({ path: 'screenshot.png', fullPage: true });
```

### Codegen - nagrywanie testów

```bash
# Nagraj nowy test
npx playwright codegen http://localhost:4321

# Nagraj z konkretną przeglądarką
npx playwright codegen --browser=chromium http://localhost:4321
```

## ✅ Best Practices

### 1. Używaj Page Object Model

✅ **Dobrze:**
```typescript
await authPage.register(email, password);
```

❌ **Źle:**
```typescript
await page.locator('input[name="email"]').fill(email);
await page.locator('input[name="password"]').fill(password);
await page.locator('button[type="submit"]').click();
```

### 2. Używaj `data-testid` dla stabilnych selektorów

✅ **Dobrze:**
```typescript
await page.getByTestId('submit-button').click();
```

❌ **Źle:**
```typescript
await page.locator('div > button.btn-primary').click();
```

### 3. Struktura AAA (Arrange, Act, Assert)

```typescript
test('should do something', async ({ page }) => {
  // Arrange - przygotowanie
  const authPage = new AuthPage(page);
  await authPage.gotoLogin();
  
  // Act - akcja
  await authPage.login(email, password);
  
  // Assert - weryfikacja
  await expect(page).toHaveURL(/\/app/);
});
```

### 4. Używaj `test.step()` dla czytelności

```typescript
await test.step('Register new user', async () => {
  await authPage.register(email, password);
});

await test.step('Generate flashcards', async () => {
  await generatePage.generateFlashcards(text, 5);
});
```

### 5. Czekaj na stan, nie na timeout

✅ **Dobrze:**
```typescript
await page.waitForLoadState('networkidle');
await element.waitFor({ state: 'visible' });
```

❌ **Źle:**
```typescript
await page.waitForTimeout(5000);
```

### 6. Izoluj testy - każdy test niezależny

```typescript
test.beforeEach(async ({ page }) => {
  // Każdy test dostaje świeży kontekst
  testEmail = AuthPage.generateTestEmail();
});
```

### 7. Używaj asercji Playwright

✅ **Dobrze:**
```typescript
await expect(page).toHaveURL(/\/app/);
await expect(element).toBeVisible();
await expect(element).toHaveText('Expected text');
await expect(element).toHaveCount(5);
```

## 🔧 Konfiguracja

Konfiguracja znajduje się w `playwright.config.ts`:

- **Browser:** Chromium (zgodnie z wytycznymi)
- **Base URL:** `http://localhost:4321`
- **Timeout:** 30s (domyślnie)
- **Retries:** 0 (lokalnie), 2 (CI)
- **Parallel:** Tak (dla szybszego wykonania)
- **Web Server:** Automatyczne uruchomienie `npm run preview`

## 📚 Dodatkowe zasoby

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Scenariusz testowy](.ai/e2e-test-scenario.md)
- [Plan testów](.ai/test-plan.md)

## 🎯 Kryteria akceptacji

Test jest zaliczony, gdy:

- ✅ Użytkownik może się zarejestrować na emailu `@e2etest.com`
- ✅ Wygenerowane zostaje dokładnie 5 fiszek z podanego tekstu
- ✅ Wszystkie 5 fiszek zostaje zatwierdzonych
- ✅ Na stronie `/app/flashcard` widoczne są te 5 fiszek
- ✅ Każda fiszka posiada typ "AI"

