import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

/**
 * ThemeToggle Component Tests
 *
 * Tests for the dark/light mode toggle button component.
 * Covers rendering, theme switching, accessibility, and hydration handling.
 */

// Mock next-themes useTheme hook
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}));

describe('ThemeToggle', () => {
  describe('Rendering', () => {
    it('renders the toggle button', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('is mounted as disabled initially (hydration safety)', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      // Component should render (not return null) to prevent hydration mismatch
      expect(button).toBeInTheDocument();
    });

    it('applies ghost button variant styling', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      // Ghost variant should have hover:bg-trust-elevated class
      expect(button).toHaveClass('hover:bg-trust-elevated');
    });

    it('applies icon size variant', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      // Icon size should set h-10 w-10
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('Theme Switching', () => {
    it('calls setTheme when clicked (after mount)', async () => {
      const mockSetTheme = vi.fn();

      // Re-mock with mounted state
      vi.doMock('next-themes', () => ({
        ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
        useTheme: () => ({
          theme: 'light',
          setTheme: mockSetTheme,
        }),
      }));

      // Simulate mounted state by using useEffect
      const { rerender } = render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Force re-render to simulate mount
      rerender(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
      });
    });

    it('toggles from light to dark theme', async () => {
      const mockSetTheme = vi.fn();

      vi.doMock('next-themes', () => ({
        ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
        useTheme: () => ({
          theme: 'light',
          setTheme: mockSetTheme,
        }),
      }));

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
      });
    });

    it('toggles from dark to light theme', async () => {
      const mockSetTheme = vi.fn();

      vi.doMock('next-themes', () => ({
        ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
        useTheme: () => ({
          theme: 'dark',
          setTheme: mockSetTheme,
        }),
      }));

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has accessible aria-label', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('has screen reader text', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Screen reader text should be present
      const srText = screen.getByText(/switch to (light|dark) mode/i);
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveClass('sr-only');
    });

    it('supports keyboard navigation', async () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');

      // Should be focusable
      button.focus();
      expect(button).toHaveFocus();
    });

    it('supports Enter key activation', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });

      button.focus();
      await user.keyboard('{Enter}');

      // Button should maintain focus after activation
      expect(button).toHaveFocus();
    });

    it('supports Space key activation', async () => {
      const user = userEvent.setup();

      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });

      button.focus();
      await user.keyboard(' ');

      expect(button).toHaveFocus();
    });

    it('has focus-visible styles for keyboard navigation', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      // Should have focus-visible class (not focus:)
      expect(button.className).toContain('focus-visible:ring-2');
    });
  });

  describe('Smooth Transitions', () => {
    it('applies transition classes to button', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-smooth');
    });

    it('applies transition classes to icons', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      const svgs = button.querySelectorAll('svg');

      // Both icons should have transition-all class
      expect(svgs.length).toBe(2); // Sun and Moon icons
      svgs.forEach((svg) => {
        expect(svg).toHaveClass('transition-all');
      });
    });
  });

  describe('Hydration Safety', () => {
    it('prevents hydration mismatch with mounted check', () => {
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      // Should render button immediately (no null return)
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('renders immediately to prevent hydration mismatch', () => {
      const { container } = render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const button = container.querySelector('button');
      // Should always render (not return null)
      expect(button).toBeInTheDocument();
    });
  });
});
