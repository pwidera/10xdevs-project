# Quick Start - E2E Tests

## 🚀 Szybkie uruchomienie

### 1. Zainstaluj zależności (jeśli jeszcze nie)
```bash
npm install
```

### 2. Zainstaluj przeglądarki Playwright (jednorazowo)
```bash
npx playwright install chromium
```

### 3. Uruchom testy

**Opcja A: Pełny test suite (z buildem aplikacji)**
```bash
npm run test:e2e
```

**Opcja B: Tryb interaktywny (zalecany)**
```bash
npx playwright test --ui
```

**Opcja C: Konkretny test**
```bash
npx playwright test e2e/flashcards-generation.spec.ts
```

---

## 📊 Wyniki

Po uruchomieniu testów zobaczysz:
- ✅ Liczba przeszłych testów
- ❌ Liczba nieudanych testów
- ⏱️ Czas wykonania
- 📸 Screenshots (jeśli test się nie powiódł)

### Raport HTML
```bash
npm run test:e2e:report
```

---

## 🎯 Co testujemy?

### Test 1: Pełny flow generowania fiszek
1. Rejestracja nowego użytkownika
2. Generowanie 5 fiszek z tekstu o fotosyntezie
3. Zatwierdzenie wszystkich fiszek (bulk action)
4. Weryfikacja na liście fiszek

### Test 2: Indywidualne zatwierdzanie
1. Rejestracja użytkownika
2. Generowanie 3 fiszek
3. Zatwierdzenie 2 pierwszych, odrzucenie 3.
4. Weryfikacja że zapisano tylko 2 fiszki

---

## 🐛 Problemy?

### Test się nie uruchamia
```bash
# Sprawdź czy aplikacja działa
npm run dev

# W drugim terminalu uruchom test
npx playwright test --headed
```

### Test pada
```bash
# Uruchom w trybie debug
npx playwright test --debug

# Zobacz trace
npx playwright show-trace test-results/.../trace.zip
```

### Chcę zobaczyć co się dzieje
```bash
# Uruchom z widoczną przeglądarką
npx playwright test --headed

# Lub w trybie slow-mo
npx playwright test --headed --slow-mo=1000
```

---

## 📚 Więcej informacji

- **Pełna dokumentacja**: `e2e/README.md`
- **Scenariusz testowy**: `.ai/e2e-test-scenario.md`
- **Podsumowanie implementacji**: `.ai/e2e-implementation-summary.md`

---

## ✨ Gotowe!

Testy są gotowe do użycia. Uruchom:
```bash
npx playwright test --ui
```

i zobacz testy w akcji! 🎉

