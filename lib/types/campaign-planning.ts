/**
 * TypeScript types for campaign planning database functions and APIs
 */

export interface MetroInventoryRow {
  metro: string;
  vehicle_count: number;
  dealer_count: number;
  dealer_concentration: number;
  top_body_styles: Array<{ body_style: string; count: number }>;
  avg_price: number;
}

export interface BodyStyleInventoryRow {
  body_style: string;
  vehicle_count: number;
  dealer_count: number;
  avg_price: number;
  top_metros: Array<{ metro: string; count: number }>;
}

export interface MakeInventoryRow {
  make: string;
  vehicle_count: number;
  dealer_count: number;
  avg_price: number;
  top_body_styles: Array<{ body_style: string; count: number }>;
  top_metros: Array<{ metro: string; count: number }>;
}

export interface CampaignRecommendation {
  id: string;
  name: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'avoid';
  metro: string;
  category: string;
  vehicles: number;
  dealers: number;
  dealer_concentration: number;
  recommended_daily_budget: number;
  trend: 'growing' | 'stable' | 'declining';
  reason: string;
}

export interface BudgetAllocation {
  campaign: string;
  metro: string;
  monthly_budget: number;
  daily_budget: number;
  expected_clicks: number;
  expected_revenue: number;
  expected_profit: number;
  roi_pct: number;
}

export interface BudgetSummary {
  total_monthly_spend: number;
  total_monthly_revenue: number;
  total_monthly_profit: number;
  overall_roi: number;
}
