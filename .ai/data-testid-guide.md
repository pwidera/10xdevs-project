# Przewodnik: Dodawanie data-testid do komponentów

## 📋 Cel

Dodanie atrybutów `data-testid` do kluczowych elementów UI w celu:
- Stabilniejszych testów E2E
- Łatwiejszego debugowania
- Niezależności od zmian w stylach/strukturze DOM
- Niezależności od zmian w tekstach/tłumaczeniach

---

## 🎯 Komponenty do zaktualizowania

### 1. RegisterForm.tsx

**Lokalizacja:** `src/components/auth/RegisterForm.tsx`

**Zmiany:**
```tsx
<Input 
  data-testid="auth-register-email"
  id="email" 
  name="email" 
  type="email" 
  autoComplete="email"
  value={values.email} 
  onChange={onChange} 
  onBlur={validate} 
  disabled={loading} 
  required 
  aria-invalid={!!errors.email} 
  aria-describedby={errors.email ? 'email-error' : undefined} 
/>

<Input 
  data-testid="auth-register-password"
  id="password" 
  name="password" 
  type="password" 
  autoComplete="new-password"
  value={values.password} 
  onChange={onChange} 
  onBlur={validate} 
  disabled={loading} 
  required 
  aria-invalid={!!errors.password} 
  aria-describedby={errors.password ? 'password-error' : undefined} 
/>

<Input 
  data-testid="auth-register-confirm-password"
  id="confirmPassword" 
  name="confirmPassword" 
  type="password" 
  autoComplete="new-password"
  value={values.confirmPassword} 
  onChange={onChange} 
  onBlur={validate} 
  disabled={loading} 
  required 
  aria-invalid={!!errors.confirmPassword} 
  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined} 
/>

<Button 
  data-testid="auth-register-submit"
  type="submit" 
  disabled={loading} 
  className="w-full"
>
  {loading ? 'Rejestracja...' : 'Zarejestruj się'}
</Button>

{errors.form && (
  <div 
    data-testid="auth-register-error"
    role="alert" 
    className="text-sm text-red-600"
  >
    {errors.form}
  </div>
)}
```

---

### 2. LoginForm.tsx

**Lokalizacja:** `src/components/auth/LoginForm.tsx`

**Zmiany:**
```tsx
<Input 
  data-testid="auth-login-email"
  id="email" 
  name="email" 
  type="email" 
  // ...
/>

<Input 
  data-testid="auth-login-password"
  id="password" 
  name="password" 
  type="password" 
  // ...
/>

<Button 
  data-testid="auth-login-submit"
  type="submit" 
  // ...
>
  {loading ? 'Logowanie...' : 'Zaloguj się'}
</Button>

{errors.form && (
  <div 
    data-testid="auth-login-error"
    role="alert" 
    className="text-sm text-red-600"
  >
    {errors.form}
  </div>
)}
```

---

### 3. SourceForm.tsx (TextareaWithCounter)

**Lokalizacja:** `src/components/ai-generator/TextareaWithCounter.tsx`

**Zmiany:**
```tsx
<Textarea
  data-testid="generate-source-textarea"
  name="sourceText"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  disabled={disabled}
  // ...
/>
```

**Lokalizacja:** `src/components/ai-generator/NumberInput.tsx`

**Zmiany:**
```tsx
<Input
  data-testid="generate-max-proposals"
  type="number"
  name="maxProposals"
  value={value}
  onChange={(e) => onChange(Number(e.target.value))}
  // ...
/>
```

**Lokalizacja:** `src/components/ai-generator/LanguageSelect.tsx`

**Zmiany:**
```tsx
<Select
  data-testid="generate-language"
  name="language"
  value={value || ''}
  onValueChange={(val) => onChange(val as 'pl' | 'en' | null)}
  // ...
/>
```

**Lokalizacja:** `src/components/ai-generator/GenerateButton.tsx`

**Zmiany:**
```tsx
<Button
  data-testid="generate-submit"
  type="submit"
  onClick={onClick}
  disabled={disabled || loading}
  // ...
>
  {loading ? (
    <>
      <Loader2 className="animate-spin" />
      Generowanie...
    </>
  ) : (
    <>
      <Sparkles />
      Generuj fiszki
    </>
  )}
</Button>
```

