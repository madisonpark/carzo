'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps as NextThemesProviderProps } from 'next-themes';

/**
 * Theme Provider Component
 *
 * Wraps the application with next-themes provider for dark mode support.
 *
 * Features:
 * - Persists theme preference to localStorage
 * - Defaults to system preference (prefers-color-scheme)
 * - Prevents flash of unstyled content (FOUC)
 * - Supports both 'light' and 'dark' themes
 *
 * Usage:
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
