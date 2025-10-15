/**
 * Unit tests for client-side auth validation schemas
 * 
 * Tests cover:
 * - Email validation rules
 * - Password validation rules
 * - Login schema validation
 * - Register schema validation with password confirmation
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  registerSchema,
} from '../auth.schemas';

describe('emailSchema', () => {
  it('accepts valid email addresses', () => {
    const validEmails = [
      'user@example.com',
      'test.user@domain.co.uk',
      'name+tag@company.org',
    ];

    validEmails.forEach((email) => {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(true);
    });
  });

  it('trims whitespace from email', () => {
    const result = emailSchema.safeParse('  user@example.com  ');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('user@example.com');
    }
  });

  it('rejects invalid email formats', () => {
    const invalidEmails = [
      'notanemail',
      '@example.com',
      'user@',
      'user @example.com',
      'user@example',
      '',
    ];

    invalidEmails.forEach((email) => {
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Podaj poprawny adres e‑mail');
      }
    });
  });

  it('rejects empty string after trimming', () => {
    const result = emailSchema.safeParse('   ');
    expect(result.success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts passwords with 8 or more characters', () => {
    const validPasswords = [
      'password',
      '12345678',
      'a'.repeat(8),
      'a'.repeat(100),
      'P@ssw0rd!',
    ];

    validPasswords.forEach((password) => {
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(true);
    });
  });

  it('accepts exactly 8 characters (lower boundary)', () => {
    const result = passwordSchema.safeParse('12345678');
    expect(result.success).toBe(true);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('1234567');
    
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('co najmniej 8 znaków');
    }
  });

  it('rejects empty password', () => {
    const result = passwordSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('does not trim whitespace (preserves spaces)', () => {
    const result = passwordSchema.safeParse('  pass  ');
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('  pass  ');
    }
  });
});

describe('loginSchema', () => {
  it('accepts valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('validates email field', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((issue) => issue.path[0] === 'email');
      expect(emailError).toBeDefined();
    }
  });

  it('validates password field', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find((issue) => issue.path[0] === 'password');
      expect(passwordError).toBeDefined();
    }
  });

  it('requires both email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
    });

    expect(result.success).toBe(false);
  });

  it('trims email but not password', () => {
    const result = loginSchema.safeParse({
      email: '  user@example.com  ',
      password: '  password123  ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.password).toBe('  password123  ');
    }
  });
});

describe('registerSchema', () => {
  it('accepts valid registration data with matching passwords', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(true);
  });

  it('validates email field', () => {
    const result = registerSchema.safeParse({
      email: 'invalid',
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
      expect(confirmError?.message).toContain('Hasła muszą być takie same');
    }
  });

  it('requires all three fields', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });

  it('accepts matching passwords with special characters', () => {
    const password = 'P@ssw0rd!#$%';
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password,
      confirmPassword: password,
    });

    expect(result.success).toBe(true);
  });

  it('is case-sensitive for password matching', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'password123',
    });

    expect(result.success).toBe(false);
  });

  it('preserves whitespace in password comparison', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password 123',
      confirmPassword: 'password  123', // Extra space
    });

    expect(result.success).toBe(false);
  });
});

