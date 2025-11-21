import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Users,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// Force dynamic rendering (no caching)
export const dynamic = "force-dynamic";

interface AnalyticsData {
  totalClicks: number;
  billableClicks: number;
  wastedClicks: number;
  uniqueUsers: number;
  revenue: number;
  topVehicles: Array<{
    vin: string;
    year: number;
    make: string;
    model: string;
    clicks: number;
  }>;
  recentClicks: Array<{
    id: string;
    created_at: string;
    is_billable: boolean;
    cta_clicked: string;
    vehicle_vin: string;
    dealer_name: string;
  }>;
  flowPerformance: {
    direct: {
      clicks: number;
      billable: number;
      revenue: number;
      billableRate: number;
    };
    vdpOnly: {
      clicks: number;
      impressions: number;
      billable: number;
      revenue: number;
      billableRate: number;
      ctr: number;
    };
    full: {
      clicks: number;
      billable: number;
      revenue: number;
      billableRate: number;
    };
  };
}

/**
 * Helper function to determine the winning flow for a given metric
 * @param flowPerformance - Flow performance data
 * @param metric - The metric to compare ('revenue', 'billableRate', or 'clicks')
 * @returns The name of the winning flow, 'Tie', or 'No data yet'
 */
function getFlowWinner(
  flowPerformance: AnalyticsData["flowPerformance"],
  metric: "revenue" | "billableRate" | "clicks"
): string {
  const { direct, vdpOnly, full } = flowPerformance;

  // Check if all values are zero (no data yet)
  if (metric === "revenue") {
    if (direct.revenue === 0 && vdpOnly.revenue === 0 && full.revenue === 0) {
      return "No data yet";
    }
  } else if (metric === "billableRate" || metric === "clicks") {
    if (direct.clicks === 0 && vdpOnly.clicks === 0 && full.clicks === 0) {
      return "No data yet";
    }
  }

  // Get values for comparison
  const directValue = direct[metric];
  const vdpOnlyValue = vdpOnly[metric];
  const fullValue = full[metric];

  // Determine winner
  if (directValue > vdpOnlyValue && directValue > fullValue) {
    return "Flow A (Direct)";
  }
  if (vdpOnlyValue > directValue && vdpOnlyValue > fullValue) {
    return "Flow B (VDP-Only)";
  }
  if (fullValue > directValue && fullValue > vdpOnlyValue) {
    return "Flow C (Full Funnel)";
  }

  return "Tie";
}

