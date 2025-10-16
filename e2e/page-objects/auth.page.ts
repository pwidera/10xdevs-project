import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for authentication pages
 * Handles registration and login flows
 */
export class AuthPage {
  readonly page: Page;
  
  // Register form elements
  readonly registerEmailInput: Locator;
  readonly registerPasswordInput: Locator;
  readonly registerConfirmPasswordInput: Locator;
  readonly registerSubmitButton: Locator;
  readonly registerFormError: Locator;
  
  // Login form elements
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly loginFormError: Locator;

  // Delete account elements
  readonly deleteAccountLink: Locator;
  readonly deleteAccountConfirmInput: Locator;
  readonly deleteAccountSubmitButton: Locator;
  readonly deleteAccountError: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Register form selectors (based on RegisterForm.tsx structure)
    this.registerEmailInput = page.locator('input[name="email"][type="email"]');
    this.registerPasswordInput = page.locator('input[name="password"][type="password"]');
    this.registerConfirmPasswordInput = page.locator('input[name="confirmPassword"][type="password"]');
    this.registerSubmitButton = page.locator('button[type="submit"]');
    this.registerFormError = page.locator('[role="alert"]');
    
    // Login form selectors (based on LoginForm.tsx structure)
    this.loginEmailInput = page.locator('input[name="email"][type="email"]');
    this.loginPasswordInput = page.locator('input[name="password"][type="password"]');
    this.loginSubmitButton = page.locator('button[type="submit"]');
    this.loginFormError = page.locator('[role="alert"]');

    // Delete account selectors (based on Layout.astro and DeleteAccountConfirm.tsx)
    this.deleteAccountLink = page.locator('a[href="/auth/delete-account"]');
    this.deleteAccountConfirmInput = page.locator('input[name="confirm"]');
    this.deleteAccountSubmitButton = page.locator('button[type="submit"][variant="destructive"], button.destructive[type="submit"]');
    this.deleteAccountError = page.locator('[role="alert"]');
  }

  /**
   * Navigate to registration page
   */
  async gotoRegister() {
    await this.page.goto('/auth/register');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to login page
   */
  async gotoLogin() {
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Register a new user
   * @param email - User email
   * @param password - User password
   * @param confirmPassword - Password confirmation (defaults to password)
   */
  async register(email: string, password: string, confirmPassword?: string) {
    await this.registerEmailInput.fill(email);
    await this.registerPasswordInput.fill(password);
    await this.registerConfirmPasswordInput.fill(confirmPassword || password);

    // Wait for React hydration by triggering form submit via JavaScript
    // This ensures the React event handlers are attached
    await this.page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    });
  }

  /**
   * Login with existing credentials
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);

    // Wait for React hydration by triggering form submit via JavaScript
    // This ensures the React event handlers are attached
    await this.page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    });
  }

  /**
   * Wait for successful registration redirect
   * Default redirect is to /app/generate
   */
  async waitForRegisterSuccess(expectedUrl = '/app/generate') {
    await this.page.waitForURL(`**${expectedUrl}`, { timeout: 10000 });
  }

  /**
   * Wait for successful login redirect
   * Default redirect is to /app/generate
   */
  async waitForLoginSuccess(expectedUrl = '/app/generate') {
    await this.page.waitForURL(`**${expectedUrl}`, { timeout: 10000 });
  }

  /**
   * Navigate to delete account page
   */
  async gotoDeleteAccount() {
    await this.page.goto('/auth/delete-account');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click delete account link in top bar
   */
  async clickDeleteAccountLink() {
    await this.deleteAccountLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Delete account by typing confirmation and submitting
   * @param confirmation - Confirmation text (default: 'USUŃ')
   */
  async deleteAccount(confirmation = 'USUŃ') {
    await this.deleteAccountConfirmInput.fill(confirmation);
    await this.deleteAccountSubmitButton.click();
  }

  /**
   * Wait for successful account deletion redirect
   * Default redirect is to home page
   */
  async waitForDeleteSuccess(expectedUrl = '/') {
    await this.page.waitForURL(`**${expectedUrl}`, { timeout: 10000 });
  }

  /**
   * Attempt to login and expect failure
   * @param email - User email
   * @param password - User password
   * @returns True if login failed (error message visible)
   */
  async expectLoginFailure(email: string, password: string): Promise<boolean> {
    await this.login(email, password);
    // Wait for error message to appear
    await this.loginFormError.waitFor({ state: 'visible', timeout: 5000 });
    return await this.loginFormError.isVisible();
  }

  /**
   * Generate unique test email with timestamp
   * @param prefix - Email prefix (default: 'test')
   * @returns Email in format: prefix+timestamp@e2etest.com
   */
  static generateTestEmail(prefix = 'test'): string {
    return `${prefix}+${Date.now()}@e2etest.com`;
  }
}

