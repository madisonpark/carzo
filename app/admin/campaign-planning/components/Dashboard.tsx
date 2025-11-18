'use client';

import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { useState, useMemo } from 'react';
import { formatBodyStyle } from '@/lib/format-body-style';

interface DashboardProps {
  initialData: {
    snapshot: {
      total_vehicles: number;
      by_body_style: Record<string, number>;
      by_make: Record<string, number>;
    };
    combinations: {
      make_bodystyle: Array<{ combo_name: string; vehicle_count: number }>;
      make_model: Array<{ combo_name: string; vehicle_count: number }>;
    };
  };
}

interface Campaign {
  name: string;
  type: string;
  vehicles: number;
  campaignType: string;
  campaignValue: string;
}

export function CampaignPlanningDashboard({ initialData }: DashboardProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'google'>('facebook');
  const [downloading, setDownloading] = useState<string | null>(null);

  // Combine all campaigns into one sortable list (memoized for performance)
  const allCampaigns = useMemo<Campaign[]>(() => [
    // Body styles (all of them, will be globally sorted)
    ...Object.entries(initialData.snapshot.by_body_style || {}).map(([name, count]) => ({
      name: formatBodyStyle(name),
      type: 'Body Style',
      vehicles: count,
      campaignType: 'body_style',
      campaignValue: name,
    })),

    // Makes (sort by count, then take top 10)
    ...Object.entries(initialData.snapshot.by_make || {})
      .sort((a, b) => (b[1] as number) - (a[1] as number)) // Sort by vehicle count FIRST
      .slice(0, 10) // Then take top 10
      .map(([name, count]) => ({
        name: name,
        type: 'Make',
        vehicles: count,
        campaignType: 'make',
        campaignValue: name,
      })),

    // Make + Body Style combos (sort by count, then take top 10)
    ...(initialData.combinations.make_bodystyle || [])
      .sort((a, b) => b.vehicle_count - a.vehicle_count) // Sort by vehicle count FIRST
      .slice(0, 10) // Then take top 10
      .map((combo) => {
        const parts = combo.combo_name.split(' ');
        const make = parts[0];
        const bodyStyle = parts.slice(1).join(' ');
        return {
          name: `${make} ${formatBodyStyle(bodyStyle)}`,
          type: 'Make + Body',
          vehicles: combo.vehicle_count,
          campaignType: 'make_body_style',
          campaignValue: combo.combo_name,
        };
      }),

    // Make + Model combos (sort by count, then take top 10)
    ...(initialData.combinations.make_model || [])
      .sort((a, b) => b.vehicle_count - a.vehicle_count) // Sort by vehicle count FIRST
      .slice(0, 10) // Then take top 10
      .map((combo) => ({
        name: combo.combo_name,
        type: 'Make + Model',
        vehicles: combo.vehicle_count,
        campaignType: 'make_model',
        campaignValue: combo.combo_name,
      })),
  ].sort((a, b) => b.vehicles - a.vehicles), [initialData]); // Sort all campaigns by vehicle count descending

  const handleDownload = async (campaign: Campaign) => {
    setDownloading(campaign.campaignValue);

    try {
      const url = `/api/admin/export-targeting-combined?campaign_type=${campaign.campaignType}&campaign_value=${encodeURIComponent(campaign.campaignValue)}&platform=${selectedPlatform}&min_vehicles=6`;

      const response = await fetch(url);

      if (!response.ok) {
        // Parse error message from API
        let errorMessage = 'Download failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Download failed: ${response.statusText}`;
        }

        // Show specific error based on status code
        if (response.status === 401) {
          alert('Unauthorized: Please log in again');
        } else if (response.status === 404) {
          alert(`No metros found with sufficient vehicles for ${campaign.name}`);
        } else if (response.status === 429) {
          alert('Rate limit exceeded. Please wait a moment and try again');
        } else {
          alert(errorMessage);
        }

        setDownloading(null);
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${selectedPlatform}-targeting-${campaign.campaignValue.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`;
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        alert('Network error: Please check your connection and try again');
      } else {
        alert('Failed to download targeting file. Please try again');
      }
    } finally {
      setDownloading(null);
    }
  };

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
                  Multi-metro targeting for advertising campaigns
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
        {/* Platform Selector */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Select Ad Platform</h2>
              <p className="text-sm text-slate-600">
                Choose which platform you're creating campaigns for
              </p>
            </div>
            <div className="flex gap-3" role="group" aria-label="Platform selector">
              <button
                onClick={() => setSelectedPlatform('facebook')}
                aria-label="Select Facebook platform"
                aria-pressed={selectedPlatform === 'facebook'}
                className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                  selectedPlatform === 'facebook'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Facebook
              </button>
              <button
                onClick={() => setSelectedPlatform('google')}
                aria-label="Select Google platform"
                aria-pressed={selectedPlatform === 'google'}
                className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                  selectedPlatform === 'google'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Google
              </button>
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Available Campaigns</h2>
            <p className="text-sm text-slate-600">
              {initialData.snapshot.total_vehicles.toLocaleString()} vehicles • Click to download
              multi-metro targeting
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Vehicles
                  </th>
                  <th className="text-center py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allCampaigns.slice(0, 20).map((campaign, i) => (
                  <tr
                    key={`${campaign.campaignType}-${campaign.campaignValue}`}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-900">{campaign.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-slate-600">{campaign.type}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-lg font-bold text-slate-900">
                        {campaign.vehicles.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDownload(campaign)}
                        disabled={downloading === campaign.campaignValue}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedPlatform === 'facebook'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Download className="w-4 h-4" />
                        {downloading === campaign.campaignValue
                          ? 'Downloading...'
                          : `Download ${selectedPlatform === 'facebook' ? 'Facebook' : 'Google'}`}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {allCampaigns.length > 20 && (
            <div className="p-4 border-t border-slate-200 text-center">
              <p className="text-sm text-slate-600">
                Showing top 20 campaigns • {allCampaigns.length - 20} more available
              </p>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-slate-700">
            <strong>💡 How it works:</strong> Select your platform above, then click Download to get multi-metro targeting
            covering all metros with 6+ vehicles for that campaign type.
          </p>
        </div>
      </div>
    </div>
  );
}
