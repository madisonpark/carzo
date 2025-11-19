import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { vi, expect } from 'vitest';

/**
 * Custom render function that wraps components with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // If we add providers later (e.g., Context, Redux), wrap them here
  return render(ui, { ...options });
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock Next.js useRouter hook
 */
export function createMockRouter(overrides: Partial<any> = {}) {
  return {
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
    basePath: '',
    push: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    beforePopState: vi.fn(),
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    ...overrides,
  };
}

/**
 * Mock Next.js useSearchParams hook
 */
export function createMockSearchParams(params: Record<string, string> = {}) {
  const searchParams = new URLSearchParams(params);

  return {
    get: (key: string) => searchParams.get(key),
    getAll: (key: string) => searchParams.getAll(key),
    has: (key: string) => searchParams.has(key),
    keys: () => searchParams.keys(),
    values: () => searchParams.values(),
    entries: () => searchParams.entries(),
    forEach: (callback: any) => searchParams.forEach(callback),
    toString: () => searchParams.toString(),
    [Symbol.iterator]: () => searchParams[Symbol.iterator](),
  };
}

/**
 * Mock Next.js headers
 */
export function createMockHeaders(headers: Record<string, string> = {}) {
  const headerMap = new Map(Object.entries(headers));

  return {
    get: (key: string) => headerMap.get(key.toLowerCase()) || null,
    has: (key: string) => headerMap.has(key.toLowerCase()),
    keys: () => headerMap.keys(),
    values: () => headerMap.values(),
    entries: () => headerMap.entries(),
    forEach: (callback: any) => headerMap.forEach(callback),
    [Symbol.iterator]: () => headerMap[Symbol.iterator](),
  };
}

/**
 * Mock fetch response
 */
export function createMockFetchResponse<T>(
  data: T,
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  } = {}
): Response {
  return {
    ok: (options.status || 200) >= 200 && (options.status || 200) < 300,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    headers: new Headers(options.headers || {}),
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    clone: function () {
      return this;
    },
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic',
    url: '',
  } as Response;
}

/**
 * Set mock cookie in document
 */
export function setMockCookie(name: string, value: string, days: number = 365) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

/**
 * Clear all mock cookies
 */
export function clearMockCookies() {
  document.cookie.split(';').forEach((c) => {
    document.cookie = c
      .replace(/^ +/, '')
      .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
  });
}

/**
 * Mock window.location
 */
export function mockWindowLocation(overrides: Partial<Location> = {}) {
  const location = {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    ...overrides,
  } as Location;

  delete (window as any).location;
  window.location = location as any;
}

/**
 * Create mock date (freeze time for testing)
 */
export function mockDate(isoString: string) {
  const mockDate = new Date(isoString);
  vi.setSystemTime(mockDate);
  return mockDate;
}

/**
 * Restore real date
 */
export function restoreDate() {
  vi.useRealTimers();
}

/**
 * Assert that an error was thrown with a specific message
 */
export function expectToThrow(fn: () => void, message?: string | RegExp) {
  try {
    fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error: any) {
    if (message) {
      if (typeof message === 'string') {
        expect(error.message).toBe(message);
      } else {
        expect(error.message).toMatch(message);
      }
    }
  }
}

/**
 * Assert that an async function rejects with a specific message
 */
export async function expectToReject(
  promise: Promise<any>,
  message?: string | RegExp
) {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error: any) {
    if (message) {
      if (typeof message === 'string') {
        expect(error.message).toBe(message);
      } else {
        expect(error.message).toMatch(message);
      }
    }
  }
}

/**
 * Create mock Supabase client for testing
 *
 * Simplifies test setup by providing a chainable mock that works with Supabase query builder pattern.
 *
 * @example
 * // Basic usage (mocks successful query)
 * const mockClient = createMockSupabaseClient({
 *   data: [{ id: '1', make: 'Toyota' }],
 *   error: null,
 * });
 *
 * @example
 * // Mock error scenario
 * const mockClient = createMockSupabaseClient({
 *   data: null,
 *   error: { message: 'Database error', code: 'PGRST' },
 * });
 *
 * @example
 * // Mock RPC function
 * const mockClient = createMockSupabaseClient({
 *   rpcData: [{ zip_code: '30303' }],
 * });
 *
 * @example
 * // Use with vi.mock
 * vi.mock('@supabase/supabase-js', () => ({
 *   createClient: vi.fn(() => createMockSupabaseClient({
 *     data: [{ id: '1' }],
 *   })),
 * }));
 */
export function createMockSupabaseClient(options: {
  data?: any;
  error?: any;
  rpcData?: any;
  rpcError?: any;
} = {}) {
  const {
    data = null,
    error = null,
    rpcData = [],
    rpcError = null
  } = options;

  // Chainable mock for query builder pattern
  const mockChain = {
    select: vi.fn(function () { return this; }),
    eq: vi.fn(function () { return this; }),
    neq: vi.fn(function () { return this; }),
    gt: vi.fn(function () { return this; }),
    gte: vi.fn(function () { return this; }),
    lt: vi.fn(function () { return this; }),
    lte: vi.fn(function () { return this; }),
    like: vi.fn(function () { return this; }),
    ilike: vi.fn(function () { return this; }),
    is: vi.fn(function () { return this; }),
    in: vi.fn(function () { return this; }),
    contains: vi.fn(function () { return this; }),
    containedBy: vi.fn(function () { return this; }),
    range: vi.fn(function () { return this; }),
    rangeGt: vi.fn(function () { return this; }),
    rangeGte: vi.fn(function () { return this; }),
    rangeLt: vi.fn(function () { return this; }),
    rangeLte: vi.fn(function () { return this; }),
    rangeAdjacent: vi.fn(function () { return this; }),
    overlaps: vi.fn(function () { return this; }),
    textSearch: vi.fn(function () { return this; }),
    match: vi.fn(function () { return this; }),
    not: vi.fn(function () { return this; }),
    or: vi.fn(function () { return this; }),
    filter: vi.fn(function () { return this; }),
    order: vi.fn(function () { return this; }),
    limit: vi.fn(function () { return this; }),
    range: vi.fn(function () { return this; }),
    single: vi.fn(() => Promise.resolve({ data, error })),
    maybeSingle: vi.fn(() => Promise.resolve({ data, error })),
    insert: vi.fn(() => Promise.resolve({ data, error })),
    update: vi.fn(() => Promise.resolve({ data, error })),
    upsert: vi.fn(() => Promise.resolve({ data, error })),
    delete: vi.fn(() => Promise.resolve({ data, error })),
    then: vi.fn(function (resolve) {
      return resolve({ data, error });
    }),
  };

  return {
    from: vi.fn(() => mockChain),
    rpc: vi.fn(() => Promise.resolve({ data: rpcData, error: rpcError })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: null },
        error: null
      })),
      getUser: vi.fn(() => Promise.resolve({
        data: { user: null },
        error: null
      })),
      signIn: vi.fn(() => Promise.resolve({
        data: { user: null, session: null },
        error: null
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        download: vi.fn(() => Promise.resolve({ data: null, error: null })),
        list: vi.fn(() => Promise.resolve({ data: [], error: null })),
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    },
  };
}

// Re-export commonly used testing library utilities
export * from '@testing-library/react';
export { vi } from 'vitest';
