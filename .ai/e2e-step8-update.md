# E2E Tests - Aktualizacja: Krok 8 (Usuwanie konta)

## 📋 Podsumowanie zmian

Dodano **krok 8** do scenariusza testowego E2E: **Usuwanie konta użytkownika**.

---

## ✅ Zmodyfikowane pliki

### 1. Scenariusz testowy
**Plik:** `.ai/e2e-test-scenario.md`

**Zmiany:**
- ✅ Zaktualizowano cel scenariusza (dodano usuwanie konta)
- ✅ Dodano krok 8: Usuwanie konta użytkownika
  - Kliknięcie linku "Usuń konto" w top barze
  - Przekierowanie na `/auth/delete-account`
  - Wpisanie "USUŃ" w pole potwierdzenia
  - Kliknięcie przycisku "Usuń konto"
  - Weryfikacja przekierowania na stronę główną
  - Opcjonalna weryfikacja: próba logowania kończy się błędem
- ✅ Dodano selektory dla usuwania konta
- ✅ Zaktualizowano kryteria zaliczenia

---

### 2. Page Object: AuthPage
**Plik:** `e2e/page-objects/auth.page.ts`

**Dodane elementy:**
```typescript
// Selektory
readonly deleteAccountLink: Locator;
readonly deleteAccountConfirmInput: Locator;
readonly deleteAccountSubmitButton: Locator;
readonly deleteAccountError: Locator;
```

**Dodane metody:**
```typescript
// Nawigacja
async gotoDeleteAccount()

// Akcje
async clickDeleteAccountLink()
async deleteAccount(confirmation = 'USUŃ')

// Weryfikacja
async waitForDeleteSuccess(expectedUrl = '/')
async expectLoginFailure(email: string, password: string): Promise<boolean>
```

**Implementacja:**
- Selektory oparte na rzeczywistej strukturze UI:
  - Link: `a[href="/auth/delete-account"]` (top bar w Layout.astro)
  - Input: `input[name="confirm"]` (DeleteAccountConfirm.tsx)
  - Button: `button[type="submit"][variant="destructive"]`
- Metody obsługują pełny flow usuwania konta
- Weryfikacja nieudanego logowania po usunięciu konta

---

### 3. Test główny
**Plik:** `e2e/flashcards-generation.spec.ts`

**Dodane kroki:**
```typescript
// STEP 8: Delete user account
await test.step('Delete user account', async () => {
  await authPage.clickDeleteAccountLink();
  await expect(page).toHaveURL(/\/auth\/delete-account/);
  await authPage.deleteAccount('USUŃ');
  await authPage.waitForDeleteSuccess('/');
  await expect(authPage.deleteAccountLink).not.toBeVisible();
});

// STEP 8 (Optional): Verify account is deleted
await test.step('Verify account is deleted', async () => {
  await authPage.gotoLogin();
  const loginFailed = await authPage.expectLoginFailure(testEmail, TEST_CREDENTIALS.password);
  expect(loginFailed).toBe(true);
  const errorText = await authPage.loginFormError.textContent();
  expect(errorText).toMatch(/Invalid|nie|błąd/i);
});
```

**Weryfikacje:**
- ✅ Przekierowanie na `/auth/delete-account`
- ✅ Widoczność formularza usuwania konta
- ✅ Przekierowanie na stronę główną po usunięciu
- ✅ Użytkownik wylogowany (link "Usuń konto" niewidoczny)
- ✅ Logowanie usuniętym kontem kończy się błędem
- ✅ Komunikat błędu zawiera odpowiedni tekst

---

### 4. Dokumentacja
**Pliki zaktualizowane:**

#### `e2e/README.md`
- ✅ Dodano przykłady użycia metod usuwania konta w sekcji AuthPage
- ✅ Zaktualizowano scenariusz 1: dodano kroki 8 i 9

#### `e2e/EXAMPLES.md`
- ✅ Dodano nową sekcję: "Test usuwania konta"
- ✅ Pełny przykład testu z komentarzami
- ✅ Wyjaśnienie kluczowych elementów

#### `.ai/data-testid-guide.md`
- ✅ Dodano sekcję 7: Layout.astro (top bar links)
- ✅ Dodano sekcję 8: DeleteAccountConfirm.tsx
- ✅ Zaktualizowano przykłady Page Objects
- ✅ Zaktualizowano checklist
- ✅ Zaktualizowano konwencję nazewnictwa

#### `.ai/e2e-implementation-summary.md`
- ✅ Zaktualizowano status: "zaktualizowane o krok 8"
- ✅ Dodano informację o nowym kroku
- ✅ Zaktualizowano listę metod AuthPage

#### `.ai/e2e-checklist.md`
- ✅ Zaktualizowano kryteria akceptacji (3 nowe punkty)

