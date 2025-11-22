import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as adminAuth from '@/lib/admin-auth';
import { getCachedCombinations } from '@/lib/admin-data';

// Mock admin auth
vi.mock('@/lib/admin-auth');

// Mock admin-data
vi.mock('@/lib/admin-data', () => ({
  getCachedCombinations: vi.fn(),
}));

describe('GET /api/admin/combinations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: auth succeeds
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({
      authorized: true,
    });

    // Default: combinations succeeds
    vi.mocked(getCachedCombinations).mockResolvedValue({
      make_bodystyle: [
        { combo_name: 'Kia suv', vehicle_count: 9400 },
        { combo_name: 'Jeep suv', vehicle_count: 5471 },
      ],
      make_model: [
        { combo_name: 'Ram 1500', vehicle_count: 2432 },
        { combo_name: 'Kia Sorento', vehicle_count: 2426 },
      ],
    });
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

    expect(data.make_bodystyle).toHaveLength(2);
    expect(data.make_model).toHaveLength(2);
    expect(data.make_bodystyle[0].combo_name).toBe('Kia suv');
    expect(data.make_model[0].combo_name).toBe('Ram 1500');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(getCachedCombinations).mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost/api/admin/combinations');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch combinations');
    expect(data.details).toBe('DB error');
  });
});