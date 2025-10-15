/**
 * Unit tests for utility functions
 * 
 * Tests cover:
 * - cn() function for className merging
 * - Tailwind class conflict resolution
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn (className utility)', () => {
  describe('basic functionality', () => {
    it('merges multiple class names', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles single class name', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });

    it('handles empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('filters out falsy values', () => {
      const result = cn('class1', false, 'class2', null, undefined, 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn('base', isActive && 'active', isDisabled && 'disabled');
      expect(result).toBe('base active');
    });
  });

  describe('array inputs', () => {
    it('handles array of class names', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toBe('class1 class2');
    });

    it('handles mixed arrays and strings', () => {
      const result = cn('class1', ['class2', 'class3'], 'class4');
      expect(result).toBe('class1 class2 class3 class4');
    });

    it('filters falsy values in arrays', () => {
      const result = cn(['class1', false, 'class2', null]);
      expect(result).toBe('class1 class2');
    });
  });

  describe('object inputs', () => {
    it('handles object with boolean values', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
      });
      expect(result).toBe('class1 class3');
    });

    it('handles mixed objects and strings', () => {
      const result = cn('base', { 'active': true, 'disabled': false });
      expect(result).toBe('base active');
    });
  });

  describe('Tailwind class conflict resolution', () => {
    it('resolves conflicting padding classes (keeps last)', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('resolves conflicting margin classes', () => {
      const result = cn('m-2', 'm-4', 'm-6');
      expect(result).toBe('m-6');
    });

    it('resolves conflicting background colors', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('resolves conflicting text colors', () => {
      const result = cn('text-gray-900', 'text-white');
      expect(result).toBe('text-white');
    });

    it('resolves conflicting width classes', () => {
      const result = cn('w-full', 'w-1/2');
      expect(result).toBe('w-1/2');
    });

    it('resolves conflicting height classes', () => {
      const result = cn('h-screen', 'h-64');
      expect(result).toBe('h-64');
    });

    it('keeps non-conflicting classes', () => {
      const result = cn('p-4', 'text-white', 'bg-blue-500', 'm-2');
      expect(result).toContain('p-4');
      expect(result).toContain('text-white');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('m-2');
    });

    it('resolves conflicts in conditional classes', () => {
      const variant = 'primary';
      const result = cn(
        'bg-gray-500',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-green-500'
      );
      expect(result).toBe('bg-blue-500');
    });
  });

  describe('complex scenarios', () => {
    it('handles component variant pattern', () => {
      const getButtonClasses = (variant: 'primary' | 'secondary', size: 'sm' | 'lg') => {
        return cn(
          'rounded font-medium',
          {
            'bg-blue-500 text-white': variant === 'primary',
            'bg-gray-200 text-gray-900': variant === 'secondary',
          },
          {
            'px-3 py-1 text-sm': size === 'sm',
            'px-6 py-3 text-lg': size === 'lg',
          }
        );
      };

      const primarySmall = getButtonClasses('primary', 'sm');
      expect(primarySmall).toContain('bg-blue-500');
      expect(primarySmall).toContain('text-white');
      expect(primarySmall).toContain('px-3');
      expect(primarySmall).toContain('text-sm');

      const secondaryLarge = getButtonClasses('secondary', 'lg');
      expect(secondaryLarge).toContain('bg-gray-200');
      expect(secondaryLarge).toContain('px-6');
      expect(secondaryLarge).toContain('text-lg');
    });

    it('handles override pattern (base + override)', () => {
      const baseClasses = 'p-4 bg-white text-gray-900';
      const overrideClasses = 'bg-blue-500 text-white';
      const result = cn(baseClasses, overrideClasses);
      
      expect(result).toContain('p-4');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
      expect(result).not.toContain('bg-white');
      expect(result).not.toContain('text-gray-900');
    });

    it('handles deeply nested conditionals', () => {
      const isActive = true;
      const isDisabled = false;
      const variant = 'primary';
      
      const result = cn(
        'base-class',
        isActive && 'active',
        isDisabled && 'disabled',
        !isDisabled && variant === 'primary' && 'bg-blue-500',
        !isDisabled && variant === 'secondary' && 'bg-gray-500'
      );

      expect(result).toContain('base-class');
      expect(result).toContain('active');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('disabled');
    });
  });

  describe('edge cases', () => {
    it('handles empty strings', () => {
      const result = cn('', 'class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles whitespace-only strings', () => {
      const result = cn('class1', '   ', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('handles duplicate classes', () => {
      const result = cn('class1', 'class2', 'class1');
      // clsx doesn't deduplicate by default, it keeps all classes
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('handles very long class lists', () => {
      const classes = Array.from({ length: 50 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      expect(result).toContain('class-0');
      expect(result).toContain('class-49');
    });

    it('handles special characters in class names', () => {
      const result = cn('hover:bg-blue-500', 'focus:ring-2', 'sm:text-lg');
      expect(result).toContain('hover:bg-blue-500');
      expect(result).toContain('focus:ring-2');
      expect(result).toContain('sm:text-lg');
    });

    it('handles arbitrary values in Tailwind classes', () => {
      const result = cn('w-[200px]', 'h-[100px]', 'bg-[#1da1f2]');
      expect(result).toContain('w-[200px]');
      expect(result).toContain('h-[100px]');
      expect(result).toContain('bg-[#1da1f2]');
    });
  });
});