---

### 4. ProposalsSection.tsx

**Lokalizacja:** `src/components/ai-generator/ProposalsSection.tsx`

**Zmiany:**
```tsx
<h2 
  data-testid="proposals-heading"
  className="text-2xl font-bold"
>
  Propozycje fiszek
</h2>
```

**Lokalizacja:** `src/components/ai-generator/BulkActionBar.tsx`

**Zmiany:**
```tsx
<div data-testid="proposals-status-bar" className="flex flex-col...">
  <div className="flex items-center gap-1.5">
    <span data-testid="proposals-pending-count" className="text-muted-foreground">
      Oczekujące: <span className="font-medium text-foreground">{pendingCount}</span>
    </span>
  </div>

  <div className="flex items-center gap-1.5">
    <span data-testid="proposals-accepted-count" className="text-muted-foreground">
      Zaakceptowane: <span className="font-medium text-foreground">{acceptedCount}</span>
    </span>
  </div>

  <Button
    data-testid="proposals-bulk-accept"
    variant="outline"
    size="sm"
    onClick={onBulkAccept}
    // ...
  >
    <CheckCheck className="size-4" />
    Zatwierdź pozostałe
  </Button>

  <Button
    data-testid="proposals-bulk-reject"
    variant="outline"
    size="sm"
    onClick={onBulkReject}
    // ...
  >
    <XCircle className="size-4" />
    Odrzuć pozostałe
  </Button>
</div>
```

**Lokalizacja:** `src/components/ai-generator/ProposalCard.tsx` (jeśli istnieje)

**Zmiany:**
```tsx
<div data-testid="proposal-card" className="...">
  <Button
    data-testid="proposal-accept"
    onClick={() => onAccept(proposal.id)}
    // ...
  >
    Zatwierdź
  </Button>

  <Button
    data-testid="proposal-reject"
    onClick={() => onReject(proposal.id)}
    // ...
  >
    Odrzuć
  </Button>
</div>
```

**Lokalizacja:** `src/components/ai-generator/SaveSelectedBar.tsx`

**Zmiany:**
```tsx
<Button
  data-testid="proposals-save-selected"
  onClick={onSave}
  disabled={!canSave}
  // ...
>
  {isSaving ? (
    <>
      <Loader2 className="animate-spin" />
      Zapisywanie...
    </>
  ) : (
    <>
      <Save />
      Zapisz wybrane ({acceptedCount})
    </>
  )}
</Button>
```

---

### 5. FlashcardRow.tsx

**Lokalizacja:** `src/components/flashcards/FlashcardRow.tsx`

**Zmiany:**
```tsx
// View mode
<div 
  data-testid="flashcard-item"
  className="rounded-lg border bg-card p-4 space-y-3"
>
  <OriginBadge 
    data-testid="flashcard-origin"
    origin={flashcard.origin} 
  />
  
  <Button
    data-testid="flashcard-edit"
    type="button"
    variant="outline"
    size="sm"
    onClick={handleEditClick}
    // ...
  >
    Edytuj
  </Button>
  
  <Button
    data-testid="flashcard-delete"
    type="button"
    variant="destructive"
    size="sm"
    onClick={handleDelete}
    // ...
  >
    Usuń
  </Button>

  <div data-testid="flashcard-front">
    <span className="text-sm font-medium text-muted-foreground">Przód:</span>
    <p className="mt-1 text-sm whitespace-pre-wrap break-words">
      {flashcard.front_text}
    </p>
  </div>

  <div data-testid="flashcard-back">
    <span className="text-sm font-medium text-muted-foreground">Tył:</span>
    <p className="mt-1 text-sm whitespace-pre-wrap break-words">
      {flashcard.back_text}
    </p>
  </div>
</div>

// Edit mode
<div 
  data-testid="flashcard-item-editing"
  className="rounded-lg border bg-card p-4 space-y-4"
>
  <Button
    data-testid="flashcard-cancel"
    type="button"
    variant="outline"
    size="sm"
    onClick={handleCancel}
    // ...
  >
    Anuluj
  </Button>
  
  <Button
    data-testid="flashcard-save"
    type="button"
    size="sm"
    onClick={handleSave}
    // ...
  >
    {isSaving ? 'Zapisywanie...' : 'Zapisz'}
  </Button>

  <Textarea
    data-testid="flashcard-front-edit"
    ref={frontRef}
    value={draftFront}
    // ...
  />

  <Textarea
    data-testid="flashcard-back-edit"
    ref={backRef}
    value={draftBack}
    // ...
  />
</div>
```

