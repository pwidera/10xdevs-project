# Unit Tests Documentation

Kompleksowy zestaw testów jednostkowych dla warstwy `lib/` projektu 10xdevs.

## 📋 Spis treści

- [Przegląd](#przegląd)
- [Struktura testów](#struktura-testów)
- [Uruchamianie testów](#uruchamianie-testów)
- [Pokrycie testami](#pokrycie-testami)
- [Szczegóły testów](#szczegóły-testów)

## 🎯 Przegląd

Testy jednostkowe pokrywają trzy główne obszary:

1. **Validation** - Schematy walidacji Zod dla danych wejściowych
2. **Utils** - Funkcje pomocnicze (className merging)
3. **Services** - Logika biznesowa i integracje z API

Wszystkie testy są napisane zgodnie z najlepszymi praktykami Vitest i wykorzystują:
- ✅ Arrange-Act-Assert pattern
- ✅ Descriptive test names
- ✅ Comprehensive edge case coverage
- ✅ Proper mocking and isolation
- ✅ Type-safe assertions

## 📁 Struktura testów

```
src/lib/
├── __tests__/
│   ├── utils.test.ts                    # Testy dla utils.ts
│   └── README.md                        # Ten plik
├── validation/__tests__/
│   ├── ai-generation.schema.test.ts     # Testy schematów AI
│   ├── auth.schemas.test.ts             # Testy schematów auth (client)
│   └── auth.server.schemas.test.ts      # Testy schematów auth (server)
└── services/__tests__/
    ├── http.test.ts                     # Testy HTTP utilities
    ├── ai-generation.service.test.ts    # Testy AI service
    └── generation-session.service.test.ts # Testy session service
```

## 🚀 Uruchamianie testów

### Wszystkie testy
```bash
npm test
```

### Tryb watch (development)
```bash
npm run test:watch
```

### UI mode (wizualna nawigacja)
```bash
npm run test:ui
```

### Coverage report
```bash
npm run test:cov
```

### Konkretny plik testowy
```bash
npm test -- src/lib/validation/__tests__/ai-generation.schema.test.ts
```

### Filtrowanie po nazwie testu
```bash
npm test -- -t "validates email"
```

## 📊 Pokrycie testami

### lib/validation/ - 100% pokrycie

#### ai-generation.schema.test.ts (46 testów)
- ✅ GenerateFlashcardsSchema
  - source_text: min/max length, trimming, boundaries
  - language: pl/en/null, invalid codes
  - max_proposals: 1-20 range, defaults, integers
- ✅ FlashcardProposalSchema
  - front_text/back_text: empty, whitespace, max length
- ✅ AcceptProposalsSchema
  - UUID validation
  - Cards array: 1-20 items, validation

#### auth.schemas.test.ts (26 testów)
- ✅ emailSchema: format, trimming, invalid cases
- ✅ passwordSchema: min length, whitespace preservation
- ✅ loginSchema: field validation, trimming
- ✅ registerSchema: password matching, case sensitivity

#### auth.server.schemas.test.ts (28 testów)
- ✅ loginSchema: optional 'next' parameter
- ✅ registerSchema: password confirmation
- ✅ forgotPasswordSchema: email validation
- ✅ changePasswordSchema: password rules
- ✅ deleteAccountSchema: "USUŃ"/"USUN" confirmation

### lib/utils.test.ts - 100% pokrycie (25 testów)

- ✅ Basic className merging
- ✅ Conditional classes (falsy filtering)
- ✅ Array and object inputs
- ✅ Tailwind conflict resolution (padding, margin, colors, width, height)
- ✅ Component variant patterns
- ✅ Override patterns
- ✅ Edge cases: empty strings, duplicates, special characters, arbitrary values

### lib/services/ - Wysokie pokrycie

#### http.test.ts (30 testów)
- ✅ post(): success responses, normalization, headers, body serialization
- ✅ Error handling: 400, 401, 404, 500, non-JSON responses
- ✅ del(): POST method, response normalization, error handling

#### ai-generation.service.test.ts (35 testów)
- ✅ Constructor: API key validation
- ✅ generateFlashcards(): successful generation, hash computation
- ✅ OpenRouter API: request format, language prompts, max proposals
- ✅ Response parsing: JSON extraction, markdown handling, invalid proposals
- ✅ Error handling: API errors, timeout, invalid responses, network errors
- ✅ Text processing: trimming, truncation to 1000 chars

#### generation-session.service.test.ts (20 testów)
- ✅ createSession(): successful creation, field selection
- ✅ Database error handling: insert failures, no data returned
- ✅ Parameter validation: proposals count (1-20), source text length (100-10000)
- ✅ Optional parameters: generateDuration

## 🔍 Szczegóły testów

### Validation Tests

**Cel**: Zapewnić, że wszystkie dane wejściowe są poprawnie walidowane przed przetworzeniem.

**Kluczowe scenariusze**:
- Granice wartości (min/max)
- Trimming whitespace
- Wymagane vs opcjonalne pola
- Formaty (email, UUID)
- Niestandardowe reguły (password matching, confirmation text)

**Przykład**:
```typescript
it('rejects source text shorter than 100 chars', () => {
  const result = GenerateFlashcardsSchema.safeParse({
    source_text: 'a'.repeat(99),
    language: 'pl',
    max_proposals: 10,
  });

  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].message).toContain('at least 100 characters');
  }
});
```

### Utils Tests

**Cel**: Weryfikacja poprawności mergowania klas CSS z rozwiązywaniem konfliktów Tailwind.

**Kluczowe scenariusze**:
- Podstawowe mergowanie stringów
- Warunkowe klasy (boolean filtering)
- Konflikty Tailwind (ostatnia wygrywa)
- Wzorce komponentów (variants, overrides)

**Przykład**:
```typescript
it('resolves conflicting padding classes (keeps last)', () => {
  const result = cn('p-4', 'p-8');
  expect(result).toBe('p-8');
});
```

### Services Tests

**Cel**: Testowanie logiki biznesowej w izolacji z mockowaniem zależności zewnętrznych.

**Kluczowe techniki**:
- `vi.fn()` dla mocków funkcji
- `vi.spyOn()` dla monitorowania wywołań
- `vi.useFakeTimers()` dla testów timeout
- Mock Supabase client z chainable API

**Przykład**:
```typescript
it('throws OpenRouterTimeoutError on request timeout', async () => {
  vi.useFakeTimers();

  mockFetch.mockImplementationOnce(() => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ok: true }), 35000);
    });
  });

  const promise = service.generateFlashcards(validParams);
  vi.advanceTimersByTime(30000);
  
  await expect(promise).rejects.toThrow(OpenRouterTimeoutError);
  
  vi.useRealTimers();
});
```

## 🎓 Najlepsze praktyki

1. **Descriptive test names** - Nazwa testu opisuje dokładnie co jest testowane
2. **Arrange-Act-Assert** - Wyraźne sekcje: setup, wykonanie, weryfikacja
3. **One assertion per concept** - Każdy test weryfikuje jedną rzecz
4. **Test edge cases** - Granice, null, undefined, empty, max values
5. **Mock external dependencies** - Izolacja od API, bazy danych, timers
6. **Type safety** - Wykorzystanie TypeScript w testach
7. **Cleanup** - `beforeEach`/`afterEach` dla czystego stanu

## 📈 Metryki

- **Łączna liczba testów**: ~210
- **Średni czas wykonania**: < 2s
- **Pokrycie kodu**: > 95% dla validation i utils, > 85% dla services
- **Flaky tests**: 0 (wszystkie deterministyczne)

## 🔧 Konfiguracja

Testy wykorzystują konfigurację z `vitest.config.ts`:

```typescript
{
  environment: 'jsdom',
  setupFiles: ['test/setup.ts'],
  globals: true,
  include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
}
```

## 📝 Dodawanie nowych testów

1. Utwórz plik `*.test.ts` obok testowanego modułu lub w `__tests__/`
2. Importuj funkcje testowe: `import { describe, it, expect } from 'vitest'`
3. Grupuj testy w `describe` blocks
4. Używaj `beforeEach`/`afterEach` dla setup/cleanup
5. Mockuj zależności zewnętrzne
6. Uruchom `npm run test:watch` podczas pisania

## 🐛 Debugging

### Pojedynczy test
```typescript
it.only('focuses on this test', () => {
  // ...
});
```

### Skip test
```typescript
it.skip('temporarily disabled', () => {
  // ...
});
```

### Console output
```bash
npm test -- --reporter=verbose
```

### UI mode dla debugowania
```bash
npm run test:ui
```

## 📚 Dodatkowe zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Zod Documentation](https://zod.dev/)
- [Vitest UI](https://vitest.dev/guide/ui.html)

