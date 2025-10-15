/**
 * Unit tests for server-side auth validation schemas
 * 
 * Tests cover:
 * - Login schema with optional 'next' parameter
 * - Register schema with password confirmation
 * - Forgot password schema
 * - Change password schema
 * - Delete account schema with confirmation text
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../auth.server.schemas';

describe('loginSchema (server)', () => {
  it('accepts valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('accepts login with optional next parameter', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      next: '/dashboard',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.next).toBe('/dashboard');
    }
  });

  it('trims email whitespace', () => {
    const result = loginSchema.safeParse({
      email: '  user@example.com  ',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid email');
    }
  });

  it('rejects password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 8 characters');
    }
  });
});

describe('registerSchema (server)', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('trims email whitespace', () => {
    const result = registerSchema.safeParse({
      email: '  user@example.com  ',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects when passwords do not match', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'different123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (issue) => issue.path[0] === 'confirmPassword'
      );
      expect(confirmError).toBeDefined();
      expect(confirmError?.message).toContain('Passwords must match');
    }
  });

  it('validates email format', () => {
    const result = registerSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(false);
  });

  it('validates password length', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
      confirmPassword: 'short',
    });

    expect(result.success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'user@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('trims email whitespace', () => {
    const result = forgotPasswordSchema.safeParse({
      email: '  user@example.com  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects invalid email format', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid email');
    }
  });

  it('rejects empty email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: '',
    });

    expect(result.success).toBe(false);
  });

  it('requires email field', () => {
    const result = forgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid new password', () => {
    const result = changePasswordSchema.safeParse({
      newPassword: 'newpassword123',
    });

    expect(result.success).toBe(true);
  });

  it('accepts exactly 8 characters (lower boundary)', () => {
    const result = changePasswordSchema.safeParse({
      newPassword: '12345678',
    });

    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      newPassword: 'short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 8 characters');
    }
  });

  it('accepts long passwords', () => {
    const result = changePasswordSchema.safeParse({
      newPassword: 'a'.repeat(100),
    });

    expect(result.success).toBe(true);
  });

  it('requires newPassword field', () => {
    const result = changePasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('deleteAccountSchema', () => {
  it('accepts "USUŃ" confirmation text', () => {
    const result = deleteAccountSchema.safeParse({
      confirm: 'USUŃ',
    });

    expect(result.success).toBe(true);
  });

  it('accepts "USUN" confirmation text (without Polish character)', () => {
    const result = deleteAccountSchema.safeParse({
      confirm: 'USUN',
    });

    expect(result.success).toBe(true);
  });

  it('accepts lowercase "usuń"', () => {
    const result = deleteAccountSchema.safeParse({
      confirm: 'usuń',
    });

    expect(result.success).toBe(true);
  });

  it('accepts lowercase "usun"', () => {
    const result = deleteAccountSchema.safeParse({
      confirm: 'usun',
    });

    expect(result.success).toBe(true);
  });

  it('accepts mixed case "UsUń"', () => {
    const result = deleteAccountSchema.safeParse({
      confirm: 'UsUń',
    });

    expect(result.success).toBe(true);
  });

  it('trims whitespace before validation', () => {
    const result = deleteAccountSchema.safeParse({
      confirm: '  USUŃ  ',
    });

    expect(result.success).toBe(true);
  });

  it('rejects incorrect confirmation text', () => {
    const invalidTexts = [
      'DELETE',
      'REMOVE',
      'YES',
      'CONFIRM',
      'USU',
      'USUNĄĆ',
      '',
    ];

    invalidTexts.forEach((text) => {
      const result = deleteAccountSchema.safeParse({
        confirm: text,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Wpisz USUŃ, aby potwierdzić');
      }
    });
  });

  it('rejects empty string', () => {
    const result = deleteAccountSchema.safeParse({
      confirm: '',
    });

    expect(result.success).toBe(false);
  });

  it('requires confirm field', () => {
    const result = deleteAccountSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