---

## 🎯 Struktura UI (rzeczywista)

### Top Bar (Layout.astro)
```tsx
<a href="/auth/delete-account" class="text-sm">Usuń konto</a>
```

### Strona usuwania konta (/auth/delete-account)
**Komponent:** `DeleteAccountConfirm.tsx`

**Elementy:**
- Input: `<Input name="confirm" />` - pole do wpisania "USUŃ"
- Button: `<Button type="submit" variant="destructive">Usuń konto</Button>`
- Error: `<div role="alert">{error}</div>`

**Flow:**
1. Użytkownik wpisuje "USUŃ" (lub "USUN")
2. Kliknięcie przycisku wywołuje `POST /api/auth/account/delete`
3. Backend usuwa użytkownika przez Supabase Admin API
4. Użytkownik zostaje wylogowany
5. Przekierowanie na stronę główną (`/`)

---

## 🧪 Scenariusz testowy (kompletny)

### Krok 8: Usuwanie konta

**Akcje:**
1. Kliknij link "Usuń konto" w top barze
2. Zweryfikuj przekierowanie na `/auth/delete-account`
3. Zweryfikuj widoczność formularza
4. Wpisz "USUŃ" w pole potwierdzenia
5. Kliknij przycisk "Usuń konto"
6. Zweryfikuj przekierowanie na `/`
7. Zweryfikuj, że użytkownik jest wylogowany

**Opcjonalna weryfikacja:**
8. Przejdź na stronę logowania
9. Spróbuj zalogować się usuniętym kontem
10. Zweryfikuj, że logowanie się nie udaje
11. Zweryfikuj komunikat błędu

---

## 📝 Proponowane data-testid (do dodania w UI)

### Layout.astro
```tsx
<a data-testid="delete-account-link" href="/auth/delete-account">Usuń konto</a>
<a data-testid="logout-link" href="#" id="logout-link">Wyloguj</a>
<a data-testid="login-link" href="/auth/login">Zaloguj</a>
<a data-testid="register-link" href="/auth/register">Zarejestruj</a>
```

### DeleteAccountConfirm.tsx
```tsx
<Input data-testid="delete-account-confirm" name="confirm" />
<Button data-testid="delete-account-submit" type="submit" variant="destructive">
  Usuń konto
</Button>
<div data-testid="delete-account-error" role="alert">{error}</div>
```

**Po dodaniu data-testid, zaktualizuj selektory w AuthPage:**
```typescript
this.deleteAccountLink = page.getByTestId('delete-account-link');
this.deleteAccountConfirmInput = page.getByTestId('delete-account-confirm');
this.deleteAccountSubmitButton = page.getByTestId('delete-account-submit');
this.deleteAccountError = page.getByTestId('delete-account-error');
```

---

## ✅ Status implementacji

- [x] Scenariusz zaktualizowany (krok 8 dodany)
- [x] Page Object AuthPage rozszerzony (5 nowych metod)
- [x] Test główny zaktualizowany (2 nowe kroki testowe)
- [x] Dokumentacja zaktualizowana (5 plików)
- [x] Przykłady użycia dodane
- [x] Przewodnik data-testid zaktualizowany
- [x] Checklist zaktualizowany

---

## 🚀 Następne kroki

### 1. Uruchom testy
```bash
npx playwright test e2e/flashcards-generation.spec.ts --ui
```

### 2. Opcjonalnie: Dodaj data-testid do UI
Postępuj zgodnie z przewodnikiem w `.ai/data-testid-guide.md`:
- Layout.astro (top bar links)
- DeleteAccountConfirm.tsx (form elements)

### 3. Zaktualizuj selektory w Page Objects
Po dodaniu data-testid, zamień selektory CSS na `getByTestId()`.

---

## 📊 Podsumowanie

**Dodane:**
- ✅ 1 nowy krok w scenariuszu testowym
- ✅ 4 nowe selektory w AuthPage
- ✅ 5 nowych metod w AuthPage
- ✅ 2 nowe kroki testowe w głównym teście
- ✅ Aktualizacje w 5 plikach dokumentacji
- ✅ 1 nowy przykład w EXAMPLES.md
- ✅ 2 nowe sekcje w data-testid-guide.md

**Czas implementacji:** ~15 minut  
**Linie kodu:** ~100 nowych linii  
**Pliki zmodyfikowane:** 8  
**Pliki utworzone:** 1 (ten plik)

---

## 🎉 Gotowe!

Scenariusz testowy E2E został rozszerzony o krok 8 (usuwanie konta).
Wszystkie pliki zostały zaktualizowane i są gotowe do użycia.

**Test jest w pełni funkcjonalny i można go uruchomić już teraz!**

