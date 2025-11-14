'use client';

import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MetroInventory {
  metro: string;
  vehicle_count: number;
  dealer_count: number;
  dealer_concentration: number;
  top_body_styles: Array<{ body_style: string; count: number }>;
  avg_price: number;
}

interface BodyStyleInventory {
  body_style: string;
  vehicle_count: number;
  dealer_count: number;
  avg_price: number;
  top_metros: Array<{ metro: string; count: number }>;
}

interface MakeInventory {
  make: string;
  vehicle_count: number;
  dealer_count: number;
  avg_price: number;
  top_body_styles: Array<{ body_style: string; count: number }>;
  top_metros: Array<{ metro: string; count: number }>;
}

export function CampaignPlanningDashboard() {
  const [metros, setMetros] = useState<MetroInventory[]>([]);
  const [bodyStyles, setBodyStyles] = useState<BodyStyleInventory[]>([]);
  const [makes, setMakes] = useState<MakeInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetro, setSelectedMetro] = useState<string>('');

  useEffect(() => {
    // Fetch inventory data
    Promise.all([
      fetch('/api/admin/campaign-recommendations', {
        headers: { Authorization: 'Bearer carzo2024admin' },
      }).then(r => r.json()),

      // We'll need to create these endpoints or fetch from database functions
      // For now, use mock data
    ]).then(([recommendations]) => {
      const allCampaigns = [...recommendations.tier1, ...recommendations.tier2, ...recommendations.tier3];
      setMetros(allCampaigns.slice(0, 20)); // Top 20 metros
      setLoading(false);
      if (allCampaigns.length > 0) {
        setSelectedMetro(allCampaigns[0].metro);
      }
    });
  }, []);

  const handleDownload = async (metro: string, platform: string) => {
    try {
      const response = await fetch(
        `/api/admin/export-targeting?metro=${encodeURIComponent(metro)}&platform=${platform}`,
        {
          headers: { Authorization: 'Bearer carzo2024admin' },
        }
      );

      if (!response.ok) {
        alert(`Download failed: ${response.statusText}`);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${metro.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${platform}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p>Loading inventory data...</p>
    </div>;
  }

  const selectedMetroData = metros.find(m => m.metro === selectedMetro);

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
                  Select metro and download targeting files for ad platforms
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Metro Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Select Metro</h2>
              <p className="text-sm text-slate-600 mb-4">
                Choose a metro to see available inventory and download targeting files
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {metros.map((metro) => (
                  <button
                    key={metro.metro}
                    onClick={() => setSelectedMetro(metro.metro)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedMetro === metro.metro
                        ? 'border-brand bg-brand/5'
                        : 'border-slate-200 hover:border-brand/50'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{metro.metro}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {metro.vehicle_count.toLocaleString()} vehicles • {metro.dealer_count} dealers
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Metro Details & Actions */}
          <div className="lg:col-span-2 space-y-6">
            {selectedMetroData ? (
              <>
                {/* Metro Overview */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    {selectedMetro}
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-slate-600">Vehicles</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {selectedMetroData.vehicle_count.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Dealers</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {selectedMetroData.dealer_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Avg Price</p>
                      <p className="text-2xl font-bold text-slate-900">
                        ${Math.round(selectedMetroData.avg_price).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Concentration</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {(selectedMetroData.dealer_concentration * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Top Body Styles */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">Top Vehicle Categories</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedMetroData.top_body_styles.map((bs) => (
                        <div key={bs.body_style} className="bg-slate-50 rounded-lg p-3">
                          <p className="text-sm text-slate-600 capitalize">{bs.body_style}</p>
                          <p className="text-xl font-bold text-slate-900">
                            {bs.count.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Download Targeting Files */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Download Targeting Files
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Download geographic targeting files for {selectedMetro}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleDownload(selectedMetro, 'facebook', `${selectedMetro}-facebook.csv`)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Facebook (Lat/Long)
                    </button>

                    <button
                      onClick={() => handleDownload(selectedMetro, 'google', `${selectedMetro}-google.csv`)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Google (ZIP Codes)
                    </button>

                    <button
                      onClick={() => handleDownload(selectedMetro, 'tiktok', `${selectedMetro}-tiktok.csv`)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      TikTok/Taboola (DMA)
                    </button>
                  </div>

                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">
                      <strong>What you'll get:</strong>
                    </p>
                    <ul className="text-sm text-slate-600 mt-2 space-y-1">
                      <li>• <strong>Facebook:</strong> {selectedMetroData.dealer_count} dealer locations with 25-mile radius targeting</li>
                      <li>• <strong>Google:</strong> ZIP codes within 25 miles of all dealers in this metro</li>
                      <li>• <strong>TikTok/Taboola:</strong> DMA name for platform targeting (requires DMA data from next feed sync)</li>
                    </ul>
                  </div>
                </div>

                {/* Campaign Suggestions */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Suggested Campaigns for {selectedMetro}
                  </h3>

                  <div className="space-y-3">
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-1">
                        "{selectedMetro} - All Vehicles" Campaign
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">
                        Broad campaign showing all {selectedMetroData.vehicle_count.toLocaleString()} vehicles from {selectedMetroData.dealer_count} dealers
                      </p>
                      <p className="text-xs text-slate-500">
                        <strong>Ad copy:</strong> "Browse {selectedMetroData.vehicle_count.toLocaleString()}+ vehicles near {selectedMetro}. Compare prices from {selectedMetroData.dealer_count}+ dealers."
                      </p>
                    </div>

                    {selectedMetroData.top_body_styles.map((bs) => (
                      <div key={bs.body_style} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-1 capitalize">
                          "{selectedMetro} - {bs.body_style}s" Campaign
                        </h4>
                        <p className="text-sm text-slate-600 mb-2">
                          Category-specific: {bs.count.toLocaleString()} {bs.body_style}s available
                        </p>
                        <p className="text-xs text-slate-500">
                          <strong>Ad copy:</strong> "Find your perfect {bs.body_style} near {selectedMetro}. {bs.count}+ {bs.body_style}s in stock."
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <p className="text-slate-600">Select a metro from the list to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
