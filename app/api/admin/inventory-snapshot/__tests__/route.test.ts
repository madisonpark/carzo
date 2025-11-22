import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as adminAuth from '@/lib/admin-auth';
import { getCachedInventorySnapshot } from '@/lib/admin-data';

// Mock admin auth
vi.mock('@/lib/admin-auth');

// Mock admin-data
vi.mock('@/lib/admin-data', () => ({
  getCachedInventorySnapshot: vi.fn(),
}));

describe('GET /api/admin/inventory-snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: auth succeeds
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({
      authorized: true,
    });

    // Default: snapshot succeeds
    vi.mocked(getCachedInventorySnapshot).mockResolvedValue({
      total_vehicles: 1949,
      total_dealers: 1952,
      by_metro: { 'Tampa, FL': 1337, 'Dallas, TX': 612 },
      by_body_style: { 'suv': 41000, 'truck': 12000 },
      by_make: { 'Kia': 13174, 'Toyota': 8234 },
      updated_at: new Date().toISOString(),
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

    expect(data).toHaveProperty('total_vehicles', 1949);
    expect(data).toHaveProperty('total_dealers', 1952);
    expect(data).toHaveProperty('by_metro');
    expect(data).toHaveProperty('by_body_style');
    expect(data).toHaveProperty('by_make');
    expect(data).toHaveProperty('updated_at');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(getCachedInventorySnapshot).mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost/api/admin/inventory-snapshot');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to fetch inventory snapshot');
    expect(data.details).toBe('DB error');
  });
});
