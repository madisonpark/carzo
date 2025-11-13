import { vi } from 'vitest';

/**
 * Mock Supabase client for testing
 *
 * Usage in tests:
 * ```typescript
 * import { createMockSupabaseClient } from '@/tests/mocks/supabase';
 *
 * const mockSupabase = createMockSupabaseClient({
 *   from: {
 *     vehicles: {
 *       select: jest.fn().mockResolvedValue({ data: [...], error: null }),
 *     },
 *   },
 * });
 * ```
 */

export interface MockSupabaseResponse<T = any> {
  data: T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
  count?: number | null;
  status?: number;
  statusText?: string;
}

export interface MockSupabaseQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  like: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  contains: ReturnType<typeof vi.fn>;
  containedBy: ReturnType<typeof vi.fn>;
  rangeGt: ReturnType<typeof vi.fn>;
  rangeGte: ReturnType<typeof vi.fn>;
  rangeLt: ReturnType<typeof vi.fn>;
  rangeLte: ReturnType<typeof vi.fn>;
  rangeAdjacent: ReturnType<typeof vi.fn>;
  overlaps: ReturnType<typeof vi.fn>;
  textSearch: ReturnType<typeof vi.fn>;
  match: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  csv: ReturnType<typeof vi.fn>;
}

/**
 * Create a chainable mock query builder
 */
export function createMockQueryBuilder(
  finalResponse: MockSupabaseResponse = { data: null, error: null }
): MockSupabaseQueryBuilder {
  const builder: any = {};

  // List of all Supabase query methods
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'is',
    'in',
    'contains',
    'containedBy',
    'rangeGt',
    'rangeGte',
    'rangeLt',
    'rangeLte',
    'rangeAdjacent',
    'overlaps',
    'textSearch',
    'match',
    'not',
    'or',
    'filter',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'csv',
  ];

  // Make all methods chainable and return the final response when awaited
  methods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue({
      ...builder,
      then: (resolve: any) => resolve(finalResponse),
    });
  });

  return builder;
}

/**
 * Create mock Supabase client
 */
export function createMockSupabaseClient(overrides: any = {}) {
  const defaultClient = {
    from: vi.fn((table: string) => {
      // Return chainable query builder
      return createMockQueryBuilder();
    }),
    rpc: vi.fn((functionName: string, params?: any) => {
      // Mock RPC calls (used for stored procedures)
      return Promise.resolve({ data: null, error: null });
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        download: vi.fn().mockResolvedValue({ data: null, error: null }),
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/image.jpg' },
        }),
      })),
    },
  };

  return {
    ...defaultClient,
    ...overrides,
  };
}

/**
 * Mock successful response
 */
export function mockSuccessResponse<T>(data: T): MockSupabaseResponse<T> {
  return {
    data,
    error: null,
    count: Array.isArray(data) ? data.length : null,
    status: 200,
    statusText: 'OK',
  };
}

/**
 * Mock error response
 */
export function mockErrorResponse(
  message: string,
  code?: string
): MockSupabaseResponse {
  return {
    data: null,
    error: {
      message,
      code,
    },
    status: 400,
    statusText: 'Bad Request',
  };
}

/**
 * Mock vehicle data for testing
 */
export function createMockVehicle(overrides: Partial<any> = {}) {
  return {
    id: '550e8400-e29b-41d4-a916-446655440000',
    vin: '1HGBH41JXMN109186',
    year: 2024,
    make: 'Toyota',
    model: 'Camry',
    trim: 'LE',
    body_style: 'Sedan',
    price: 28500,
    miles: 15000,
    condition: 'used',
    dealer_id: 'dealer-123',
    dealer_name: 'Test Toyota Dealership',
    dealer_city: 'Atlanta',
    dealer_state: 'GA',
    dealer_zip: '30303',
    dealer_vdp_url: 'https://dealer.com/vehicle/123',
    primary_image_url: 'https://images.lotlinx.com/vehicle-123.jpg',
    total_photos: 15,
    latitude: 33.749,
    longitude: -84.388,
    targeting_radius: 30,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock click data for testing
 */
export function createMockClick(overrides: Partial<any> = {}) {
  return {
    id: '660e8400-e29b-41d4-a916-446655440000',
    vehicle_id: '550e8400-e29b-41d4-a916-446655440000',
    dealer_id: 'dealer-123',
    user_id: 'user-456',
    session_id: 'session-789',
    is_billable: true,
    cta_clicked: 'primary',
    flow: 'full',
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock dealer click history for testing
 */
export function createMockDealerClickHistory(overrides: Partial<any> = {}) {
  return {
    id: '770e8400-e29b-41d4-a916-446655440000',
    user_id: 'user-456',
    dealer_id: 'dealer-123',
    first_click_at: new Date().toISOString(),
    last_click_at: new Date().toISOString(),
    click_count: 1,
    ...overrides,
  };
}
