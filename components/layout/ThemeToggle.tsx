'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';

/**
 * Theme Toggle Component
 *
 * Provides a clean, animated toggle button to switch between light and dark modes.
 * Uses Sun/Moon icons from lucide-react with smooth transitions.
 *
 * Features:
 * - Apple-esque design (ghost button, smooth animations)
 * - Accessible (keyboard navigation, ARIA labels)
 * - Prevents hydration mismatch with mounted check
 * - Smooth icon transitions
 *
 * Usage:
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch - wait for client-side mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return placeholder button to avoid layout shift
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="transition-smooth"
    >
      {isDark ? (
        <Moon className="h-4 w-4 transition-all duration-300 rotate-0 scale-100" />
      ) : (
        <Sun className="h-4 w-4 transition-all duration-300 rotate-0 scale-100" />
      )}
      <span className="sr-only">
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
    </Button>
  );
}
