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
    await this.registerSubmitButton.click();
  }

  /**
   * Login with existing credentials
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginSubmitButton.click();
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
   * Generate unique test email with timestamp
   * @param prefix - Email prefix (default: 'test')
   * @returns Email in format: prefix+timestamp@e2etest.com
   */
  static generateTestEmail(prefix = 'test'): string {
    return `${prefix}+${Date.now()}@e2etest.com`;
  }
}

