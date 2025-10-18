import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for flashcards list page (/app/flashcard)
 * Handles viewing, filtering, and managing flashcards
 */
export class FlashcardsPage {
  readonly page: Page;

  // Toolbar elements
  readonly searchInput: Locator;
  readonly originFilter: Locator;
  readonly sortSelect: Locator;

  // List elements
  readonly flashcardRows: Locator;
  readonly emptyState: Locator;
  readonly loadingSkeleton: Locator;

  // Pagination
  readonly paginationInfo: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Toolbar selectors (based on FlashcardsToolbar.tsx - to be implemented)
    this.searchInput = page.locator('input[type="search"], input[placeholder*="Szukaj"]');
    this.originFilter = page.locator('select[name="origin"]');
    this.sortSelect = page.locator('select[name="sort"]');

    // List selectors (based on FlashcardsList.tsx and FlashcardRow.tsx)
    this.flashcardRows = page.locator(".rounded-lg.border.bg-card.p-4");
    this.emptyState = page.locator("text=/Nie znaleziono|Brak fiszek/");
    this.loadingSkeleton = page.locator(".animate-pulse");

    // Pagination selectors
    this.paginationInfo = page.locator("text=/Strona \\d+ z \\d+/");
    this.nextPageButton = page.locator('button:has-text("Następna")');
    this.prevPageButton = page.locator('button:has-text("Poprzednia")');
  }

  /**
   * Navigate to flashcards list page
   */
  async goto() {
    await this.page.goto("/app/flashcards");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for flashcards to load
   * Waits for loading skeleton to disappear and content to appear
   */
  async waitForFlashcardsLoad() {
    await this.loadingSkeleton.waitFor({ state: "detached", timeout: 10000 }).catch(() => {
      // Skeleton might not appear if data loads quickly
    });
    await this.page.waitForLoadState("networkidle");

    // Wait for either flashcards or empty state to appear
    await Promise.race([
      this.flashcardRows
        .first()
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => {
          // Ignore timeout if flashcards don't appear
        }),
      this.emptyState.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
        // Ignore timeout if empty state doesn't appear
      }),
    ]);
  }

  /**
   * Get all flashcard row elements
   * @returns Array of flashcard row locators
   */
  getFlashcardRows() {
    return this.flashcardRows;
  }

  /**
   * Get flashcard row by index
   * @param index - Zero-based index of flashcard
   */
  getFlashcardRow(index: number) {
    return this.flashcardRows.nth(index);
  }

  /**
   * Get count of visible flashcards
   * @returns Number of flashcard rows
   */
  async getFlashcardsCount(): Promise<number> {
    return await this.flashcardRows.count();
  }

  /**
   * Get origin badge for a specific flashcard
   * @param index - Zero-based index of flashcard
   * @returns Locator for the origin badge
   */
  getOriginBadge(index: number) {
    // Based on Badge component - uses data-slot="badge"
    return this.getFlashcardRow(index).locator('[data-slot="badge"]').first();
  }

  /**
   * Get origin text for a specific flashcard
   * @param index - Zero-based index of flashcard
   * @returns Origin text (e.g., "AI", "Ręczne", "AI (edytowane)")
   */
  async getOriginText(index: number): Promise<string> {
    const badge = this.getOriginBadge(index);
    return (await badge.textContent()) || "";
  }

  /**
   * Check if all flashcards have AI origin
   * @returns True if all flashcards are AI-generated
   */
  async areAllFlashcardsAI(): Promise<boolean> {
    const count = await this.getFlashcardsCount();

    if (count === 0) {
      return false;
    }

    for (let i = 0; i < count; i++) {
      const originText = await this.getOriginText(i);
      // Check for "AI" or "AI (edytowane)" - both are AI origins
      if (!originText.includes("AI")) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get front text of a flashcard
   * @param index - Zero-based index of flashcard
   * @returns Front text content
   */
  async getFrontText(index: number): Promise<string> {
    const row = this.getFlashcardRow(index);
    // Based on FlashcardRow.tsx view mode structure
    const frontLabel = row.locator("text=/Przód:/");
    const frontText = frontLabel.locator("..").locator("p");
    return (await frontText.textContent()) || "";
  }

  /**
   * Get back text of a flashcard
   * @param index - Zero-based index of flashcard
   * @returns Back text content
   */
  async getBackText(index: number): Promise<string> {
    const row = this.getFlashcardRow(index);
    // Based on FlashcardRow.tsx view mode structure
    const backLabel = row.locator("text=/Tył:/");
    const backText = backLabel.locator("..").locator("p");
    return (await backText.textContent()) || "";
  }

  /**
   * Edit a flashcard
   * @param index - Zero-based index of flashcard
   * @param newFront - New front text
   * @param newBack - New back text
   */
  async editFlashcard(index: number, newFront: string, newBack: string) {
    const row = this.getFlashcardRow(index);

    // Click edit button
    const editButton = row.locator('button:has-text("Edytuj")');
    await editButton.click();

    // Wait for edit mode
    const frontTextarea = row.locator("textarea").first();
    const backTextarea = row.locator("textarea").last();

    // Fill new values
    await frontTextarea.fill(newFront);
    await backTextarea.fill(newBack);

    // Save
    const saveButton = row.locator('button:has-text("Zapisz")');
    await saveButton.click();

    // Wait for save to complete
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Delete a flashcard
   * @param index - Zero-based index of flashcard
   */
  async deleteFlashcard(index: number) {
    const row = this.getFlashcardRow(index);

    // Click delete button
    const deleteButton = row.locator('button:has-text("Usuń")');
    await deleteButton.click();

    // Confirm deletion in dialog (based on ConfirmDialog.tsx)
    const confirmButton = this.page.locator('button:has-text("Usuń")').last();
    await confirmButton.click();

    // Wait for deletion to complete
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Filter flashcards by origin
   * @param origin - Origin type ('manual', 'AI_full', 'AI_edited', or 'all')
   */
  async filterByOrigin(origin: string) {
    if (await this.originFilter.isVisible()) {
      await this.originFilter.selectOption(origin);
      await this.page.waitForLoadState("networkidle");
    }
  }

  /**
   * Search flashcards
   * @param query - Search query
   */
  async search(query: string) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query);
      // Wait for debounce and search to complete
      await this.page.waitForTimeout(500);
      await this.page.waitForLoadState("networkidle");
    }
  }
}