async function getAnalytics(): Promise<AnalyticsData> {
  // Get total clicks with flow information
  const { data: allClicks } = await supabaseAdmin
    .from("clicks")
    .select("id, is_billable, user_id, flow");

  const totalClicks = allClicks?.length || 0;
  const billableClicks = allClicks?.filter((c) => c.is_billable).length || 0;
  const wastedClicks = totalClicks - billableClicks;
  const uniqueUsers = new Set(allClicks?.map((c) => c.user_id)).size;
  const revenue = billableClicks * 0.8;

  // Calculate flow performance (treat null/undefined as 'full' for backward compatibility)
  const directClicks = allClicks?.filter((c) => c.flow === "direct") || [];
  const vdpOnlyClicks = allClicks?.filter((c) => c.flow === "vdp-only") || [];
  const fullClicks =
    allClicks?.filter(
      (c) => c.flow === "full" || c.flow === null || c.flow === undefined
    ) || [];

  // Get impressions for vdp-only flow (for CTR calculation)
  const { data: vdpImpressions } = await supabaseAdmin
    .from("impressions")
    .select("id")
    .eq("flow", "vdp-only");

  const directBillable = directClicks.filter((c) => c.is_billable).length;
  const vdpOnlyBillable = vdpOnlyClicks.filter((c) => c.is_billable).length;
  const fullBillable = fullClicks.filter((c) => c.is_billable).length;

  const flowPerformance = {
    direct: {
      clicks: directClicks.length,
      billable: directBillable,
      revenue: directBillable * 0.8,
      billableRate:
        directClicks.length > 0
          ? (directBillable / directClicks.length) * 100
          : 0,
    },
    vdpOnly: {
      clicks: vdpOnlyClicks.length,
      impressions: vdpImpressions?.length || 0,
      billable: vdpOnlyBillable,
      revenue: vdpOnlyBillable * 0.8,
      billableRate:
        vdpOnlyClicks.length > 0
          ? (vdpOnlyBillable / vdpOnlyClicks.length) * 100
          : 0,
      ctr:
        vdpImpressions && vdpImpressions.length > 0
          ? (vdpOnlyClicks.length / vdpImpressions.length) * 100
          : 0,
    },
    full: {
      clicks: fullClicks.length,
      billable: fullBillable,
      revenue: fullBillable * 0.8,
      billableRate:
        fullClicks.length > 0 ? (fullBillable / fullClicks.length) * 100 : 0,
    },
  };

  // Get top vehicles by click count
  const { data: vehicleClicks } = await supabaseAdmin
    .from("clicks")
    .select("vehicle_id, vehicles(vin, year, make, model)")
    .order("created_at", { ascending: false })
    .limit(1000);

  interface VehicleInfo {
    vin: string;
    year: number;
    make: string;
    model: string;
  }

  interface ClickWithVehicle {
    vehicle_id: string;
    vehicles: VehicleInfo[] | null;
  }

  const vehicleClickCount = new Map<
    string,
    { count: number; vehicle: VehicleInfo }
  >();
  vehicleClicks?.forEach((click: ClickWithVehicle) => {
    if (click.vehicles && click.vehicles.length > 0) {
      const vehicle = click.vehicles[0]; // Supabase returns array for relationships
      const vin = vehicle.vin;
      if (!vehicleClickCount.has(vin)) {
        vehicleClickCount.set(vin, { count: 0, vehicle });
      }
      vehicleClickCount.get(vin)!.count++;
    }
  });

  const topVehicles = Array.from(vehicleClickCount.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([vin, data]) => ({
      vin,
      year: data.vehicle.year,
      make: data.vehicle.make,
      model: data.vehicle.model,
      clicks: data.count,
    }));

  // Get recent clicks
  const { data: recentClicksData } = await supabaseAdmin
    .from("clicks")
    .select(
      `
      id,
      created_at,
      is_billable,
      cta_clicked,
      vehicles(vin),
      dealer_id,
      dealer_name:vehicles(dealer_name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(10);

  interface RecentClickData {
    id: string;
    created_at: string;
    is_billable: boolean;
    cta_clicked: string;
    vehicles: Array<{ vin: string }> | null;
    dealer_id: string;
    dealer_name: Array<{ dealer_name: string }> | null;
  }

  const recentClicks =
    recentClicksData?.map((click: RecentClickData) => ({
      id: click.id,
      created_at: click.created_at,
      is_billable: click.is_billable,
      cta_clicked: click.cta_clicked,
      vehicle_vin: click.vehicles?.[0]?.vin || "N/A",
      dealer_name: click.dealer_name?.[0]?.dealer_name || "Unknown",
    })) || [];

  return {
    totalClicks,
    billableClicks,
    wastedClicks,
    uniqueUsers,
    revenue,
    topVehicles,
    recentClicks,
    flowPerformance,
  };
}

export default async function AdminDashboard() {
  // Check authentication
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("carzo_admin_auth");

  if (!authCookie || authCookie.value !== process.env.ADMIN_PASSWORD) {
    redirect("/admin/login");
  }

  const analytics = await getAnalytics();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Carzo Analytics
              </h1>
              <p className="text-slate-600 mt-1">
                Revenue tracking and performance metrics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/admin/campaign-planning"
                className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-lg transition-colors"
              >
                Campaign Planning
              </a>
              <a
                href="/api/admin/logout"
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
              >
                Logout
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold">
              ${analytics.revenue.toFixed(2)}
            </p>
            <p className="text-green-100 text-sm mt-1">Total Revenue</p>
          </div>

          {/* Billable Clicks */}
          <div className="bg-gradient-to-br from-brand to-brand-hover rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold">{analytics.billableClicks}</p>
            <p className="text-slate-100 text-sm mt-1">Billable Clicks</p>
          </div>

          {/* Total Clicks */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <MousePointerClick className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold">{analytics.totalClicks}</p>
            <p className="text-purple-100 text-sm mt-1">Total Clicks</p>
          </div>

          {/* Wasted Clicks */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold">{analytics.wastedClicks}</p>
            <p className="text-orange-100 text-sm mt-1">Wasted Clicks</p>
          </div>

          {/* Unique Users */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold">{analytics.uniqueUsers}</p>
            <p className="text-indigo-100 text-sm mt-1">Unique Users</p>
          </div>
        </div>

        {/* Flow Performance A/B Test Results */}
        <div className="mb-8 bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              A/B Test Flow Performance
            </h2>
            <p className="text-slate-600">
              Compare conversion metrics across three flow variants: Direct,
              VDP-Only, and Full Funnel
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flow A: Direct */}
            <div className="border-2 border-red-200 bg-red-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Flow A: Direct
                </h3>
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-full">
                  SERP → Dealer
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Clicks</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {analytics.flowPerformance.direct.clicks}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Billable</p>
                    <p className="text-xl font-bold text-green-600">
                      {analytics.flowPerformance.direct.billable}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Revenue</p>
                    <p className="text-xl font-bold text-green-600">
                      ${analytics.flowPerformance.direct.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-red-200">
                  <p className="text-xs text-slate-600 mb-1">Billable Rate</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 bg-slate-200 rounded-full h-2"
                      role="progressbar"
                      aria-label="Flow A billable rate"
                      aria-valuenow={(Math.min(
                        100,
                        analytics.flowPerformance.direct.billableRate || 0
                      )).toString()}
                      aria-valuemin={(0).toString()}
                      aria-valuemax={(100).toString()}
                    >
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500 w-progress"
                        style={{
                          '--progress-width': `${Math.min(
                            100,
                            analytics.flowPerformance.direct.billableRate || 0
                          )}%`,
                        } as React.CSSProperties}
                      />
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {(
                        analytics.flowPerformance.direct.billableRate || 0
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow B: VDP-Only */}
            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Flow B: VDP-Only
                </h3>
                <span className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                  Ad → VDP → Dealer
                </span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Impressions</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {analytics.flowPerformance.vdpOnly.impressions}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Clicks</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {analytics.flowPerformance.vdpOnly.clicks}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Billable</p>
                    <p className="text-xl font-bold text-green-600">
                      {analytics.flowPerformance.vdpOnly.billable}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Revenue</p>
                    <p className="text-xl font-bold text-green-600">
                      ${analytics.flowPerformance.vdpOnly.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-blue-200 space-y-3">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">
                      Click-Through Rate (CTR)
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 bg-slate-200 rounded-full h-2"
                        role="progressbar"
                        aria-label="Flow B click-through rate"
                        aria-valuenow={(Math.min(
                          100,
                          analytics.flowPerformance.vdpOnly.ctr || 0
                        )).toString()}
                        aria-valuemin={(0).toString()}
                        aria-valuemax={(100).toString()}
                      >
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500 w-progress"
                          style={{
                            '--progress-width': `${Math.min(
                              100,
                              analytics.flowPerformance.vdpOnly.ctr || 0
                            )}%`,
                          } as React.CSSProperties}
                        />
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {analytics.flowPerformance.vdpOnly.ctr.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Billable Rate</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 bg-slate-200 rounded-full h-2"
                        role="progressbar"
                        aria-label="Flow B billable rate"
                        aria-valuenow={(Math.min(
                          100,
                          analytics.flowPerformance.vdpOnly.billableRate || 0
                        )).toString()}
                        aria-valuemin={(0).toString()}
                        aria-valuemax={(100).toString()}
                      >
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300 w-progress"
                          style={{
                            '--progress-width': `${Math.min(
                              100,
                              analytics.flowPerformance.vdpOnly.billableRate ||
                                0
                            )}%`,
                          } as React.CSSProperties}
                        />
                      </div>
                      <p className="text-lg font-bold text-slate-900">
                        {(
                          analytics.flowPerformance.vdpOnly.billableRate || 0
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Flow C: Full Funnel */}
            <div className="border-2 border-purple-200 bg-purple-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Flow C: Full Funnel
                </h3>
                <span className="px-3 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                  SERP → VDP → Dealer
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Clicks</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {analytics.flowPerformance.full.clicks}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Billable</p>
                    <p className="text-xl font-bold text-green-600">
                      {analytics.flowPerformance.full.billable}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Revenue</p>
                    <p className="text-xl font-bold text-green-600">
                      ${analytics.flowPerformance.full.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-purple-200">
                  <p className="text-xs text-slate-600 mb-1">Billable Rate</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 bg-slate-200 rounded-full h-2"
                      role="progressbar"
                      aria-label="Flow C billable rate"
                      aria-valuenow={(Math.min(
                        100,
                        analytics.flowPerformance.full.billableRate || 0
                      )).toString()}
                      aria-valuemin={(0).toString()}
                      aria-valuemax={(100).toString()}
                    >
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500 w-progress"
                        style={{
                          '--progress-width': `${Math.min(
                            100,
                            analytics.flowPerformance.full.billableRate || 0
                          )}%`,
                        } as React.CSSProperties}
                      />
                    </div>
                    <p className="text-lg font-bold text-slate-900">
                      {(
                        analytics.flowPerformance.full.billableRate || 0
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Comparison Summary */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">
              Performance Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-600 mb-1">Highest Revenue</p>
                <p className="font-bold text-slate-900">
                  {getFlowWinner(analytics.flowPerformance, "revenue")}
                </p>
              </div>
              <div>
                <p className="text-slate-600 mb-1">Highest Billable Rate</p>
                <p className="font-bold text-slate-900">
                  {getFlowWinner(analytics.flowPerformance, "billableRate")}
                </p>
              </div>
              <div>
                <p className="text-slate-600 mb-1">Most Traffic</p>
                <p className="font-bold text-slate-900">
                  {getFlowWinner(analytics.flowPerformance, "clicks")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Vehicles */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-brand" />
              <h2 className="text-xl font-bold text-slate-900">
                Top Performing Vehicles
              </h2>
            </div>
            <div className="space-y-4">
              {analytics.topVehicles.map((vehicle) => (
                <div
                  key={vehicle.vin}
                  className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-slate-500">VIN: {vehicle.vin}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-brand">
                      {vehicle.clicks}
                    </p>
                    <p className="text-xs text-slate-500">clicks</p>
                  </div>
                </div>
              ))}
              {analytics.topVehicles.length === 0 && (
                <p className="text-slate-500 text-center py-8">No data yet</p>
              )}
            </div>
          </div>

          {/* Recent Clicks */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MousePointerClick className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Recent Clicks
              </h2>
            </div>
            <div className="space-y-3">
              {analytics.recentClicks.map((click) => (
                <div
                  key={click.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {click.dealer_name}
                      </p>
                      {click.is_billable ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          Billable
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                          Duplicate
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      VIN: {click.vehicle_vin} • CTA: {click.cta_clicked}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {new Date(click.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {analytics.recentClicks.length === 0 && (
                <p className="text-slate-500 text-center py-8">No clicks yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mt-8 bg-muted border border-border rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Revenue per Click</p>
              <p className="text-2xl font-bold text-slate-900">
                $
                {analytics.totalClicks > 0
                  ? (analytics.revenue / analytics.totalClicks).toFixed(2)
                  : "0.00"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Billable Rate</p>
              <p className="text-2xl font-bold text-slate-900">
                {analytics.totalClicks > 0
                  ? (
                      (analytics.billableClicks / analytics.totalClicks) *
                      100
                    ).toFixed(1)
                  : "0"}
                %
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Revenue per User</p>
              <p className="text-2xl font-bold text-slate-900">
                $
                {analytics.uniqueUsers > 0
                  ? (analytics.revenue / analytics.uniqueUsers).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}