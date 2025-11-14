'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatBodyStyle } from '@/lib/format-body-style';

interface BodyStyle {
  body_style: string;
  vehicle_count: number;
}

interface Make {
  make: string;
  vehicle_count: number;
}

interface Combination {
  combo_name: string;
  vehicle_count: number;
}

export function CampaignPlanningDashboard() {
  const [bodyStyles, setBodyStyles] = useState<BodyStyle[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [makeBodyCombos, setMakeBodyCombos] = useState<Combination[]>([]);
  const [makeModelCombos, setMakeModelCombos] = useState<Combination[]>([]);
  const [totalVehicles, setTotalVehicles] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch ALL real inventory data from database
    Promise.all([
      fetch('/api/admin/inventory-snapshot', {
        headers: { Authorization: 'Bearer carzo2024admin' },
      }).then(r => r.json()),
      fetch('/api/admin/combinations', {
        headers: { Authorization: 'Bearer carzo2024admin' },
      }).then(r => r.json()),
    ])
      .then(([snapshot, combinations]) => {
        // Convert object to array and sort
        const bodyStyleArray = Object.entries(snapshot.by_body_style || {})
          .map(([name, count]) => ({
            body_style: name,
            vehicle_count: count as number,
          }))
          .sort((a, b) => b.vehicle_count - a.vehicle_count);

        const makeArray = Object.entries(snapshot.by_make || {})
          .map(([name, count]) => ({
            make: name,
            vehicle_count: count as number,
          }))
          .sort((a, b) => b.vehicle_count - a.vehicle_count);

        setBodyStyles(bodyStyleArray);
        setMakes(makeArray);
        setMakeBodyCombos(combinations.make_bodystyle || []);
        setMakeModelCombos(combinations.make_model || []);
        setTotalVehicles(snapshot.total_vehicles || 0);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading inventory:', error);
        setLoading(false);
      });
  }, []);

  // Skeleton loader component
  const SkeletonCard = ({ items = 5 }: { items?: number }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="h-6 w-32 bg-slate-200 rounded animate-pulse mb-4" />
      <div className="h-4 w-48 bg-slate-100 rounded animate-pulse mb-4" />
      <div className="space-y-2">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
          <p className="text-slate-600">
            Choose campaign type based on inventory depth nationwide
          </p>
          {!loading && (
            <p className="text-lg font-semibold text-slate-700 mt-2 mb-6">
              {totalVehicles.toLocaleString()} vehicles available
            </p>
          )}
          {loading && <div className="h-7 w-48 bg-slate-200 rounded animate-pulse mt-2 mb-6" />}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SkeletonCard items={5} />
              <SkeletonCard items={10} />
              <SkeletonCard items={10} />
              <SkeletonCard items={10} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Body Styles */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">By Body Style</h3>
              <p className="text-sm text-slate-600 mb-4">Category campaigns (broadest reach)</p>
              <div className="space-y-2">
                {bodyStyles.slice(0, 5).map((bs, i) => (
                  <div
                    key={bs.body_style}
                    className={`p-3 rounded-lg ${
                      i === 0
                        ? 'bg-green-50 border border-green-200'
                        : i === 1
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{formatBodyStyle(bs.body_style)}</span>
                      <span
                        className={`text-2xl font-bold ${
                          i === 0 ? 'text-green-600' : i === 1 ? 'text-blue-600' : ''
                        }`}
                      >
                        {bs.vehicle_count.toLocaleString()}
                      </span>
                    </div>
                    {i === 0 && <p className="text-xs text-slate-500 mt-1">Best: Largest inventory</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Makes */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">By Make</h3>
              <p className="text-sm text-slate-600 mb-4">Brand-specific campaigns (top 10)</p>
              <div className="space-y-2">
                {makes.slice(0, 10).map((make, i) => (
                  <div
                    key={make.make}
                    className={`p-3 rounded-lg ${
                      i === 0
                        ? 'bg-green-50 border border-green-200'
                        : i === 1
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{make.make}</span>
                      <span
                        className={`text-2xl font-bold ${
                          i === 0 ? 'text-green-600' : i === 1 ? 'text-blue-600' : ''
                        }`}
                      >
                        {make.vehicle_count.toLocaleString()}
                      </span>
                    </div>
                    {i === 0 && <p className="text-xs text-slate-500 mt-1">Best: Top make</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Make + Body Style Combos */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Make + Body Style</h3>
              <p className="text-sm text-slate-600 mb-4">Combined campaigns (top 10)</p>
              <div className="space-y-2">
                {makeBodyCombos.slice(0, 10).map((combo, i) => {
                  // Format body style in combination (e.g., "Kia suv" → "Kia SUV")
                  const parts = combo.combo_name.split(' ');
                  const make = parts[0];
                  const bodyStyle = parts.slice(1).join(' ');
                  const formatted = `${make} ${formatBodyStyle(bodyStyle)}`;

                  return (
                    <div
                      key={combo.combo_name}
                      className={`p-3 rounded-lg ${
                        i === 0
                          ? 'bg-green-50 border border-green-200'
                          : i === 1
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{formatted}</span>
                      <span
                        className={`text-xl font-bold ${
                          i === 0 ? 'text-green-600' : i === 1 ? 'text-blue-600' : ''
                        }`}
                      >
                        {combo.vehicle_count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Make + Model Combos */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Make + Model</h3>
              <p className="text-sm text-slate-600 mb-4">Specific models (top 10)</p>
              <div className="space-y-2">
                {makeModelCombos.slice(0, 10).map((combo, i) => (
                  <div
                    key={combo.combo_name}
                    className={`p-3 rounded-lg ${
                      i === 0
                        ? 'bg-green-50 border border-green-200'
                        : i === 1
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{combo.combo_name}</span>
                      <span
                        className={`text-xl font-bold ${
                          i === 0 ? 'text-green-600' : i === 1 ? 'text-blue-600' : ''
                        }`}
                      >
                        {combo.vehicle_count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
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
