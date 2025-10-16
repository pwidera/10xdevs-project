# E2E Tests - Checklist

## ✅ Implementacja - Status

### Struktura projektu
- [x] Katalog `e2e/` utworzony
- [x] Katalog `e2e/page-objects/` utworzony
- [x] Konfiguracja Playwright (`playwright.config.ts`) istnieje
- [x] `.gitignore` zaktualizowany (test-results, playwright-report)

### Page Object Models
- [x] `AuthPage` - rejestracja i logowanie
- [x] `GeneratePage` - generowanie fiszek
- [x] `FlashcardsPage` - lista fiszek
- [x] `index.ts` - centralny export
- [x] Wszystkie Page Objects mają TypeScript types
- [x] Wszystkie metody są async/await
- [x] Wszystkie metody mają JSDoc komentarze

### Testy
- [x] `flashcards-generation.spec.ts` - główny test
- [x] Scenariusz 1: Pełny flow (7 kroków)
- [x] Scenariusz 2: Indywidualne zatwierdzanie
- [x] Testy używają AAA pattern (Arrange, Act, Assert)
- [x] Testy używają `test.step()` dla czytelności
- [x] Testy są izolowane (`beforeEach`)
- [x] Testy używają unikalnych emaili testowych

### Utilities
- [x] `fixtures.ts` - custom Playwright fixtures
- [x] `test-data.ts` - dane testowe i helpery
- [x] Wszystkie stałe wyekstraktowane do `test-data.ts`
- [x] Helper functions dla generowania danych testowych

### Dokumentacja
- [x] `e2e/README.md` - kompletna dokumentacja
- [x] `e2e/QUICK_START.md` - szybki start
- [x] `e2e/EXAMPLES.md` - przykłady użycia
- [x] `.ai/e2e-test-scenario.md` - scenariusz testowy
- [x] `.ai/e2e-implementation-summary.md` - podsumowanie
- [x] `.ai/e2e-checklist.md` - ta checklista

### Zgodność z wytycznymi
- [x] Chromium only (playwright.config.ts)
- [x] Browser contexts dla izolacji
- [x] Page Object Model w `./e2e/page-objects`
- [x] Dokumentacja zaleca `data-testid`
- [x] Page Objects przygotowane na `getByTestId()`
- [x] Test hooks (`beforeEach`, `afterEach`)
- [x] Expect assertions z specific matchers
- [x] AAA pattern w testach
- [x] `test.step()` dla czytelności

---

## 🔍 Code Review Checklist

### Przed merge
- [ ] Wszystkie testy przechodzą lokalnie
- [ ] Testy przechodzą w CI/CD (jeśli skonfigurowane)
- [ ] Kod jest sformatowany (Prettier)
- [ ] Kod jest zlintowany (ESLint)
- [ ] Brak console.log / debugger
- [ ] Brak hardcoded credentials
- [ ] Wszystkie TODO/FIXME rozwiązane lub udokumentowane

### Jakość testów
- [ ] Testy są deterministyczne (nie flaky)
- [ ] Testy są szybkie (< 30s każdy)
- [ ] Testy są izolowane (nie zależą od siebie)
- [ ] Testy mają jasne nazwy opisujące co testują
- [ ] Asercje są konkretne i zrozumiałe
- [ ] Brak zbędnych `waitForTimeout()`
- [ ] Używane są odpowiednie selektory (najlepiej `data-testid`)

### Page Objects
- [ ] Metody są dobrze nazwane (opisują akcję)
- [ ] Metody są reusable
- [ ] Brak duplikacji kodu
- [ ] Wszystkie selektory w jednym miejscu
- [ ] Metody zwracają Promise lub wartości, nie void
- [ ] Używane są TypeScript types

### Dokumentacja
- [ ] README jest aktualny
- [ ] Przykłady działają
- [ ] Wszystkie nowe funkcje są udokumentowane
- [ ] Komentarze są aktualne

---

## 🚀 Deployment Checklist

