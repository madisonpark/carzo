'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CampaignPlanningPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication cookie
    const authCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('carzo_admin_auth='));

    if (!authCookie) {
      router.push('/admin/login');
      return;
    }

    setIsAuthenticated(true);
  }, [router]);

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p>Checking authentication...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Campaign Planning</h1>
                <p className="text-slate-600 mt-1">
                  Advertising inventory analysis and targeting exports
                </p>
              </div>
            </div>
            <a
              href="/api/admin/logout"
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
            >
              Logout
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Total Inventory</p>
            <p className="text-3xl font-bold text-slate-900">56,417</p>
            <p className="text-xs text-slate-500 mt-1">Active vehicles</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Unique Dealers</p>
            <p className="text-3xl font-bold text-slate-900">1,952</p>
            <p className="text-xs text-slate-500 mt-1">Across all metros</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Viable Metros</p>
            <p className="text-3xl font-bold text-slate-900">414</p>
            <p className="text-xs text-slate-500 mt-1">50+ vehicles each</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm text-slate-600 mb-2">Top Metro</p>
            <p className="text-xl font-bold text-slate-900">Tampa, FL</p>
            <p className="text-xs text-slate-500 mt-1">1,337 vehicles</p>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Campaign Planning APIs</h2>
          <p className="text-slate-600 mb-6">
            Use these API endpoints to analyze inventory and generate targeting files for ad platforms.
          </p>

          <div className="space-y-4">
            {/* Campaign Recommendations */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Campaign Recommendations
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Get tier-based campaign suggestions (Tier 1/2/3) based on inventory depth
                  </p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    GET /api/admin/campaign-recommendations
                  </code>
                </div>
                <button
                  onClick={() => {
                    window.open('/api/admin/campaign-recommendations?_auth=' + document.cookie, '_blank');
                  }}
                  className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
                >
                  View JSON
                </button>
              </div>
            </div>

            {/* Export Targeting */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Export Targeting Files</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Download CSV files for Facebook (lat/long), Google (ZIP codes), or TikTok (DMA)
                  </p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    GET /api/admin/export-targeting?metro=Tampa, FL&platform=facebook
                  </code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Download Facebook targeting CSV
                      fetch('/api/admin/export-targeting?metro=Tampa,%20FL&platform=facebook', {
                        headers: { Authorization: 'Bearer carzo2024admin' }
                      })
                        .then(res => res.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'tampa-facebook.csv';
                          a.click();
                        });
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Facebook
                  </button>
                  <button
                    onClick={() => {
                      // Download Google targeting CSV
                      fetch('/api/admin/export-targeting?metro=Tampa,%20FL&platform=google', {
                        headers: { Authorization: 'Bearer carzo2024admin' }
                      })
                        .then(res => res.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'tampa-google.csv';
                          a.click();
                        });
                    }}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Google
                  </button>
                </div>
              </div>
            </div>

            {/* Budget Calculator */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Budget Calculator</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Calculate budget allocation and ROI projections across viable campaigns
                  </p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    GET /api/admin/calculate-budget?total_budget=7500&cpc=0.50
                  </code>
                </div>
                <button
                  onClick={() => {
                    window.open('/api/admin/calculate-budget?total_budget=7500&cpc=0.50&conversion_rate=0.35', '_blank');
                  }}
                  className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
                >
                  Calculate
                </button>
              </div>
            </div>

            {/* Inventory Snapshot */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Inventory Snapshot</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Quick stats for writing ad copy (total vehicles, top metros, body styles, makes)
                  </p>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    GET /api/admin/inventory-snapshot
                  </code>
                </div>
                <button
                  onClick={() => {
                    window.open('/api/admin/inventory-snapshot', '_blank');
                  }}
                  className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
                >
                  View Stats
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Authentication Required</h3>
          <p className="text-slate-600 mb-4">
            All API endpoints require authentication via Bearer token:
          </p>
          <code className="block bg-white px-4 py-3 rounded-lg text-sm font-mono">
            curl -H "Authorization: Bearer carzo2024admin" \<br />
            &nbsp;&nbsp;http://localhost:3000/api/admin/campaign-recommendations
          </code>
          <p className="text-sm text-slate-500 mt-4">
            Replace <code className="bg-white px-1">carzo2024admin</code> with your actual admin password from .env.local
          </p>
        </div>
      </div>
    </div>
  );
}
