/**
 * Test Data and Helpers for E2E Tests
 * 
 * Contains reusable test data, constants, and helper functions.
 */

/**
 * Test user credentials
 */
export const TEST_CREDENTIALS = {
  password: 'Playwright123!',
  emailDomain: 'e2etest.com',
} as const;

/**
 * Sample source texts for flashcard generation
 */
export const SAMPLE_TEXTS = {
  /**
   * Photosynthesis text (Polish) - 271 characters
   * Good for generating 3-5 flashcards
   */
  photosynthesis: `Fotosynteza (stgr. φῶς – światło, σύνθεσις – łączenie) – proces wytwarzania związków organicznych z materii nieorganicznej zachodzący w komórkach zawierających chlorofil lub bakteriochlorofil, przy udziale światła. Jest to jedna z najważniejszych przemian biochemicznych na Ziemi[1]. Proces ten utrzymuje wysoki poziom tlenu w atmosferze oraz przyczynia się do wzrostu ilości węgla organicznego w puli węgla, zwiększając masę materii organicznej kosztem materii nieorganicznej`,

  /**
   * Short text (Polish) - 150 characters
   * Good for generating 1-2 flashcards
   */
  short: `JavaScript to język programowania wysokiego poziomu, interpretowany, wieloparadygmatowy. Został stworzony przez Brendana Eicha w 1995 roku.`,

  /**
   * Long text (Polish) - 500+ characters
   * Good for generating 8-10 flashcards
   */
  long: `React to biblioteka JavaScript do budowania interfejsów użytkownika, stworzona przez Facebook. Wykorzystuje komponentowy model programowania, gdzie każdy komponent jest niezależną, wielokrotnego użytku częścią interfejsu. React używa wirtualnego DOM do optymalizacji wydajności, co pozwala na szybkie renderowanie zmian. Kluczowe koncepcje to: komponenty funkcyjne i klasowe, hooki (useState, useEffect), props i state, JSX (rozszerzenie składni JavaScript), lifecycle methods, oraz jednokierunkowy przepływ danych. React jest często używany z bibliotekami takimi jak Redux do zarządzania stanem aplikacji.`,
} as const;

/**
 * Generate unique test email
 * @param prefix - Email prefix (default: 'test')
 * @returns Email in format: prefix+timestamp@e2etest.com
 */
export function generateTestEmail(prefix = 'test'): string {
  return `${prefix}+${Date.now()}@${TEST_CREDENTIALS.emailDomain}`;
}

/**
 * Generate random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Wait for a specific amount of time
 * @param ms - Milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Flashcard count presets
 */
export const FLASHCARD_COUNTS = {
  min: 1,
  small: 3,
  medium: 5,
  large: 10,
  max: 20,
} as const;

/**
 * Language options
 */
export const LANGUAGES = {
  polish: 'pl',
  english: 'en',
} as const;

/**
 * Flashcard origin types
 */
export const FLASHCARD_ORIGINS = {
  manual: 'manual',
  aiFull: 'AI_full',
  aiEdited: 'AI_edited',
} as const;

/**
 * Origin labels (Polish)
 */
export const ORIGIN_LABELS = {
  [FLASHCARD_ORIGINS.manual]: 'Ręczne',
  [FLASHCARD_ORIGINS.aiFull]: 'AI',
  [FLASHCARD_ORIGINS.aiEdited]: 'AI (edytowane)',
} as const;

/**
 * Common timeouts (in milliseconds)
 */
export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  generation: 30000,
  save: 10000,
} as const;

/**
 * Common routes
 */
export const ROUTES = {
  home: '/',
  register: '/auth/register',
  login: '/auth/login',
  generate: '/app/generate',
  flashcards: '/app/flashcard',
  flashcardsNew: '/app/flashcards/new',
} as const;

