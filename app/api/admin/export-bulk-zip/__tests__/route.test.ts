import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import * as rateLimitModule from '@/lib/rate-limit';
import * as adminAuthModule from '@/lib/admin-auth';
import * as supabaseJsModule from '@supabase/supabase-js';

// Mock dependencies
vi.mock('@/lib/admin-auth');
vi.mock('@/lib/rate-limit');
vi.mock('@supabase/supabase-js');

// Global mock variables
let mockQuery: { data: any; error: any; count?: number };
let mockSupabaseChain: any;

function createMockRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/export-bulk-zip', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 
        'Authorization': 'Bearer carzo2024admin',
        'Content-Type': 'application/json'
    },
  });
}

describe('POST /api/admin/export-bulk-zip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    mockQuery = { data: null, error: null };
    mockSupabaseChain = {
        select: vi.fn(),
        eq: vi.fn(),
        then: vi.fn(function (resolve) { return resolve(mockQuery); }),
    };
    // Chain the methods manually to return the object itself
    mockSupabaseChain.select.mockReturnValue(mockSupabaseChain);
    mockSupabaseChain.eq.mockReturnValue(mockSupabaseChain);

    vi.mocked(adminAuthModule).validateAdminAuth.mockResolvedValue({ authorized: true, response: undefined });
    vi.mocked(rateLimitModule).checkMultipleRateLimits.mockResolvedValue({ 
        allowed: true, 
        limit: 100, 
        remaining: 99, 
        reset: Date.now() + 60000 
    });

    vi.mocked(supabaseJsModule).createClient.mockReturnValue({
        from: vi.fn(() => mockSupabaseChain),
    } as any);
  });

  it('should return 400 if body is missing required fields', async () => {
    const request = createMockRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid request body');
  });

  it('should return 400 if items limit is exceeded', async () => {
    const items = Array(25).fill({ campaignType: 'make', campaignValue: 'Toyota' });
    const request = createMockRequest({ platform: 'facebook', items });
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Batch size limit exceeded');
  });

  it('should generate ZIP with CSVs for valid items', async () => {
    // Mock Supabase response with valid vehicle data
    mockQuery.data = [
        { id: '1', latitude: 27.9, longitude: -82.4, dealer_city: 'Tampa', dealer_state: 'FL', dealer_id: 'd1' }
    ];

    const request = createMockRequest({
        platform: 'facebook',
        items: [{ campaignType: 'make', campaignValue: 'Toyota', minVehicles: 1 }]
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('Content-Disposition')).toContain('.zip');
    
    // Verify results header indicates success
    const results = JSON.parse(response.headers.get('X-Export-Results') || '[]');
    expect(results[0]).toMatchObject({ name: 'Toyota', status: 'success' });
  });

  it('should handle partial failures and return 404 if ALL fail', async () => {
    // Mock empty inventory
    mockQuery.data = [];

    const request = createMockRequest({
        platform: 'facebook',
        items: [{ campaignType: 'make', campaignValue: 'UnknownCar' }]
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('No files were generated');
    expect(data.results[0].status).toBe('error');
    expect(data.results[0].error).toContain('No inventory');
  });

  it('should handle mixed success and failure', async () => {
    // We need to mock different responses for sequential calls.
    // Since the route creates a fresh client or query chain per iteration, 
    // we can mock the 'then' implementation to return different data based on call count.
    
    let callCount = 0;
    mockSupabaseChain.then = vi.fn(function (resolve) {
        callCount++;
        if (callCount === 1) {
            // First call: Success (Toyota)
            resolve({ data: [{ id: '1', latitude: 27.9, longitude: -82.4, dealer_city: 'Tampa', dealer_state: 'FL', dealer_id: 'd1' }], error: null });
        } else {
            // Second call: Failure (Unknown)
            resolve({ data: [], error: null });
        }
    });

    const request = createMockRequest({
        platform: 'facebook',
        items: [
            { campaignType: 'make', campaignValue: 'Toyota', minVehicles: 1 },
            { campaignType: 'make', campaignValue: 'Unknown' }
        ]
    });

    const response = await POST(request);
    
    expect(response.status).toBe(200);
    const results = JSON.parse(response.headers.get('X-Export-Results') || '[]');
    
    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('success');
    expect(results[1].status).toBe('error');
  });
});
