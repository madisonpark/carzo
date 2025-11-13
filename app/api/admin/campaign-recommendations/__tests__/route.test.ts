import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as adminAuth from '@/lib/admin-auth';

vi.mock('@/lib/admin-auth');
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn((funcName: string) => {
      if (funcName === 'get_metro_inventory') {
        return Promise.resolve({
          data: [
            {
              metro: 'Tampa, FL',
              vehicle_count: 1337,
              dealer_count: 19,
              dealer_concentration: 0.014,
              top_body_styles: [],
              avg_price: 32000,
            },
            {
              metro: 'Dallas, TX',
              vehicle_count: 612,
              dealer_count: 15,
              dealer_concentration: 0.024,
              top_body_styles: [],
              avg_price: 28000,
            },
            {
              metro: 'Small, TX',
              vehicle_count: 150,
              dealer_count: 6,
              dealer_concentration: 0.040,
              top_body_styles: [],
              avg_price: 25000,
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: [], error: null });
    }),
  })),
}));

describe('GET /api/admin/campaign-recommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({ authorized: true });
  });

  it('should return 401 if not authorized', async () => {
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });

    const request = new NextRequest('http://localhost/api/admin/campaign-recommendations');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return tier-based recommendations', async () => {
    const request = new NextRequest('http://localhost/api/admin/campaign-recommendations');
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data).toHaveProperty('tier1');
    expect(data).toHaveProperty('tier2');
    expect(data).toHaveProperty('tier3');
    expect(data).toHaveProperty('total_campaigns');
  });

  it('should classify metros into correct tiers', async () => {
    const request = new NextRequest('http://localhost/api/admin/campaign-recommendations');
    const response = await GET(request);

    const data = await response.json();

    // Tampa (1337 vehicles, 19 dealers) → tier1
    // Dallas (612 vehicles, 15 dealers) → tier1
    // Small (150 vehicles, 6 dealers) → tier3
    expect(data.tier1.length).toBeGreaterThan(0);
    expect(data.tier3.length).toBeGreaterThan(0);
  });

  it('should include campaign metadata', async () => {
    const request = new NextRequest('http://localhost/api/admin/campaign-recommendations');
    const response = await GET(request);

    const data = await response.json();

    const campaign = data.tier1[0] || data.tier2[0] || data.tier3[0];

    expect(campaign).toHaveProperty('id');
    expect(campaign).toHaveProperty('name');
    expect(campaign).toHaveProperty('tier');
    expect(campaign).toHaveProperty('metro');
    expect(campaign).toHaveProperty('vehicles');
    expect(campaign).toHaveProperty('dealers');
    expect(campaign).toHaveProperty('recommended_daily_budget');
  });

  it('should allocate budgets that sum to total', async () => {
    const request = new NextRequest('http://localhost/api/admin/campaign-recommendations');
    const response = await GET(request);

    const data = await response.json();

    const allCampaigns = [...data.tier1, ...data.tier2, ...data.tier3];
    const totalDailyBudget = allCampaigns.reduce((sum: number, c: any) => sum + c.recommended_daily_budget, 0);
    const totalMonthlyBudget = totalDailyBudget * 30;

    // Should be close to 7500 (within rounding)
    expect(totalMonthlyBudget).toBeGreaterThan(7000);
    expect(totalMonthlyBudget).toBeLessThan(8000);
  });

  it('should handle database errors', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValue({
      rpc: vi.fn(() => Promise.resolve({ data: null, error: { message: 'DB error' } })),
    } as any);

    const request = new NextRequest('http://localhost/api/admin/campaign-recommendations');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