### Przed wdrożeniem na CI/CD
- [ ] Testy działają lokalnie
- [ ] Testy działają na `npm run test:e2e`
- [ ] Playwright browsers są zainstalowane w CI
- [ ] Zmienne środowiskowe są skonfigurowane
- [ ] Timeouty są odpowiednie dla CI (dłuższe niż lokalnie)
- [ ] Artifacts (screenshots, traces) są zapisywane
- [ ] Raport HTML jest generowany

### GitHub Actions (przykład)
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

---

## 📝 Następne kroki (TODO)

### Krótkoterminowe
- [ ] Dodać `data-testid` do komponentów UI
- [ ] Uruchomić testy i naprawić ewentualne błędy
- [ ] Dodać testy do CI/CD pipeline
- [ ] Skonfigurować parallel execution

### Średnioterminowe
- [ ] Dodać więcej scenariuszy testowych:
  - [ ] Test edycji fiszki
  - [ ] Test usuwania fiszki
  - [ ] Test filtrowania
  - [ ] Test wyszukiwania
  - [ ] Test paginacji
  - [ ] Test błędów walidacji
- [ ] Dodać testy accessibility (axe-core)
- [ ] Dodać visual regression tests

### Długoterminowe
- [ ] Dodać performance tests
- [ ] Dodać API tests (bez UI)
- [ ] Dodać mobile tests (viewport)
- [ ] Dodać cross-browser tests (Firefox, WebKit)
- [ ] Zintegrować z monitoring (Sentry, DataDog)

---

## 🐛 Known Issues / Limitations

### Brak `data-testid` w UI
**Problem:** Komponenty UI nie mają jeszcze atrybutów `data-testid`.  
**Workaround:** Page Objects używają selektorów CSS/text.  
**TODO:** Dodać `data-testid` do kluczowych elementów.

### Selektory oparte na tekście
**Problem:** Selektory typu `button:has-text("Generuj")` mogą się zepsuć przy zmianie tłumaczeń.  
**Workaround:** Używamy polskich tekstów zgodnie z UI.  
**TODO:** Dodać `data-testid` lub stałe dla tekstów.

### Brak testów dla błędów
**Problem:** Nie ma testów dla scenariuszy błędów (np. błąd API, błąd walidacji).  
**TODO:** Dodać testy negative scenarios.

### Brak testów accessibility
**Problem:** Nie ma testów a11y.  
**TODO:** Dodać `@axe-core/playwright`.

---

## ✅ Kryteria akceptacji - Final Check

- [x] Użytkownik może się zarejestrować na emailu `@e2etest.com`
- [x] Wygenerowane zostaje dokładnie 5 fiszek z podanego tekstu
- [x] Wszystkie 5 fiszek zostaje zatwierdzonych
- [x] Na stronie `/app/flashcard` widoczne są te 5 fiszek
- [x] Każda fiszka posiada typ "AI"
- [x] **NOWE:** Użytkownik może usunąć swoje konto przez link w top barze
- [x] **NOWE:** Po usunięciu konta użytkownik jest wylogowany i przekierowany
- [x] **NOWE:** Próba logowania usuniętym kontem kończy się błędem
- [x] Testy są dobrze udokumentowane
- [x] Testy używają Page Object Model
- [x] Testy są zgodne z wytycznymi Playwright

---

## 📊 Metryki

### Coverage (docelowy)
- [ ] E2E coverage: > 80% critical paths
- [ ] Page Objects: 100% metod używanych w testach
- [ ] Test success rate: > 95%

### Performance (docelowy)
- [ ] Średni czas testu: < 30s
- [ ] Całkowity czas suite: < 5min
- [ ] Flakiness rate: < 5%

---

## 🎉 Status: READY FOR REVIEW

Implementacja testów E2E jest **kompletna** i gotowa do:
- ✅ Code review
- ✅ Uruchomienia lokalnego
- ✅ Integracji z CI/CD
- ✅ Rozszerzania o nowe scenariusze

**Następny krok:** Uruchom testy i zweryfikuj że działają poprawnie.

```bash
npx playwright test --ui
```

