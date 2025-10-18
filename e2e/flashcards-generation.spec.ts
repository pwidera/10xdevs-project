import { test, expect } from "@playwright/test";
import { AuthPage, GeneratePage, FlashcardsPage } from "./page-objects";
import { SAMPLE_TEXTS, TEST_CREDENTIALS, FLASHCARD_COUNTS, generateTestEmail } from "./test-data";

/**
 * E2E Test: Flashcard Generation and Approval Flow
 *
 * Scenario:
 * 1. Navigate to home page
 * 2. Register new user with @e2etest.com email
 * 3. Navigate to /app/generate
 * 4. Generate 5 flashcards from photosynthesis text
 * 5. Approve all generated flashcards
 * 6. Navigate to /app/flashcard
 * 7. Verify 5 flashcards are visible and all have AI type
 * 8. Delete user account
 *
 * Based on: .ai/e2e-test-scenario.md
 * Follows: .augment/rules/imported/playwright-testing.md
 */

test.describe("Flashcard Generation Flow", () => {
  let authPage: AuthPage;
  let generatePage: GeneratePage;
  let flashcardsPage: FlashcardsPage;
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    // Arrange: Initialize page objects
    authPage = new AuthPage(page);
    generatePage = new GeneratePage(page);
    flashcardsPage = new FlashcardsPage(page);

    // Generate unique test email
    testEmail = generateTestEmail("flashcard-test");
  });

  test("should register user, generate flashcards, approve them, and verify in list", async ({ page }) => {
    // ============================================================================
    // STEP 1: Navigate to home page
    // ============================================================================
    await test.step("Navigate to home page", async () => {
      await page.goto("/");
      await expect(page.locator("body")).toBeVisible();
    });

    // ============================================================================
    // STEP 2: Register new user with @e2etest.com email
    // ============================================================================
    await test.step("Register new user", async () => {
      await authPage.gotoRegister();

      // Verify registration form is visible
      await expect(authPage.registerEmailInput).toBeVisible();
      await expect(authPage.registerPasswordInput).toBeVisible();
      await expect(authPage.registerConfirmPasswordInput).toBeVisible();

      // Fill and submit registration form
      await authPage.register(testEmail, TEST_CREDENTIALS.password);

      // Wait for successful registration and redirect
      await authPage.waitForRegisterSuccess();

      // Verify we're redirected to /app/generate
      await expect(page).toHaveURL(/\/app\/generate/);
    });

    // ============================================================================
    // STEP 3: Navigate to /app/generate (already there after registration)
    // ============================================================================
    await test.step("Verify on generate page", async () => {
      // Verify generate page elements are visible
      await expect(generatePage.sourceTextarea).toBeVisible();
      await expect(generatePage.generateButton).toBeVisible();
    });

    // ============================================================================
    // STEP 4: Generate 5 flashcards from photosynthesis text
    // ============================================================================
    await test.step("Generate 5 flashcards", async () => {
      // Fill source text and set count to 5
      await generatePage.generateFlashcards(SAMPLE_TEXTS.photosynthesis, FLASHCARD_COUNTS.medium, "pl");

      // Wait for generation to complete
      await generatePage.waitForGenerationComplete();

      // Verify proposals section is visible
      await expect(generatePage.proposalsHeading).toBeVisible();

      // Verify we have exactly 5 proposals
      const proposalCards = generatePage.getProposalCards();
      await expect(proposalCards).toHaveCount(FLASHCARD_COUNTS.medium);

      // Verify all proposals are in pending state initially
      const pendingCount = await generatePage.getPendingCount();
      expect(pendingCount).toBe(FLASHCARD_COUNTS.medium);
    });

    // ============================================================================
    // STEP 5: Approve all generated flashcards
    // ============================================================================
    await test.step("Approve all flashcards", async () => {
      // Use bulk accept action
      await generatePage.acceptAllProposals();

      // Verify all proposals are now accepted
      const acceptedCount = await generatePage.getAcceptedCount();
      expect(acceptedCount).toBe(FLASHCARD_COUNTS.medium);

      // Verify pending count is 0
      const pendingCount = await generatePage.getPendingCount();
      expect(pendingCount).toBe(0);

      // Save accepted proposals
      await generatePage.saveAcceptedProposals();

      // Wait for save success (toast or redirect)
      await page.waitForLoadState("networkidle");
    });

    // ============================================================================
    // STEP 6: Navigate to /app/flashcard
    // ============================================================================
    await test.step("Navigate to flashcards list", async () => {
      await flashcardsPage.goto();

      // Wait for flashcards to load
      await flashcardsPage.waitForFlashcardsLoad();
    });

    // ============================================================================
    // STEP 7: Verify 5 flashcards are visible and all have AI type
    // ============================================================================
    await test.step("Verify flashcards in list", async () => {
      // Verify we have exactly 5 flashcards
      const flashcardsCount = await flashcardsPage.getFlashcardsCount();
      expect(flashcardsCount).toBe(FLASHCARD_COUNTS.medium);

      // Verify all flashcards have AI origin
      const allAreAI = await flashcardsPage.areAllFlashcardsAI();
      expect(allAreAI).toBe(true);

      // Additional verification: check each flashcard individually
      for (let i = 0; i < FLASHCARD_COUNTS.medium; i++) {
        const originText = await flashcardsPage.getOriginText(i);
        expect(originText).toContain("AI");

        // Verify flashcard has content
        const frontText = await flashcardsPage.getFrontText(i);
        const backText = await flashcardsPage.getBackText(i);
        expect(frontText.length).toBeGreaterThan(0);
        expect(backText.length).toBeGreaterThan(0);
      }
    });

    // ============================================================================
    // STEP 8: Delete user account
    // ============================================================================
    await test.step("Delete user account", async () => {
      // Click delete account link in top bar
      await authPage.clickDeleteAccountLink();

      // Verify we're on delete account page
      await expect(page).toHaveURL(/\/auth\/delete-account/);

      // Verify delete account form is visible
      await expect(authPage.deleteAccountConfirmInput).toBeVisible();
      await expect(authPage.deleteAccountSubmitButton).toBeVisible();

      // Delete account
      await authPage.deleteAccount("USUŃ");

      // Wait for successful deletion and redirect to home
      await authPage.waitForDeleteSuccess("/");

      // Verify we're on home page
      await expect(page).toHaveURL("/");

      // Verify user is logged out (delete account link should not be visible)
      await expect(authPage.deleteAccountLink).not.toBeVisible();
    });

    // ============================================================================
    // STEP 8 (Optional): Verify account is deleted - try to login
    // ============================================================================
    await test.step("Verify account is deleted", async () => {
      // Try to login with deleted account
      await authPage.gotoLogin();

      // Attempt login
      const loginFailed = await authPage.expectLoginFailure(testEmail, TEST_CREDENTIALS.password);

      // Verify login failed
      expect(loginFailed).toBe(true);

      // Verify error message contains "Invalid" or similar
      const errorText = await authPage.loginFormError.textContent();
      expect(errorText).toMatch(/Invalid|nie|błąd/i);
    });
  });

  test("should handle individual proposal acceptance", async ({ page }) => {
    // ============================================================================
    // Setup: Register and navigate to generate page
    // ============================================================================
    await test.step("Setup: Register user", async () => {
      await authPage.gotoRegister();
      await authPage.register(testEmail, TEST_CREDENTIALS.password);
      await authPage.waitForRegisterSuccess();
    });

    // ============================================================================
    // Generate flashcards
    // ============================================================================
    await test.step("Generate flashcards", async () => {
      await generatePage.generateFlashcards(SAMPLE_TEXTS.photosynthesis, FLASHCARD_COUNTS.small, "pl");
      await generatePage.waitForGenerationComplete();
    });

    // ============================================================================
    // Accept proposals individually
    // ============================================================================
    await test.step("Accept proposals individually", async () => {
      // Accept first proposal
      await generatePage.acceptProposal(0);

      // Verify accepted count increased
      let acceptedCount = await generatePage.getAcceptedCount();
      expect(acceptedCount).toBe(1);

      // Accept second proposal
      await generatePage.acceptProposal(1);
      acceptedCount = await generatePage.getAcceptedCount();
      expect(acceptedCount).toBe(2);

      // Reject third proposal
      await generatePage.rejectProposal(2);

      // Verify accepted count is still 2
      acceptedCount = await generatePage.getAcceptedCount();
      expect(acceptedCount).toBe(2);

      // Save accepted proposals
      await generatePage.saveAcceptedProposals();
      await page.waitForLoadState("networkidle");
    });

    // ============================================================================
    // Verify only accepted flashcards are saved
    // ============================================================================
    await test.step("Verify only 2 flashcards saved", async () => {
      await flashcardsPage.goto();
      await flashcardsPage.waitForFlashcardsLoad();

      const flashcardsCount = await flashcardsPage.getFlashcardsCount();
      expect(flashcardsCount).toBe(2);
    });

    // ============================================================================
    // Delete user account
    // ============================================================================
    await test.step("Delete user account", async () => {
      // Click delete account link in top bar
      await authPage.clickDeleteAccountLink();

      // Verify we're on delete account page
      await expect(page).toHaveURL(/\/auth\/delete-account/);

      // Verify delete account form is visible
      await expect(authPage.deleteAccountConfirmInput).toBeVisible();
      await expect(authPage.deleteAccountSubmitButton).toBeVisible();

      // Delete account
      await authPage.deleteAccount("USUŃ");

      // Wait for successful deletion and redirect to home
      await authPage.waitForDeleteSuccess("/");

      // Verify we're on home page
      await expect(page).toHaveURL("/");

      // Verify user is logged out (delete account link should not be visible)
      await expect(authPage.deleteAccountLink).not.toBeVisible();
    });

    // ============================================================================
    // Verify account is deleted - try to login
    // ============================================================================
    await test.step("Verify account is deleted", async () => {
      // Try to login with deleted account
      await authPage.gotoLogin();

      // Attempt login
      const loginFailed = await authPage.expectLoginFailure(testEmail, TEST_CREDENTIALS.password);

      // Verify login failed
      expect(loginFailed).toBe(true);

      // Verify error message contains "Invalid" or similar
      const errorText = await authPage.loginFormError.textContent();
      expect(errorText).toMatch(/Invalid|nie|błąd/i);
    });
  });
});
