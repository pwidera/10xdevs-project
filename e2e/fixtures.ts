import { test as base } from "@playwright/test";
import { AuthPage, GeneratePage, FlashcardsPage } from "./page-objects";

/**
 * Custom Playwright fixtures for E2E tests
 *
 * Automatically provides Page Object instances for each test.
 *
 * Usage:
 * ```typescript
 * import { test, expect } from './fixtures';
 *
 * test('my test', async ({ authPage, generatePage }) => {
 *   await authPage.gotoRegister();
 *   // ...
 * });
 * ```
 */

interface PageFixtures {
  authPage: AuthPage;
  generatePage: GeneratePage;
  flashcardsPage: FlashcardsPage;
}

/**
 * Extended test with Page Object fixtures
 */
/* eslint-disable react-hooks/rules-of-hooks */
export const test = base.extend<PageFixtures>({
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  generatePage: async ({ page }, use) => {
    await use(new GeneratePage(page));
  },

  flashcardsPage: async ({ page }, use) => {
    await use(new FlashcardsPage(page));
  },
});
/* eslint-enable react-hooks/rules-of-hooks */

export { expect } from "@playwright/test";
