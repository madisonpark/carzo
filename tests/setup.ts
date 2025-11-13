import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (used by Tailwind/responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (used by lazy loading, animations)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (used by some UI libraries)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock scrollTo (used by scroll behaviors)
window.scrollTo = vi.fn();

// Mock localStorage and sessionStorage with proper Web Storage API
const createMockStorage = (): Storage => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createMockStorage(),
});

Object.defineProperty(window, 'sessionStorage', {
  value: createMockStorage(),
});

// Mock fetch (can be overridden in individual tests)
global.fetch = vi.fn();

/**
 * Mock console methods to reduce test noise
 *
 * Trade-off: This can hide important warnings from libraries or React,
 * making debugging more difficult. However, for our use case:
 * - Reduces noise from expected console.error calls in error tests
 * - Can be selectively unmocked in specific tests if needed:
 *   beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
 *
 * If you need to see console output during debugging, comment out this section.
 */
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
};

// Set default timezone for consistent date testing
process.env.TZ = 'America/Los_Angeles'; // PST/PDT (matches Carzo's target market)
