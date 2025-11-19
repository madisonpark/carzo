import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn() utility function', () => {
  describe('Basic functionality', () => {
    it('should merge single class name', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('should merge multiple class names', () => {
      expect(cn('px-4', 'py-2', 'bg-blue-500')).toBe('px-4 py-2 bg-blue-500');
    });

    it('should handle empty strings', () => {
      expect(cn('')).toBe('');
      expect(cn('', 'text-red-500', '')).toBe('text-red-500');
    });

    it('should handle undefined values', () => {
      expect(cn(undefined)).toBe('');
      expect(cn('text-red-500', undefined, 'bg-blue-500')).toBe(
        'text-red-500 bg-blue-500'
      );
    });

    it('should handle null values', () => {
      expect(cn(null)).toBe('');
      expect(cn('text-red-500', null, 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });

    it('should handle arrays', () => {
      expect(cn(['text-red-500', 'bg-blue-500'])).toBe('text-red-500 bg-blue-500');
    });

    it('should handle objects with conditional classes', () => {
      expect(
        cn({
          'text-red-500': true,
          'bg-blue-500': false,
          'p-4': true,
        })
      ).toBe('text-red-500 p-4');
    });
  });

  describe('Tailwind class conflict resolution', () => {
    it('should resolve padding conflicts (later wins)', () => {
      expect(cn('p-4', 'p-6')).toBe('p-6');
    });

    it('should resolve text color conflicts', () => {
      expect(cn('text-red-500', 'text-blue-600')).toBe('text-blue-600');
    });

    it('should resolve background color conflicts', () => {
      expect(cn('bg-primary', 'bg-brand')).toBe('bg-brand');
    });

    it('should resolve margin conflicts', () => {
      expect(cn('m-2', 'm-4', 'm-6')).toBe('m-6');
    });

    it('should resolve width conflicts', () => {
      expect(cn('w-full', 'w-1/2')).toBe('w-1/2');
    });

    it('should preserve non-conflicting classes', () => {
      expect(cn('px-4', 'py-2', 'px-6')).toBe('py-2 px-6');
    });
  });

  describe('Conditional class application', () => {
    it('should apply classes based on boolean conditions', () => {
      const isActive = true;
      const isDisabled = false;

      expect(cn('base-class', isActive && 'active', isDisabled && 'disabled')).toBe(
        'base-class active'
      );
    });

    it('should handle ternary operators', () => {
      const variant = 'primary';
      expect(
        cn('btn', variant === 'primary' ? 'bg-primary' : 'bg-secondary')
      ).toBe('btn bg-primary');
    });

    it('should handle complex conditional logic', () => {
      const isActive = true;
      const hasError = false;
      const size = 'large';

      expect(
        cn(
          'button',
          isActive && 'active',
          hasError && 'error',
          size === 'large' && 'text-lg',
          !hasError && 'border-gray-300'
        )
      ).toBe('button active text-lg border-gray-300');
    });
  });

  describe('Real-world UI component scenarios', () => {
    it('should handle Button component classes', () => {
      const variant: string = 'primary';
      const size: string = 'md';
      const disabled = false;

      expect(
        cn(
          'inline-flex items-center justify-center rounded-lg font-semibold',
          variant === 'primary' && 'bg-primary text-white',
          variant === 'secondary' && 'bg-secondary text-foreground',
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-6 py-3 text-base',
          size === 'lg' && 'px-8 py-4 text-lg',
          disabled && 'opacity-50 cursor-not-allowed'
        )
      ).toBe(
        'inline-flex items-center justify-center rounded-lg font-semibold bg-primary text-white px-6 py-3 text-base'
      );
    });

    it('should handle Input component classes with error state', () => {
      const hasError = true;

      expect(
        cn(
          'w-full rounded-lg border px-4 py-3',
          hasError ? 'border-error focus:ring-error' : 'border-border focus:ring-brand'
        )
      ).toBe('w-full rounded-lg border px-4 py-3 border-error focus:ring-error');
    });

    it('should handle responsive classes', () => {
      expect(
        cn(
          'flex flex-col',
          'sm:flex-row',
          'md:gap-4',
          'lg:gap-6',
          'xl:gap-8'
        )
      ).toBe('flex flex-col sm:flex-row md:gap-4 lg:gap-6 xl:gap-8');
    });

    it('should handle hover and focus states', () => {
      expect(
        cn(
          'bg-primary',
          'hover:bg-primary-hover',
          'focus:outline-none',
          'focus:ring-2',
          'focus:ring-brand'
        )
      ).toBe(
        'bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-brand'
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle very long class lists', () => {
      const result = cn(
        'text-sm',
        'font-medium',
        'text-gray-700',
        'hover:text-gray-900',
        'px-3',
        'py-2',
        'rounded-md',
        'transition',
        'duration-200',
        'ease-in-out',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'focus:ring-brand'
      );

      expect(result).toContain('text-sm');
      expect(result).toContain('font-medium');
      expect(result).toContain('focus:ring-brand');
    });

    it('should handle duplicate classes (should appear once)', () => {
      expect(cn('p-4', 'p-4', 'p-4')).toBe('p-4');
    });

    it('should handle mixed types (strings, arrays, objects)', () => {
      expect(
        cn(
          'base',
          ['array-class-1', 'array-class-2'],
          { 'object-class': true, 'hidden-class': false },
          'final-class'
        )
      ).toBe('base array-class-1 array-class-2 object-class final-class');
    });

    it('should handle nested arrays', () => {
      expect(cn('base', [['nested', 'array'], 'sibling'])).toBe(
        'base nested array sibling'
      );
    });
  });

  describe('Integration with custom className prop', () => {
    it('should merge custom className with component defaults', () => {
      // Simulating a component that accepts className prop
      const defaultClasses = 'px-4 py-2 bg-blue-500 text-white';
      const customClassName = 'bg-red-500 font-bold';

      // Custom classes should override defaults
      expect(cn(defaultClasses, customClassName)).toBe(
        'px-4 py-2 text-white bg-red-500 font-bold'
      );
    });

    it('should handle optional className prop', () => {
      const defaultClasses = 'px-4 py-2 bg-blue-500';
      const customClassName = undefined;

      expect(cn(defaultClasses, customClassName)).toBe('px-4 py-2 bg-blue-500');
    });
  });
});
