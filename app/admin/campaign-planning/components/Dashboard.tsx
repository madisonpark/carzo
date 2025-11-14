'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function CampaignPlanningDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Campaign Planning</h1>
                <p className="text-slate-600 mt-1">
                  Decide what to advertise, then where to advertise it
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
        {/* Step 1: What to Advertise */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Step 1: What Should I Advertise?</h2>
          <p className="text-slate-600 mb-6">
            Choose campaign type based on inventory depth nationwide
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Body Styles */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">By Body Style</h3>
              <p className="text-sm text-slate-600 mb-4">Category campaigns (broadest reach)</p>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">SUVs</span>
                    <span className="text-2xl font-bold text-green-600">41,000</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Best: Huge inventory</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Trucks</span>
                    <span className="text-2xl font-bold text-blue-600">12,456</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Good depth</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Sedans</span>
                    <span className="text-2xl font-bold">15,678</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Makes */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">By Make</h3>
              <p className="text-sm text-slate-600 mb-4">Brand-specific campaigns</p>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Kia</span>
                    <span className="text-2xl font-bold text-green-600">13,174</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Best: Top make</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Toyota</span>
                    <span className="text-2xl font-bold text-blue-600">8,234</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Ford</span>
                    <span className="text-2xl font-bold">6,456</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Combinations */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Top Combinations</h3>
              <p className="text-sm text-slate-600 mb-4">Make + Body Style or Make + Model</p>
              <div className="space-y-2">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Toyota SUVs</span>
                    <span className="text-xl font-bold text-green-600">2,345</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Make + Body Style</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Ford Trucks</span>
                    <span className="text-xl font-bold text-blue-600">2,156</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Make + Body Style</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Kia SUVs</span>
                    <span className="text-xl font-bold">1,543</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Make + Body Style</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Jeep Grand Cherokee</span>
                    <span className="text-xl font-bold">892</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Specific Model</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">Kia Sorento</span>
                    <span className="text-xl font-bold">734</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Specific Model</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Where to Advertise */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Step 2: Where Should I Run This Campaign?</h2>
          <p className="text-slate-600 mb-6">
            Top metros for your chosen campaign type (showing generic metro view - select category above to see filtered)
          </p>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Metro</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Vehicles</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Dealers</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Top Category</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 font-medium">Tampa, FL</td>
                    <td className="text-right py-3 px-4">1,337</td>
                    <td className="text-right py-3 px-4">19</td>
                    <td className="text-right py-3 px-4 text-sm text-slate-600">699 SUVs</td>
                    <td className="text-center py-3 px-4">
                      <a
                        href="/api/admin/export-targeting?metro=Tampa,%20FL&platform=facebook"
                        download
                        className="text-sm text-brand hover:underline"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 font-medium">Dallas, TX</td>
                    <td className="text-right py-3 px-4">612</td>
                    <td className="text-right py-3 px-4">15</td>
                    <td className="text-right py-3 px-4 text-sm text-slate-600">234 SUVs</td>
                    <td className="text-center py-3 px-4">
                      <a
                        href="/api/admin/export-targeting?metro=Dallas,%20TX&platform=facebook"
                        download
                        className="text-sm text-brand hover:underline"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      <p className="mb-2">Full interactive dashboard coming soon</p>
                      <p className="text-sm">For now, use the API endpoints below</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* API Documentation */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">API Endpoints (Full Data)</h3>

          <div className="space-y-3">
            <div>
              <p className="font-semibold text-slate-900 mb-1">Get all metros with inventory:</p>
              <code className="block bg-white px-3 py-2 rounded text-sm">
                curl -H "Authorization: Bearer carzo2024admin" http://localhost:3000/api/admin/campaign-recommendations
              </code>
            </div>

            <div>
              <p className="font-semibold text-slate-900 mb-1">Download targeting for specific metro:</p>
              <code className="block bg-white px-3 py-2 rounded text-sm">
                curl -H "Authorization: Bearer carzo2024admin" \<br/>
                &nbsp;&nbsp;"http://localhost:3000/api/admin/export-targeting?metro=Tampa,%20FL&platform=facebook" \<br/>
                &nbsp;&nbsp;--output tampa-facebook.csv
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
