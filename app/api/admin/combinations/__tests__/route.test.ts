import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as adminAuth from '@/lib/admin-auth';

vi.mock('@/lib/admin-auth');
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn((funcName: string) => {
      if (funcName === 'get_make_bodystyle_combos') {
        return Promise.resolve({
          data: [
            { combo_name: 'Kia suv', vehicle_count: 9400 },
            { combo_name: 'Jeep suv', vehicle_count: 5471 },
            { combo_name: 'Ram pickup', vehicle_count: 4347 },
          ],
          error: null,
        });
      }
      if (funcName === 'get_make_model_combos') {
        return Promise.resolve({
          data: [
            { combo_name: 'Ram 1500', vehicle_count: 2432 },
            { combo_name: 'Kia Sorento', vehicle_count: 2426 },
            { combo_name: 'Chevrolet Silverado 1500', vehicle_count: 2313 },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    }),
  })),
}));

describe('GET /api/admin/combinations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({ authorized: true });
  });

  it('should return 401 if not authorized', async () => {
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });

    const request = new NextRequest('http://localhost/api/admin/combinations');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return both combo types with correct structure', async () => {
    const request = new NextRequest('http://localhost/api/admin/combinations');
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data).toHaveProperty('make_bodystyle');
    expect(data).toHaveProperty('make_model');
  });

  it('should return make+bodystyle combinations', async () => {
    const request = new NextRequest('http://localhost/api/admin/combinations');
    const response = await GET(request);

    const data = await response.json();

    expect(data.make_bodystyle).toHaveLength(3);
    expect(data.make_bodystyle[0]).toHaveProperty('combo_name');
    expect(data.make_bodystyle[0]).toHaveProperty('vehicle_count');
    expect(data.make_bodystyle[0].combo_name).toBe('Kia suv');
  });

  it('should return make+model combinations', async () => {
    const request = new NextRequest('http://localhost/api/admin/combinations');
    const response = await GET(request);

    const data = await response.json();

    expect(data.make_model).toHaveLength(3);
    expect(data.make_model[0]).toHaveProperty('combo_name');
    expect(data.make_model[0]).toHaveProperty('vehicle_count');
    expect(data.make_model[0].combo_name).toBe('Ram 1500');
  });

  it('should handle database errors for make_bodystyle', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue({
      rpc: vi.fn((funcName: string) => {
        if (funcName === 'get_make_bodystyle_combos') {
          return Promise.resolve({ data: null, error: { message: 'DB error' } });
        }
        return Promise.resolve({ data: [], error: null });
      }),
    } as any);

    const request = new NextRequest('http://localhost/api/admin/combinations');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should handle database errors for make_model', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue({
      rpc: vi.fn((funcName: string) => {
        if (funcName === 'get_make_model_combos') {
          return Promise.resolve({ data: null, error: { message: 'DB error' } });
        }
        return Promise.resolve({ data: [], error: null });
      }),
    } as any);

    const request = new NextRequest('http://localhost/api/admin/combinations');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should return empty arrays if no data', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue({
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    } as any);

    const request = new NextRequest('http://localhost/api/admin/combinations');
    const response = await GET(request);

    const data = await response.json();

    expect(data.make_bodystyle).toEqual([]);
    expect(data.make_model).toEqual([]);
  });
});
