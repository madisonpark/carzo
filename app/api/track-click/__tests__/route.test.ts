import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { POST, OPTIONS } from '../route';
import { NextRequest } from 'next/server';

// Type definition for mocked Supabase client
type MockSupabaseClient = {
  from: ReturnType<typeof vi.fn> & (() => MockSupabaseClient);
  select: ReturnType<typeof vi.fn> & (() => MockSupabaseClient);
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn> & (() => MockSupabaseClient);
  eq: ReturnType<typeof vi.fn> & (() => MockSupabaseClient);
  gte: ReturnType<typeof vi.fn> & (() => MockSupabaseClient);
  single: ReturnType<typeof vi.fn>;
};

// Mock Supabase module - factory must be standalone (hoisted)
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn(),
    single: vi.fn(),
  },
}));

// Helper to create mock NextRequest
function createMockRequest(body: unknown): NextRequest {
  const request = {
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    json: vi.fn().mockResolvedValue(body),
    headers: new Headers(),
    url: 'http://localhost:3000/api/track-click',
    method: 'POST',
  } as unknown as NextRequest;

  return request;
}

describe('POST /api/track-click', () => {
  let mockSupabase: MockSupabaseClient;

  // Use fake timers for deterministic date testing
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get mocked Supabase instance
    const { supabaseAdmin } = await import('@/lib/supabase');
    mockSupabase = supabaseAdmin as unknown as MockSupabaseClient;
  });

  // Helper function to mock no click history (billable scenario)
  const mockNoClickHistory = () => {
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.gte.mockReturnThis();
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
  };

  // Helper function to mock successful click insert
  const mockSuccessfulClickInsert = () => {
    mockSupabase.insert.mockResolvedValue({ error: null });
  };

  describe('Request Validation', () => {
    it('should return 400 for empty request body', async () => {
      const request = createMockRequest('');
      request.text = vi.fn().mockResolvedValue('');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Empty request body');
    });

    it('should return 400 for invalid JSON', async () => {
      const request = createMockRequest({});
      request.text = vi.fn().mockResolvedValue('invalid-json{]');

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    // Parameterized test for missing required fields
    it.each([
      { field: 'vehicleId', body: { dealerId: 'dealer-123', userId: 'user-456' } },
      { field: 'dealerId', body: { vehicleId: 'vehicle-123', userId: 'user-456' } },
      { field: 'userId', body: { vehicleId: 'vehicle-123', dealerId: 'dealer-123' } },
    ])('should return 400 when missing $field', async ({ body }) => {
      const request = createMockRequest(body);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });
  });

  describe('Flow Parameter Normalization', () => {
    it('should normalize valid flow parameter', async () => {
      mockNoClickHistory();
      mockSuccessfulClickInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
        flow: 'vdp-only',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify click was inserted with normalized flow
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ flow: 'vdp-only' })
      );
    });

    it('should default invalid flow to "full"', async () => {
      mockNoClickHistory();
      mockSuccessfulClickInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
        flow: 'invalid-flow',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify click was inserted with default flow
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ flow: 'full' })
      );
    });

    it('should default missing flow to "full"', async () => {
      mockNoClickHistory();
      mockSuccessfulClickInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
        // flow missing
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify click was inserted with default flow
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ flow: 'full' })
      );
    });
  });

  describe('Billable Click Logic (Revenue-Critical)', () => {
    it('should mark first click to dealer as billable', async () => {
      mockNoClickHistory();
      mockSuccessfulClickInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.billable).toBe(true);
      expect(data.message).toContain('billable');

      // Verify click was inserted with is_billable: true
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ is_billable: true })
      );
    });

    it('should mark duplicate click to same dealer as non-billable', async () => {
      // Mock existing click history (within 30 days)
      const existingHistory = {
        id: 'history-123',
        user_id: 'user-456',
        dealer_id: 'dealer-123',
        first_click_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        last_click_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        click_count: 1,
      };

      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.gte.mockReturnThis();
      mockSupabase.single.mockResolvedValue({ data: existingHistory, error: null });

      // Mock successful click insert
      mockSupabase.insert.mockResolvedValue({ error: null });

      // Mock history update
      mockSupabase.update.mockReturnThis();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.billable).toBe(false);
      expect(data.message).toContain('not billable');
      expect(data.message).toContain('duplicate dealer');

      // Verify click was inserted with is_billable: false
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ is_billable: false })
      );
    });

    it('should mark click as billable if previous click was >30 days ago', async () => {
      // Mock existing history, but outside 30-day window
      // The query filters by gte(first_click_at, 30 days ago), so old history won't be returned
      mockNoClickHistory(); // No history in window
      mockSuccessfulClickInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.billable).toBe(true);
      expect(data.message).toContain('billable');
    });
  });

  describe('Dealer Click History Management', () => {
    it('should create new history record for first click', async () => {
      // Mock no existing history
      mockNoClickHistory();

      // Mock successful inserts
      let insertCallCount = 0;
      mockSupabase.insert.mockImplementation(() => {
        insertCallCount++;
        return Promise.resolve({ error: null });
      });

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
      });

      await POST(request);

      // Should have 2 inserts: 1 for click, 1 for history
      expect(mockSupabase.insert).toHaveBeenCalledTimes(2);

      // Second insert should be history with click_count: 1
      expect(mockSupabase.insert).toHaveBeenLastCalledWith(
        expect.objectContaining({
          user_id: 'user-456',
          dealer_id: 'dealer-123',
          click_count: 1,
        })
      );
    });

    it('should update existing history record for duplicate click', async () => {
      // Mock existing history
      const existingHistory = {
        id: 'history-123',
        user_id: 'user-456',
        dealer_id: 'dealer-123',
        first_click_at: new Date().toISOString(),
        last_click_at: new Date().toISOString(),
        click_count: 1,
      };

      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.gte.mockReturnThis();
      mockSupabase.single.mockResolvedValue({ data: existingHistory, error: null });

      // Mock click insert
      mockSupabase.insert.mockResolvedValue({ error: null });

      // Mock history update
      mockSupabase.update.mockReturnThis();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
      });

      await POST(request);

      // Verify history was updated
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          click_count: 2, // Incremented from 1 to 2
        })
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'history-123');
    });
  });

  describe('Optional Fields', () => {
    it('should handle missing sessionId (optional field)', async () => {
      mockNoClickHistory();
      mockSuccessfulClickInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
        // sessionId omitted
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify sessionId was set to null
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ session_id: null })
      );
    });

    it('should default ctaClicked to "primary" when missing', async () => {
      mockNoClickHistory();
      mockSuccessfulClickInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
        // ctaClicked omitted
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      // Verify ctaClicked defaulted to 'primary'
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ cta_clicked: 'primary' })
      );
    });

    it('should accept custom ctaClicked value', async () => {
      mockNoClickHistory();
      mockSuccessfulClickInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
        ctaClicked: 'history',
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({ cta_clicked: 'history' })
      );
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when vehicle does not exist (foreign key constraint)', async () => {
      mockNoClickHistory();

      // Mock foreign key constraint error
      mockSupabase.insert.mockResolvedValue({
        error: { code: '23503', message: 'Foreign key violation' },
      });

      const request = createMockRequest({
        vehicleId: 'nonexistent-vehicle',
        dealerId: 'dealer-123',
        userId: 'user-456',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Vehicle not found');
      expect(data.billable).toBe(false);
    });

    it('should return 500 for database errors (non-FK constraint)', async () => {
      mockNoClickHistory();

      // Mock generic database error
      mockSupabase.insert.mockResolvedValue({
        error: { code: '42P01', message: 'Table does not exist' },
      });

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to log click');
    });

    it('should return 400 for text parsing errors (caught by inner try-catch)', async () => {
      const request = createMockRequest({});

      // Force a text parsing error
      request.text = vi.fn().mockRejectedValue(new Error('Network error'));

      const response = await POST(request);
      const data = await response.json();

      // Inner try-catch treats text() errors as invalid JSON
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON in request body');
    });

    it('should return 500 for errors during database operations', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error');
      });

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-123',
        userId: 'user-456',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Response Format', () => {
    it('should return complete success response for billable click', async () => {
      mockNoClickHistory();
      mockSuccessfulClickInsert();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-456',
        userId: 'user-789',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        billable: true,
        message: 'Click tracked and billable',
        dealerId: 'dealer-456',
        userId: 'user-789',
      });
    });

    it('should return complete success response for non-billable click', async () => {
      // Mock existing history
      const existingHistory = {
        id: 'history-123',
        user_id: 'user-789',
        dealer_id: 'dealer-456',
        first_click_at: new Date().toISOString(),
        last_click_at: new Date().toISOString(),
        click_count: 1,
      };

      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.gte.mockReturnThis();
      mockSupabase.single.mockResolvedValue({ data: existingHistory, error: null });

      mockSupabase.insert.mockResolvedValue({ error: null });
      mockSupabase.update.mockReturnThis();

      const request = createMockRequest({
        vehicleId: 'vehicle-123',
        dealerId: 'dealer-456',
        userId: 'user-789',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual({
        success: true,
        billable: false,
        message: 'Click tracked but not billable (duplicate dealer within 30 days)',
        dealerId: 'dealer-456',
        userId: 'user-789',
      });
    });
  });
});

describe('OPTIONS /api/track-click', () => {
  it('should return 200 for CORS preflight', async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(200);
  });

  it('should return empty JSON for CORS preflight', async () => {
    const response = await OPTIONS();
    const data = await response.json();

    expect(data).toEqual({});
  });
});