---

### 6. OriginBadge.tsx

**Lokalizacja:** `src/components/flashcards/OriginBadge.tsx`

**Zmiany:**
```tsx
export function OriginBadge({ origin, ...props }: OriginBadgeProps) {
  const label = ORIGIN_LABELS[origin];
  const { variant, className } = getVariantAndClass();

  return (
    <Badge 
      data-testid="origin-badge"
      variant={variant} 
      className={className}
      {...props}
    >
      {label}
    </Badge>
  );
}
```

---

## 🔄 Aktualizacja Page Objects

Po dodaniu `data-testid`, zaktualizuj Page Objects aby ich używały:

### AuthPage
```typescript
this.registerEmailInput = page.getByTestId('auth-register-email');
this.registerPasswordInput = page.getByTestId('auth-register-password');
this.registerConfirmPasswordInput = page.getByTestId('auth-register-confirm-password');
this.registerSubmitButton = page.getByTestId('auth-register-submit');
this.registerFormError = page.getByTestId('auth-register-error');
```

### GeneratePage
```typescript
this.sourceTextarea = page.getByTestId('generate-source-textarea');
this.languageSelect = page.getByTestId('generate-language');
this.maxProposalsInput = page.getByTestId('generate-max-proposals');
this.generateButton = page.getByTestId('generate-submit');
this.proposalsHeading = page.getByTestId('proposals-heading');
this.bulkAcceptButton = page.getByTestId('proposals-bulk-accept');
this.bulkRejectButton = page.getByTestId('proposals-bulk-reject');
this.saveSelectedButton = page.getByTestId('proposals-save-selected');
```

### FlashcardsPage
```typescript
this.flashcardRows = page.getByTestId('flashcard-item');
this.getOriginBadge = (index) => this.getFlashcardRow(index).getByTestId('origin-badge');
```

---

## ✅ Checklist

- [ ] RegisterForm.tsx - dodano `data-testid`
- [ ] LoginForm.tsx - dodano `data-testid`
- [ ] TextareaWithCounter.tsx - dodano `data-testid`
- [ ] NumberInput.tsx - dodano `data-testid`
- [ ] LanguageSelect.tsx - dodano `data-testid`
- [ ] GenerateButton.tsx - dodano `data-testid`
- [ ] ProposalsSection.tsx - dodano `data-testid`
- [ ] BulkActionBar.tsx - dodano `data-testid`
- [ ] SaveSelectedBar.tsx - dodano `data-testid`
- [ ] FlashcardRow.tsx - dodano `data-testid`
- [ ] OriginBadge.tsx - dodano `data-testid`
- [ ] Page Objects zaktualizowane
- [ ] Testy uruchomione i przechodzą

---

## 🎯 Konwencja nazewnictwa

**Format:** `{section}-{component}-{element}`

**Przykłady:**
- `auth-register-email` - email input w formularzu rejestracji
- `auth-login-submit` - przycisk submit w formularzu logowania
- `generate-source-textarea` - textarea dla tekstu źródłowego
- `proposals-bulk-accept` - przycisk masowej akceptacji propozycji
- `flashcard-item` - kontener pojedynczej fiszki
- `flashcard-origin` - badge z typem pochodzenia fiszki

**Sekcje:**
- `auth-*` - autentykacja
- `generate-*` - generowanie fiszek
- `proposals-*` - propozycje fiszek
- `flashcard-*` - fiszki
- `flashcards-*` - lista fiszek

---

## 📝 Notatki

- Atrybuty `data-testid` nie wpływają na wygląd ani funkcjonalność
- Są ignorowane przez przeglądarki (nie wpływają na performance)
- Są używane tylko w testach
- Pomagają w debugowaniu (łatwo znaleźć element w DevTools)
- Są niezależne od zmian w stylach, tekstach, strukturze DOM

