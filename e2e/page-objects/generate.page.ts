import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for AI flashcard generation page (/app/generate)
 * Handles source text input, generation, and proposal management
 */
export class GeneratePage {
  readonly page: Page;
  
  // Source form elements
  readonly sourceTextarea: Locator;
  readonly languageSelect: Locator;
  readonly maxProposalsInput: Locator;
  readonly generateButton: Locator;
  readonly charCounter: Locator;
  
  // Proposals section
  readonly proposalsHeading: Locator;
  readonly bulkAcceptButton: Locator;
  readonly bulkRejectButton: Locator;
  readonly saveSelectedButton: Locator;
  readonly acceptedCountBadge: Locator;
  readonly pendingCountBadge: Locator;
  
  // Loading states
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Source form selectors (based on SourceForm.tsx and child components)
    this.sourceTextarea = page.locator('textarea[name="sourceText"]');
    this.languageSelect = page.locator('select[name="language"]');
    this.maxProposalsInput = page.locator('input[name="maxProposals"]');
    this.generateButton = page.locator('button:has-text("Generuj")');
    this.charCounter = page.locator('text=/\\d+ \\/ 10000/');
    
    // Proposals section selectors (based on ProposalsSection.tsx and BulkActionBar.tsx)
    this.proposalsHeading = page.locator('h2:has-text("Propozycje fiszek")');
    this.bulkAcceptButton = page.locator('button:has-text("Zatwierdź pozostałe")');
    this.bulkRejectButton = page.locator('button:has-text("Odrzuć pozostałe")');
    this.saveSelectedButton = page.locator('button:has-text("Zapisz wybrane")');
    this.acceptedCountBadge = page.locator('text=/Zaakceptowane: \\d+/');
    this.pendingCountBadge = page.locator('text=/Oczekujące: \\d+/');
    
    // Loading indicator
    this.loadingIndicator = page.locator('text=/Generowanie|Zapisywanie/');
  }

  /**
   * Navigate to generate page
   */
  async goto() {
    await this.page.goto('/app/generate');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill source text and generate flashcards
   * @param sourceText - Text to generate flashcards from
   * @param maxProposals - Number of flashcards to generate (default: 5)
   * @param language - Language for generation (default: 'pl')
   */
  async generateFlashcards(
    sourceText: string,
    maxProposals = 5,
    language: 'pl' | 'en' = 'pl'
  ) {
    // Fill source text
    await this.sourceTextarea.fill(sourceText);
    
    // Set language if select is visible
    if (await this.languageSelect.isVisible()) {
      await this.languageSelect.selectOption(language);
    }
    
    // Set max proposals
    await this.maxProposalsInput.fill(maxProposals.toString());
    
    // Click generate button
    await this.generateButton.click();
  }

  /**
   * Wait for generation to complete
   * Waits for proposals heading to appear
   */
  async waitForGenerationComplete() {
    await this.proposalsHeading.waitFor({ state: 'visible', timeout: 30000 });
    // Wait for loading indicator to disappear
    await this.loadingIndicator.waitFor({ state: 'detached', timeout: 30000 });
  }

  /**
   * Get all proposal cards
   * @returns Array of proposal card locators
   */
  getProposalCards() {
    // Based on ProposalList.tsx structure - cards are in a grid
    return this.page.locator('[class*="grid"] > div[class*="rounded"]');
  }

  /**
   * Get proposal card by index
   * @param index - Zero-based index of proposal
   */
  getProposalCard(index: number) {
    return this.getProposalCards().nth(index);
  }

  /**
   * Accept a specific proposal by index
   * @param index - Zero-based index of proposal
   */
  async acceptProposal(index: number) {
    const card = this.getProposalCard(index);
    const acceptButton = card.locator('button:has-text("Zatwierdź")');
    await acceptButton.click();
  }

  /**
   * Reject a specific proposal by index
   * @param index - Zero-based index of proposal
   */
  async rejectProposal(index: number) {
    const card = this.getProposalCard(index);
    const rejectButton = card.locator('button:has-text("Odrzuć")');
    await rejectButton.click();
  }

  /**
   * Accept all pending proposals using bulk action
   */
  async acceptAllProposals() {
    await this.bulkAcceptButton.click();
  }

  /**
   * Reject all pending proposals using bulk action
   */
  async rejectAllProposals() {
    await this.bulkRejectButton.click();
  }

  /**
   * Save all accepted proposals
   * Waits for save operation to complete
   */
  async saveAcceptedProposals() {
    await this.saveSelectedButton.click();
    // Wait for save to complete (button should be disabled during save)
    await this.saveSelectedButton.waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get count of accepted proposals from UI
   * @returns Number of accepted proposals
   */
  async getAcceptedCount(): Promise<number> {
    const text = await this.acceptedCountBadge.textContent();
    const match = text?.match(/Zaakceptowane: (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get count of pending proposals from UI
   * @returns Number of pending proposals
   */
  async getPendingCount(): Promise<number> {
    const text = await this.pendingCountBadge.textContent();
    const match = text?.match(/Oczekujące: (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Wait for save success toast
   */
  async waitForSaveSuccess() {
    // Based on GeneratePage.tsx - uses sonner toast
    await this.page.locator('[data-sonner-toast]:has-text("Zapisano")').waitFor({ 
      state: 'visible', 
      timeout: 10000 
    });
  }
}

