# E2E Tests - Przykłady użycia

Ten plik zawiera przykłady użycia Page Objects i wzorców testowych.

## 📋 Spis treści

- [Podstawowy test](#podstawowy-test)
- [Test z fixtures](#test-z-fixtures)
- [Test z wieloma krokami](#test-z-wieloma-krokami)
- [Test z danymi testowymi](#test-z-danymi-testowymi)
- [Test z asercjami](#test-z-asercjami)
- [Test z retry](#test-z-retry)
- [Test z tagami](#test-z-tagami)
- [Test usuwania konta](#test-usuwania-konta)

---

## Podstawowy test

```typescript
import { test, expect } from '@playwright/test';
import { AuthPage, GeneratePage } from './page-objects';

test('user can register and generate flashcards', async ({ page }) => {
  // Arrange
  const authPage = new AuthPage(page);
  const generatePage = new GeneratePage(page);
  const email = AuthPage.generateTestEmail();
  
  // Act
  await authPage.gotoRegister();
  await authPage.register(email, 'Password123!');
  await authPage.waitForRegisterSuccess();
  
  await generatePage.generateFlashcards('Sample text...', 3, 'pl');
  await generatePage.waitForGenerationComplete();
  
  // Assert
  const count = await generatePage.getPendingCount();
  expect(count).toBe(3);
});
```

---

## Test z fixtures

```typescript
import { test, expect } from './fixtures';

test('user can register using fixtures', async ({ authPage }) => {
  // Page Objects są automatycznie dostępne jako fixtures
  const email = AuthPage.generateTestEmail();
  
  await authPage.gotoRegister();
  await authPage.register(email, 'Password123!');
  await authPage.waitForRegisterSuccess();
  
  await expect(authPage.page).toHaveURL(/\/app/);
});
```

---

## Test z wieloma krokami

```typescript
import { test, expect } from './fixtures';
import { SAMPLE_TEXTS, FLASHCARD_COUNTS } from './test-data';

test('complete flashcard workflow', async ({ authPage, generatePage, flashcardsPage }) => {
  const email = AuthPage.generateTestEmail();
  
  await test.step('Register user', async () => {
    await authPage.gotoRegister();
    await authPage.register(email, 'Password123!');
    await authPage.waitForRegisterSuccess();
  });
  
  await test.step('Generate flashcards', async () => {
    await generatePage.generateFlashcards(
      SAMPLE_TEXTS.photosynthesis,
      FLASHCARD_COUNTS.medium,
      'pl'
    );
    await generatePage.waitForGenerationComplete();
  });
  
  await test.step('Accept all proposals', async () => {
    await generatePage.acceptAllProposals();
    await generatePage.saveAcceptedProposals();
  });
  
  await test.step('Verify flashcards', async () => {
    await flashcardsPage.goto();
    const count = await flashcardsPage.getFlashcardsCount();
    expect(count).toBe(FLASHCARD_COUNTS.medium);
  });
});
```

---

## Test z danymi testowymi

```typescript
import { test, expect } from './fixtures';
import { 
  SAMPLE_TEXTS, 
  FLASHCARD_COUNTS, 
  TEST_CREDENTIALS,
  LANGUAGES,
  generateTestEmail 
} from './test-data';

test('generate flashcards in English', async ({ authPage, generatePage }) => {
  const email = generateTestEmail('en-test');
  
  await authPage.gotoRegister();
  await authPage.register(email, TEST_CREDENTIALS.password);
  await authPage.waitForRegisterSuccess();
  
  await generatePage.generateFlashcards(
    SAMPLE_TEXTS.short,
    FLASHCARD_COUNTS.small,
    LANGUAGES.english  // 'en'
  );
  
  await generatePage.waitForGenerationComplete();
  const count = await generatePage.getPendingCount();
  expect(count).toBe(FLASHCARD_COUNTS.small);
});
```

---

## Test z asercjami

```typescript
import { test, expect } from './fixtures';

test('flashcard has correct structure', async ({ flashcardsPage }) => {
  await flashcardsPage.goto();
  
  // Sprawdź liczbę elementów
  const count = await flashcardsPage.getFlashcardsCount();
  expect(count).toBeGreaterThan(0);
  
  // Sprawdź typ pierwszej fiszki
  const originText = await flashcardsPage.getOriginText(0);
  expect(originText).toMatch(/AI|Ręczne/);
  
  // Sprawdź zawartość
  const frontText = await flashcardsPage.getFrontText(0);
  const backText = await flashcardsPage.getBackText(0);
  expect(frontText).toBeTruthy();
  expect(backText).toBeTruthy();
  expect(frontText.length).toBeGreaterThan(0);
  expect(backText.length).toBeGreaterThan(0);
  
  // Sprawdź URL
  expect(flashcardsPage.page).toHaveURL(/\/app\/flashcard/);
  
  // Sprawdź widoczność elementów
  const firstRow = flashcardsPage.getFlashcardRow(0);
  await expect(firstRow).toBeVisible();
});
```

---

## Test z retry

```typescript
import { test, expect } from './fixtures';

test('flaky operation with retry', async ({ generatePage }) => {
  // Playwright automatycznie retry'uje asercje
  await expect(generatePage.proposalsHeading).toBeVisible({ timeout: 30000 });
  
  // Dla custom logiki można użyć retry
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    try {
      await generatePage.saveAcceptedProposals();
      break;
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) throw error;
      await generatePage.page.waitForTimeout(1000);
    }
  }
});
```

---

## Test z tagami

```typescript
import { test, expect } from './fixtures';

test.describe('Flashcard CRUD operations', () => {
  test('create flashcard @smoke @crud', async ({ flashcardsPage }) => {
    // Test tworzenia fiszki
  });
  
  test('edit flashcard @crud', async ({ flashcardsPage }) => {
    // Test edycji fiszki
  });
  
  test('delete flashcard @crud @destructive', async ({ flashcardsPage }) => {
    // Test usuwania fiszki
  });
});

// Uruchom tylko testy z tagiem @smoke
// npx playwright test --grep @smoke

// Uruchom wszystkie oprócz @destructive
// npx playwright test --grep-invert @destructive
```

---

## Test z beforeEach/afterEach

```typescript
import { test, expect } from './fixtures';
import { generateTestEmail, TEST_CREDENTIALS } from './test-data';

test.describe('Authenticated user tests', () => {
  let userEmail: string;
  
  test.beforeEach(async ({ authPage }) => {
    // Setup: Zaloguj użytkownika przed każdym testem
    userEmail = generateTestEmail();
    await authPage.gotoRegister();
    await authPage.register(userEmail, TEST_CREDENTIALS.password);
    await authPage.waitForRegisterSuccess();
  });
  
  test.afterEach(async ({ page }) => {
    // Cleanup: Wyloguj po każdym teście (opcjonalnie)
    // await page.goto('/auth/logout');
  });
  
  test('can generate flashcards', async ({ generatePage }) => {
    // Użytkownik jest już zalogowany
    await generatePage.goto();
    // ...
  });
  
  test('can view flashcards', async ({ flashcardsPage }) => {
    // Użytkownik jest już zalogowany
    await flashcardsPage.goto();
    // ...
  });
});
```

---

## Test z parametryzacją

```typescript
import { test, expect } from './fixtures';
import { SAMPLE_TEXTS, FLASHCARD_COUNTS } from './test-data';

const testCases = [
  { text: SAMPLE_TEXTS.short, count: FLASHCARD_COUNTS.small, expected: 3 },
  { text: SAMPLE_TEXTS.photosynthesis, count: FLASHCARD_COUNTS.medium, expected: 5 },
  { text: SAMPLE_TEXTS.long, count: FLASHCARD_COUNTS.large, expected: 10 },
];

for (const { text, count, expected } of testCases) {
  test(`generate ${expected} flashcards`, async ({ generatePage }) => {
    await generatePage.generateFlashcards(text, count, 'pl');
    await generatePage.waitForGenerationComplete();
    
    const pendingCount = await generatePage.getPendingCount();
    expect(pendingCount).toBe(expected);
  });
}
```

---

## Test z custom timeout

```typescript
import { test, expect } from './fixtures';

test('slow operation', async ({ generatePage }) => {
  // Zwiększ timeout dla tego testu
  test.setTimeout(60000); // 60 sekund
  
  await generatePage.generateFlashcards('Very long text...', 20, 'pl');
  
  // Lub dla konkretnej asercji
  await expect(generatePage.proposalsHeading).toBeVisible({ timeout: 45000 });
});
```

---

## Test z screenshot

```typescript
import { test, expect } from './fixtures';

test('visual verification', async ({ page, flashcardsPage }) => {
  await flashcardsPage.goto();
  await flashcardsPage.waitForFlashcardsLoad();
  
  // Screenshot całej strony
  await page.screenshot({ path: 'screenshots/flashcards-list.png', fullPage: true });
  
  // Screenshot konkretnego elementu
  const firstCard = flashcardsPage.getFlashcardRow(0);
  await firstCard.screenshot({ path: 'screenshots/flashcard-item.png' });
  
  // Visual regression (wymaga baseline)
  await expect(page).toHaveScreenshot('flashcards-list.png');
});
```

---

## Test z API mocking (MSW)

```typescript
import { test, expect } from '@playwright/test';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.post('/api/ai/generate', (req, res, ctx) => {
    return res(ctx.json({
      generation_session: { id: 'mock-id', proposals_count: 5 },
      proposals: [
        { id: '1', front_text: 'Q1', back_text: 'A1' },
        { id: '2', front_text: 'Q2', back_text: 'A2' },
        // ...
      ]
    }));
  })
);

test.beforeAll(() => server.listen());
test.afterEach(() => server.resetHandlers());
test.afterAll(() => server.close());

test('generate with mocked API', async ({ generatePage }) => {
  await generatePage.generateFlashcards('Test text', 5, 'pl');
  await generatePage.waitForGenerationComplete();
  
  const count = await generatePage.getPendingCount();
  expect(count).toBe(5);
});
```

---

## Test usuwania konta

```typescript
import { test, expect } from './fixtures';
import { TEST_CREDENTIALS } from './test-data';

test('user can delete their account', async ({ authPage }) => {
  // Arrange - Register user
  const email = AuthPage.generateTestEmail();
  await authPage.gotoRegister();
  await authPage.register(email, TEST_CREDENTIALS.password);
  await authPage.waitForRegisterSuccess();

  // Act - Delete account
  await test.step('Delete account via top bar link', async () => {
    await authPage.clickDeleteAccountLink();
    await expect(authPage.deleteAccountConfirmInput).toBeVisible();
    await authPage.deleteAccount('USUŃ');
    await authPage.waitForDeleteSuccess('/');
  });

  // Assert - Verify account is deleted
  await test.step('Verify account is deleted', async () => {
    // Should be redirected to home page
    await expect(authPage.page).toHaveURL('/');

    // Delete account link should not be visible (user logged out)
    await expect(authPage.deleteAccountLink).not.toBeVisible();

    // Try to login - should fail
    await authPage.gotoLogin();
    const loginFailed = await authPage.expectLoginFailure(email, TEST_CREDENTIALS.password);
    expect(loginFailed).toBe(true);

    // Error message should be visible
    await expect(authPage.loginFormError).toBeVisible();
    const errorText = await authPage.loginFormError.textContent();
    expect(errorText).toMatch(/Invalid|nie|błąd/i);
  });
});
```

**Kluczowe elementy:**
- `clickDeleteAccountLink()` - Kliknięcie linku w top barze
- `deleteAccount('USUŃ')` - Wpisanie potwierdzenia i kliknięcie przycisku
- `waitForDeleteSuccess('/')` - Oczekiwanie na przekierowanie
- `expectLoginFailure()` - Weryfikacja, że logowanie się nie udaje

---

## 📚 Więcej przykładów

Zobacz:
- `e2e/flashcards-generation.spec.ts` - Pełny przykład testów
- `e2e/README.md` - Dokumentacja
- [Playwright Docs](https://playwright.dev/docs/writing-tests) - Oficjalna dokumentacja

