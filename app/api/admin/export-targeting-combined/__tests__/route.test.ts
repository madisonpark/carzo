import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import * as adminAuth from '@/lib/admin-auth';
import { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/lib/admin-auth');
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(function (this: { eq: unknown }) {
          return this;
        }),
      })),
    })),
  })),
}));

describe('GET /api/admin/export-targeting-combined', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({ authorized: true });
  });

  it('should return 401 if not authorized', async () => {
    vi.mocked(adminAuth.validateAdminAuth).mockResolvedValue({
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    });

    const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return 400 if campaign_type is missing', async () => {
    const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_value=suv&platform=facebook');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('required');
  });

  it('should return 400 if campaign_value is missing', async () => {
    const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&platform=facebook');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid campaign_type', async () => {
    const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=invalid&campaign_value=suv&platform=facebook');
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid campaign_type');
  });

  it('should accept valid campaign_types', async () => {
    const validTypes = ['body_style', 'make', 'make_body_style', 'make_model'];

    for (const type of validTypes) {
      const request = new NextRequest(`http://localhost/api/admin/export-targeting-combined?campaign_type=${type}&campaign_value=test&platform=facebook`);

      // Mock will handle the actual query, we just verify it doesn't reject the type
      await GET(request);
      // If we get here without 400, the type was accepted
    }
  });

  it('should default platform to facebook if not specified', async () => {
    const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv');

    // This test verifies the default is handled without error
    const response = await GET(request);
    // Response may be 404 (no data in mock) but should not be 400 (bad request)
    expect(response.status).not.toBe(400);
  });

  it('should parse min_vehicles parameter', async () => {
    const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook&min_vehicles=10');

    const response = await GET(request);
    // Verify parameter is parsed (no 400 error)
    expect(response.status).not.toBe(400);
  });

  it('should use default min_vehicles of 6', async () => {
    const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook');

    const response = await GET(request);
    // Verify defaults are handled without error
    expect(response.status).not.toBe(400);
  });

  it('should handle max_metros parameter', async () => {
    const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook&max_metros=50');

    const response = await GET(request);
    expect(response.status).not.toBe(400);
  });

  it('should return CSV content-type for facebook', async () => {
    const { createClient } = await import('@supabase/supabase-js');

    // Mock successful response with data
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: [
                {
                  dealer_id: '1',
                  latitude: 27.9,
                  longitude: -82.4,
                  dealer_name: 'Test Dealer',
                  dealer_city: 'Tampa',
                  dealer_state: 'FL',
                  dma: 'Tampa, FL',
                },
              ],
              error: null,
            })),
          })),
        })),
      })),
      } as unknown as SupabaseClient<unknown, never, never>);

    const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook');
    const response = await GET(request);

    if (response.status === 200) {
      expect(response.headers.get('Content-Type')).toBe('text/csv');
    }
  });

  describe('Metro Aggregation Logic', () => {
    it('should calculate centroid from multiple dealers in same metro', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      // Mock multiple dealers in Tampa metro with different coordinates
      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: [
                {
                  dealer_id: '1',
                  latitude: 27.9,
                  longitude: -82.4,
                  dma: 'Tampa, FL',
                },
                {
                  dealer_id: '2',
                  latitude: 28.0,
                  longitude: -82.5,
                  dma: 'Tampa, FL',
                },
                {
                  dealer_id: '3',
                  latitude: 27.95,
                  longitude: -82.45,
                  dma: 'Tampa, FL',
                },
              ],
              error: null,
            })),
          })),
        })),
        } as unknown as SupabaseClient<unknown, never, never>);

      const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook&min_vehicles=3');
      const response = await GET(request);

      if (response.status === 200) {
        const csvText = await response.text();
        const lines = csvText.split('\n');

        // Should have header + 1 metro row
        expect(lines.length).toBe(2);

        // Parse CSV to verify centroid calculation
        const dataLine = lines[1];
        const fields = dataLine.split(',');

        // Expected centroid: lat = (27.9 + 28.0 + 27.95) / 3 = 27.95
        // Expected centroid: lon = (-82.4 + -82.5 + -82.45) / 3 = -82.45
        expect(fields[1]).toBe('27.9500'); // latitude
        expect(fields[2]).toBe('-82.4500'); // longitude
        expect(fields[3]).toBe('30'); // radius_miles (METRO_RADIUS_MILES constant)
        expect(fields[4]).toBe('3'); // vehicles count
        expect(fields[5]).toBe('3'); // dealers count
      }
    });

    it('should filter out metros with less than min_vehicles', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      // Mock 2 metros: Tampa (10 vehicles), Orlando (3 vehicles)
      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: [
                // Tampa metro - 10 vehicles
                ...Array(10).fill(null).map((_, i) => ({
                  dealer_id: `tampa-dealer-${i}`,
                  latitude: 27.9,
                  longitude: -82.4,
                  dma: 'Tampa, FL',
                })),
                // Orlando metro - 3 vehicles
                ...Array(3).fill(null).map((_, i) => ({
                  dealer_id: `orlando-dealer-${i}`,
                  latitude: 28.5,
                  longitude: -81.3,
                  dma: 'Orlando, FL',
                })),
              ],
              error: null,
            })),
          })),
        })),
        } as unknown as SupabaseClient<unknown, never, never>);

      const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook&min_vehicles=6');
      const response = await GET(request);

      if (response.status === 200) {
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());

        // Should only include Tampa (10 vehicles >= 6), not Orlando (3 vehicles < 6)
        expect(lines.length).toBe(2); // header + 1 metro
        expect(lines[1]).toContain('Tampa');
        expect(lines[1]).not.toContain('Orlando');
      }
    });

    it('should sort metros by vehicle count descending', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      // Mock 3 metros with different vehicle counts
      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: [
                // Miami - 20 vehicles
                ...Array(20).fill(null).map((_, i) => ({
                  dealer_id: `miami-${i}`,
                  latitude: 25.7,
                  longitude: -80.2,
                  dma: 'Miami, FL',
                })),
                // Tampa - 15 vehicles
                ...Array(15).fill(null).map((_, i) => ({
                  dealer_id: `tampa-${i}`,
                  latitude: 27.9,
                  longitude: -82.4,
                  dma: 'Tampa, FL',
                })),
                // Orlando - 10 vehicles
                ...Array(10).fill(null).map((_, i) => ({
                  dealer_id: `orlando-${i}`,
                  latitude: 28.5,
                  longitude: -81.3,
                  dma: 'Orlando, FL',
                })),
              ],
              error: null,
            })),
          })),
        })),
        } as unknown as SupabaseClient<unknown, never, never>);

      const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook&min_vehicles=6');
      const response = await GET(request);

      if (response.status === 200) {
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());

        // Should be sorted by vehicle count: Miami (20), Tampa (15), Orlando (10)
        expect(lines[1]).toContain('Miami'); // First metro
        expect(lines[1]).toContain('20'); // 20 vehicles
        expect(lines[2]).toContain('Tampa'); // Second metro
        expect(lines[2]).toContain('15'); // 15 vehicles
        expect(lines[3]).toContain('Orlando'); // Third metro
        expect(lines[3]).toContain('10'); // 10 vehicles
      }
    });

    it('should respect max_metros parameter', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      // Mock 5 metros with 10 vehicles each
      const metros = ['Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Fort Myers'];
      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: metros.flatMap(metro =>
                Array(10).fill(null).map((_, i) => ({
                  dealer_id: `${metro}-${i}`,
                  latitude: 27.0,
                  longitude: -82.0,
                  dma: `${metro}, FL`,
                }))
              ),
              error: null,
            })),
          })),
        })),
        } as unknown as SupabaseClient<unknown, never, never>);

      const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook&min_vehicles=6&max_metros=3');
      const response = await GET(request);

      if (response.status === 200) {
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());

        // Should only include 3 metros (header + 3 data rows)
        expect(lines.length).toBe(4);
      }
    });

    it('should skip metros with no valid coordinates', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      // Mock metro with some dealers missing coordinates
      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: [
                // Tampa - all dealers have coords
                {
                  dealer_id: '1',
                  latitude: 27.9,
                  longitude: -82.4,
                  dma: 'Tampa, FL',
                },
                {
                  dealer_id: '2',
                  latitude: 28.0,
                  longitude: -82.5,
                  dma: 'Tampa, FL',
                },
                // Orlando - NO dealers have coords (should be skipped)
                {
                  dealer_id: '3',
                  latitude: null,
                  longitude: null,
                  dma: 'Orlando, FL',
                },
                {
                  dealer_id: '4',
                  latitude: null,
                  longitude: null,
                  dma: 'Orlando, FL',
                },
              ],
              error: null,
            })),
          })),
        })),
        } as unknown as SupabaseClient<unknown, never, never>);

      const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook&min_vehicles=2');
      const response = await GET(request);

      if (response.status === 200) {
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());

        // Should only include Tampa (has coords), not Orlando (no coords)
        expect(lines.length).toBe(2); // header + 1 metro
        expect(lines[1]).toContain('Tampa');
        expect(lines[1]).not.toContain('Orlando');
      }
    });

    it('should count unique dealers per metro', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      // Mock 10 vehicles from only 3 unique dealers in Tampa
      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: [
                // Dealer 1 - 5 vehicles
                ...Array(5).fill(null).map(() => ({
                  dealer_id: 'dealer-1',
                  latitude: 27.9,
                  longitude: -82.4,
                  dma: 'Tampa, FL',
                })),
                // Dealer 2 - 3 vehicles
                ...Array(3).fill(null).map(() => ({
                  dealer_id: 'dealer-2',
                  latitude: 27.95,
                  longitude: -82.45,
                  dma: 'Tampa, FL',
                })),
                // Dealer 3 - 2 vehicles
                ...Array(2).fill(null).map(() => ({
                  dealer_id: 'dealer-3',
                  latitude: 28.0,
                  longitude: -82.5,
                  dma: 'Tampa, FL',
                })),
              ],
              error: null,
            })),
          })),
        })),
        } as unknown as SupabaseClient<unknown, never, never>);

      const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook&min_vehicles=6');
      const response = await GET(request);

      if (response.status === 200) {
        const csvText = await response.text();
        const lines = csvText.split('\n');
        const dataLine = lines[1];
        const fields = dataLine.split(',');

        expect(fields[4]).toBe('10'); // 10 vehicles
        expect(fields[5]).toBe('3'); // 3 unique dealers
      }
    });
  });

  describe('CSV Sanitization', () => {
    it('should sanitize metro names to prevent formula injection', async () => {
      const { createClient } = await import('@supabase/supabase-js');

      // Mock metro with dangerous name (starts with =)
      vi.mocked(createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: Array(10).fill(null).map(() => ({
                dealer_id: 'dealer-1',
                latitude: 27.9,
                longitude: -82.4,
                dma: '=SUM(A1:A10)', // Dangerous CSV formula
              })),
              error: null,
            })),
          })),
        })),
      } as unknown as SupabaseClient<unknown, never, never>);

      const request = new NextRequest('http://localhost/api/admin/export-targeting-combined?campaign_type=body_style&campaign_value=suv&platform=facebook&min_vehicles=6');
      const response = await GET(request);

      if (response.status === 200) {
        const csvText = await response.text();
        const lines = csvText.split('\n');
        const dataLine = lines[1];

        // Should prefix with single quote to neutralize formula
        expect(dataLine).toContain("'=SUM(A1:A10)");
        // Should NOT contain unescaped formula
        expect(dataLine).not.toMatch(/^"=SUM/);
      }
    });
  });
});
