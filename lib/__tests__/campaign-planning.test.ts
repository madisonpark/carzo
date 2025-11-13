import { describe, it, expect } from 'vitest';
import { generateCampaignRecommendations, calculateBudgetAllocation } from '../campaign-planning';
import type { MetroInventory, CampaignRecommendation } from '../campaign-planning';

describe('generateCampaignRecommendations', () => {
  const mockMetros: MetroInventory[] = [
    {
      dma: 'Tampa, FL',
      vehicle_count: 1337,
      dealer_count: 19,
      diversity_score: 0.85,
      top_body_styles: [],
      avg_price: 32000,
    },
    {
      dma: 'Small Town, TX',
      vehicle_count: 150,
      dealer_count: 6,
      diversity_score: 0.60,
      top_body_styles: [],
      avg_price: 25000,
    },
    {
      dma: 'Tiny City, NV',
      vehicle_count: 40,
      dealer_count: 2,
      diversity_score: 0.30,
      top_body_styles: [],
      avg_price: 28000,
    },
  ];

  it('should classify metros into correct tiers', () => {
    const result = generateCampaignRecommendations(mockMetros, 7500);

    // Tampa: 1337 vehicles, 19 dealers, 0.85 diversity → tier1
    expect(result[0].tier).toBe('tier1');
    expect(result[0].metro).toBe('Tampa, FL');

    // Small Town: 150 vehicles, 6 dealers → tier3
    const smallTown = result.find(r => r.metro === 'Small Town, TX');
    expect(smallTown?.tier).toBe('tier3');

    // Tiny City: 40 vehicles, 2 dealers → avoid
    const tinyCity = result.find(r => r.metro === 'Tiny City, NV');
    expect(tinyCity?.tier).toBe('avoid');
  });

  it('should allocate budget proportionally to inventory score', () => {
    const result = generateCampaignRecommendations(mockMetros, 7500);

    const totalBudget = result.reduce((sum, r) => sum + r.recommended_daily_budget, 0) * 30;

    // Budget should roughly equal total (within rounding)
    expect(totalBudget).toBeGreaterThan(7000);
    expect(totalBudget).toBeLessThan(8000);
  });

  it('should handle empty metros array', () => {
    const result = generateCampaignRecommendations([], 7500);

    expect(result).toEqual([]);
  });

  it('should sort by tier first, then by vehicle count', () => {
    const result = generateCampaignRecommendations(mockMetros, 7500);

    // tier1 should come before tier2/tier3/avoid
    const tiers = result.map(r => r.tier);
    const tier1Index = tiers.indexOf('tier1');
    const tier3Index = tiers.indexOf('tier3');
    const avoidIndex = tiers.indexOf('avoid');

    expect(tier1Index).toBeLessThan(tier3Index);
    expect(tier3Index).toBeLessThan(avoidIndex);
  });

  it('should create valid campaign IDs', () => {
    const result = generateCampaignRecommendations(mockMetros, 7500);

    // ID from "Tampa, FL" → "tampa,_fl_all" (comma becomes part of ID)
    expect(result[0].id).toBe('tampa,_fl_all');
    expect(result[0].id).toMatch(/^[a-z0-9_,]+$/); // Lowercase, numbers, underscores, commas
  });
});

