import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Calculate budget allocation and ROI projections
 *
 * Query params:
 * - total_budget: Monthly budget (default: 7500)
 * - cpc: Assumed CPC (default: 0.50)
 * - conversion_rate: Assumed conversion rate (default: 0.35)
 *
 * @returns Budget allocation recommendations with ROI projections
 */
export async function GET(request: NextRequest) {
  // Simple password auth
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const totalBudget = Number(searchParams.get('total_budget') || 7500);
  const cpcAssumption = Number(searchParams.get('cpc') || 0.50);
  const conversionRate = Number(searchParams.get('conversion_rate') || 0.35);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get campaign recommendations
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/campaign-recommendations`,
      {
        headers: { Authorization: `Bearer ${process.env.ADMIN_PASSWORD}` },
      }
    );

    const { tier1, tier2 } = await response.json();
    const viableCampaigns = [...tier1, ...tier2];

    // Calculate allocations
    const allocations = viableCampaigns.map((campaign: any) => {
      const monthlyBudget = campaign.recommended_daily_budget * 30;
      const dailyBudget = campaign.recommended_daily_budget;
      const dailyClicks = dailyBudget / cpcAssumption;
      const dealerClicks = dailyClicks * conversionRate;
      const dailyRevenue = dealerClicks * 0.80;
      const monthlyRevenue = dailyRevenue * 30;
      const monthlyProfit = monthlyRevenue - monthlyBudget;
      const roiPct = (monthlyProfit / monthlyBudget) * 100;

      return {
        campaign: campaign.name,
        metro: campaign.metro,
        monthly_budget: Math.round(monthlyBudget * 100) / 100,
        daily_budget: Math.round(dailyBudget * 100) / 100,
        expected_clicks: Math.round(dailyClicks * 30),
        expected_revenue: Math.round(monthlyRevenue * 100) / 100,
        expected_profit: Math.round(monthlyProfit * 100) / 100,
        roi_pct: Math.round(roiPct),
      };
    });

    // Calculate summary
    const summary = allocations.reduce(
      (sum, alloc) => ({
        total_monthly_spend: sum.total_monthly_spend + alloc.monthly_budget,
        total_monthly_revenue: sum.total_monthly_revenue + alloc.expected_revenue,
        total_monthly_profit: sum.total_monthly_profit + alloc.expected_profit,
        overall_roi: 0,
      }),
      { total_monthly_spend: 0, total_monthly_revenue: 0, total_monthly_profit: 0, overall_roi: 0 }
    );

    summary.overall_roi = Math.round((summary.total_monthly_profit / summary.total_monthly_spend) * 100);

    return NextResponse.json({
      assumptions: {
        total_monthly_budget: totalBudget,
        cpc: cpcAssumption,
        conversion_rate: conversionRate,
        revenue_per_billable_click: 0.80,
      },
      allocations,
      summary,
    });
  } catch (error: any) {
    console.error('Error calculating budget:', error);
    return NextResponse.json(
      { error: 'Failed to calculate budget', details: error.message },
      { status: 500 }
    );
  }
}
