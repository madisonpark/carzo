import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as adminAuth from '@/lib/admin-auth';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock admin auth
vi.mock('@/lib/admin-auth');

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn((funcName: string) => {
      if (funcName === 'get_metro_inventory') {
        return Promise.resolve({
          data: [
            { metro: 'Tampa, FL', vehicle_count: 1337, dealer_count: 19 },
            { metro: 'Dallas, TX', vehicle_count: 612, dealer_count: 15 },
          ],
          error: null,
        });
      }
      if (funcName === 'get_body_style_inventory') {
        return Promise.resolve({
          data: [
            { body_style: 'suv', vehicle_count: 41000 },
            { body_style: 'truck', vehicle_count: 12000 },
          ],
          error: null,
        });
      }
      if (funcName === 'get_make_inventory') {
        return Promise.resolve({
          data: [
            { make: 'Kia', vehicle_count: 13174 },
            { make: 'Toyota', vehicle_count: 8234 },
          ],
          error: null,
        });
      }
      if (funcName === 'get_unique_dealer_count') {
        return Promise.resolve({ data: 1952, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  })),
}));

describe('GET /api/admin/inventory-snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: auth succeeds
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({
      authorized: true,
    });
  });

  it('should return 401 if not authorized', async () => {
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });

    const request = new NextRequest('http://localhost/api/admin/inventory-snapshot');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return inventory snapshot with correct structure', async () => {
    const request = new NextRequest('http://localhost/api/admin/inventory-snapshot');
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data).toHaveProperty('total_vehicles');
    expect(data).toHaveProperty('total_dealers');
    expect(data).toHaveProperty('by_metro');
    expect(data).toHaveProperty('by_body_style');
    expect(data).toHaveProperty('by_make');
    expect(data).toHaveProperty('updated_at');
  });

  it('should calculate correct total vehicles', async () => {
    const request = new NextRequest('http://localhost/api/admin/inventory-snapshot');
    const response = await GET(request);

    const data = await response.json();

    // 1337 + 612 = 1949
    expect(data.total_vehicles).toBe(1949);
  });

  it('should return correct unique dealer count', async () => {
    const request = new NextRequest('http://localhost/api/admin/inventory-snapshot');
    const response = await GET(request);

    const data = await response.json();

    expect(data.total_dealers).toBe(1952);
  });

  it('should limit by_metro to top 10', async () => {
    const request = new NextRequest('http://localhost/api/admin/inventory-snapshot');
    const response = await GET(request);

    const data = await response.json();

    expect(Object.keys(data.by_metro).length).toBeLessThanOrEqual(10);
  });

  it('should include all body styles', async () => {
    const request = new NextRequest('http://localhost/api/admin/inventory-snapshot');
    const response = await GET(request);

    const data = await response.json();

    expect(data.by_body_style).toHaveProperty('suv');
    expect(data.by_body_style.suv).toBe(41000);
  });

  it('should limit by_make to top 15', async () => {
    const request = new NextRequest('http://localhost/api/admin/inventory-snapshot');
    const response = await GET(request);

    const data = await response.json();

    expect(Object.keys(data.by_make).length).toBeLessThanOrEqual(15);
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({ authorized: true });

    // Mock Supabase to return error
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue({
      rpc: vi.fn(() => Promise.resolve({ data: null, error: { message: 'DB error' } })),
    } as unknown as SupabaseClient<unknown, never, never>);

    const request = new NextRequest('http://localhost/api/admin/inventory-snapshot');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