describe('calculateBudgetAllocation', () => {
  const mockCampaigns: CampaignRecommendation[] = [
    {
      id: 'tampa_fl_all',
      name: 'Tampa, FL - All Vehicles',
      tier: 'tier1',
      metro: 'Tampa, FL',
      category: 'all',
      vehicles: 1337,
      dealers: 19,
      diversity: 0.85,
      recommended_daily_budget: 100,
      trend: 'stable',
      reason: 'High inventory',
    },
    {
      id: 'small_town_tx_all',
      name: 'Small Town, TX - All Vehicles',
      tier: 'tier2',
      metro: 'Small Town, TX',
      category: 'all',
      vehicles: 150,
      dealers: 6,
      diversity: 0.60,
      recommended_daily_budget: 50,
      trend: 'stable',
      reason: 'Adequate inventory',
    },
    {
      id: 'tiny_city_nv_all',
      name: 'Tiny City, NV - All Vehicles',
      tier: 'avoid',
      metro: 'Tiny City, NV',
      category: 'all',
      vehicles: 40,
      dealers: 2,
      diversity: 0.30,
      recommended_daily_budget: 10,
      trend: 'stable',
      reason: 'Insufficient inventory',
    },
  ];

  it('should calculate correct budget allocations', () => {
    const result = calculateBudgetAllocation(mockCampaigns, 7500, 0.50, 0.35);

    expect(result.allocations).toHaveLength(2); // Only tier1 and tier2 (avoid excluded)
    expect(result.allocations[0].campaign).toBe('Tampa, FL - All Vehicles');
  });

  it('should calculate correct monthly budgets from daily', () => {
    const result = calculateBudgetAllocation(mockCampaigns, 7500, 0.50, 0.35);

    const tampa = result.allocations[0];
    expect(tampa.monthly_budget).toBe(100 * 30); // 3000
    expect(tampa.daily_budget).toBe(100);
  });

  it('should calculate correct ROI projections', () => {
    const result = calculateBudgetAllocation(mockCampaigns, 7500, 0.50, 0.35);

    const tampa = result.allocations[0];

    // Verify math: $100/day ÷ $0.50 CPC = 200 clicks/day × 30 = 6000 clicks/month
    expect(tampa.expected_clicks).toBe(6000);

    // 6000 clicks × 35% conversion = 2100 dealer clicks
    // 2100 × $0.80 = $1680 revenue
    expect(tampa.expected_revenue).toBe(1680);

    // $1680 revenue - $3000 spend = -$1320 profit
    expect(tampa.expected_profit).toBe(-1320);

    // -$1320 / $3000 = -44% ROI
    expect(tampa.roi_pct).toBe(-44);
  });

  it('should filter out "avoid" tier campaigns', () => {
    const result = calculateBudgetAllocation(mockCampaigns, 7500, 0.50, 0.35);

    expect(result.allocations).not.toContainEqual(
      expect.objectContaining({ campaign: 'Tiny City, NV - All Vehicles' })
    );
  });

  it('should calculate correct summary totals', () => {
    const result = calculateBudgetAllocation(mockCampaigns, 7500, 0.50, 0.35);

    const manualTotal = result.allocations.reduce(
      (sum, alloc) => sum + alloc.monthly_budget,
      0
    );

    expect(result.summary.total_monthly_spend).toBe(manualTotal);
  });

  it('should handle empty campaigns array', () => {
    const result = calculateBudgetAllocation([], 7500, 0.50, 0.35);

    expect(result.allocations).toEqual([]);
    expect(result.summary.total_monthly_spend).toBe(0);
    expect(result.summary.overall_roi).toBe(0);
  });

  it('should protect against division by zero in CPC', () => {
    const result = calculateBudgetAllocation(mockCampaigns, 7500, 0, 0.35); // CPC = 0

    // Should use safeCpc = 0.01 instead of 0
    expect(result.allocations[0].expected_clicks).toBeGreaterThan(0);
    expect(result.allocations[0].expected_clicks).toBe(Math.round((100 / 0.01) * 30));
  });

  it('should protect against division by zero in ROI', () => {
    const zeroBudgetCampaign: CampaignRecommendation = {
      ...mockCampaigns[0],
      recommended_daily_budget: 0, // Zero budget
    };

    const result = calculateBudgetAllocation([zeroBudgetCampaign], 7500, 0.50, 0.35);

    expect(result.allocations[0].roi_pct).toBe(0); // Should not be NaN or Infinity
  });

  it('should clamp conversion rate to 0-1 range', () => {
    const result = calculateBudgetAllocation(mockCampaigns, 7500, 0.50, 1.5); // >100%

    // Should use safeConversionRate = 1.0 instead of 1.5
    const tampa = result.allocations[0];
    const expectedRevenue = Math.round((100 / 0.50) * 1.0 * 0.80 * 30 * 100) / 100;

    expect(tampa.expected_revenue).toBeLessThanOrEqual(expectedRevenue);
  });

  it('should handle zero total spend in summary', () => {
    const result = calculateBudgetAllocation([], 7500, 0.50, 0.35);

    expect(result.summary.overall_roi).toBe(0); // Should not be NaN
  });
});
