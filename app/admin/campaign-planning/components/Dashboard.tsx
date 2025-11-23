'use client';

import Link from 'next/link';
import { ArrowLeft, Download, Search, LogOut, Filter, ArrowDownToLine } from 'lucide-react';
import { useState, useMemo } from 'react';
import { formatBodyStyle } from '@/lib/format-body-style';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// Increased limits to allow search/filtering to work on a broader dataset
const TOP_MAKES_LIMIT = 50;
const TOP_COMBOS_LIMIT = 50;
const PAGE_SIZE = 20;

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
  id: string; // Unique ID for selection
  name: string;
  type: string;
  vehicles: number;
  campaignType: string;
  campaignValue: string;
}

export function CampaignPlanningDashboard({ initialData }: DashboardProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'google'>('facebook');
  const [downloading, setDownloading] = useState<string | null>(null); // 'bulk' or campaign ID
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Combine and process data
  const allCampaigns = useMemo<Campaign[]>(() => {
    if (!initialData?.snapshot || !initialData?.combinations) return [];

    const rawList = [
      // Body styles
      ...Object.entries(initialData.snapshot.by_body_style || {}).map(([name, count]) => ({
        id: `body_${name}`,
        name: formatBodyStyle(name),
        type: 'Body Style',
        vehicles: count,
        campaignType: 'body_style',
        campaignValue: name,
      })),

      // Makes
      ...Object.entries(initialData.snapshot.by_make || {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, TOP_MAKES_LIMIT)
        .map(([name, count]) => ({
          id: `make_${name}`,
          name: name,
          type: 'Make',
          vehicles: count,
          campaignType: 'make',
          campaignValue: name,
        })),

      // Make + Body Style combos
      ...(initialData.combinations.make_bodystyle || [])
        .sort((a, b) => b.vehicle_count - a.vehicle_count)
        .slice(0, TOP_COMBOS_LIMIT)
        .map((combo) => {
          const parts = combo.combo_name.split(' ');
          const make = parts[0];
          const bodyStyle = parts.slice(1).join(' ');
          return {
            id: `make_body_${combo.combo_name}`,
            name: `${make} ${formatBodyStyle(bodyStyle)}`,
            type: 'Make + Body',
            vehicles: combo.vehicle_count,
            campaignType: 'make_body_style',
            campaignValue: combo.combo_name,
          };
        }),

      // Make + Model combos
      ...(initialData.combinations.make_model || [])
        .sort((a, b) => b.vehicle_count - a.vehicle_count)
        .slice(0, TOP_COMBOS_LIMIT)
        .map((combo) => ({
          id: `make_model_${combo.combo_name}`,
          name: combo.combo_name,
          type: 'Make + Model',
          vehicles: combo.vehicle_count,
          campaignType: 'make_model',
          campaignValue: combo.combo_name,
        })),
    ].sort((a, b) => b.vehicles - a.vehicles);

    return rawList;
  }, [initialData]);

  // Apply filters
  const filteredCampaigns = useMemo(() => {
    return allCampaigns.filter((campaign) => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || campaign.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [allCampaigns, searchQuery, filterType]);

  // Selection Logic
  const toggleSelection = (id: string) => {
    const next = new Set(selectedItems);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItems(next);
  };

  const toggleSelectAll = () => {
    const allFilteredSelected = filteredCampaigns.length > 0 && filteredCampaigns.every(c => selectedItems.has(c.id));
    const next = new Set(selectedItems);

    if (allFilteredSelected) {
      filteredCampaigns.forEach(c => next.delete(c.id));
    } else {
      filteredCampaigns.forEach(c => next.add(c.id));
    }
    setSelectedItems(next);
  };

  // Generate timestamp for filename: YYYY_MM_DD_HH-MM-SS
  const getFormattedTimestamp = () => {
    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  };

  // Download Logic
  const processDownload = async (campaign: Campaign) => {
    const url = `/api/admin/export-targeting-combined?campaign_type=${campaign.campaignType}&campaign_value=${encodeURIComponent(campaign.campaignValue)}&platform=${selectedPlatform}&min_vehicles=6`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Format: [platform]_geotargeted_[subject]_[date]_[time].csv
    // Example: facebook_geotargeted_Kia-Sorrento_2025_11_10_17-33-23.csv
    const subject = campaign.campaignValue.replace(/[^a-z0-9]/gi, '-');
    const filename = `${selectedPlatform}_geotargeted_${subject}_${getFormattedTimestamp()}.csv`;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a); // Append to body for Firefox support
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  };

  const handleSingleDownload = async (campaign: Campaign) => {
    setDownloading(campaign.id);
    try {
      await processDownload(campaign);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const handleBulkDownload = async () => {
    const campaignsToDownload = allCampaigns.filter(c => selectedItems.has(c.id));
    setDownloading('bulk');
    
    let successCount = 0;
    // Sequential download to avoid browser blocking
    for (const campaign of campaignsToDownload) {
      try {
        await processDownload(campaign);
        successCount++;
        // Small delay between downloads to ensure unique timestamps and prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (e) {
        console.error(`Failed to download ${campaign.name}`, e);
      }
    }
    
    if (successCount < campaignsToDownload.length) {
      alert(`Completed with errors: ${successCount}/${campaignsToDownload.length} downloaded.`);
    }
    setDownloading(null);
    setSelectedItems(new Set()); // Clear selection after download
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Campaign Planning</h1>
                <p className="text-sm text-slate-600">
                  {initialData?.snapshot?.total_vehicles?.toLocaleString() ?? '0'} vehicles available for targeting
                </p>
              </div>
            </div>
            <a href="/api/admin/logout">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Controls Toolbar */}
        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-10 shadow-sm">
          {/* Left: Search & Filter */}
          <div className="flex flex-1 w-full md:w-auto gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search campaigns..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-full rounded-lg border border-border bg-white pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="Body Style">Body Style</option>
                <option value="Make">Make</option>
                <option value="Make + Body">Make + Body</option>
                <option value="Make + Model">Make + Model</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Right: Platform Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedPlatform('facebook')}
              className={cn(
                "px-4 py-1.5 text-sm font-semibold rounded-md transition-all",
                selectedPlatform === 'facebook' 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Facebook
            </button>
            <button
              onClick={() => setSelectedPlatform('google')}
              className={cn(
                "px-4 py-1.5 text-sm font-semibold rounded-md transition-all",
                selectedPlatform === 'google' 
                  ? "bg-white text-green-600 shadow-sm" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Google
            </button>
          </div>
        </Card>

        {/* Data Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6 w-12 text-center">
                    <input 
                      type="checkbox"
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      checked={filteredCampaigns.length > 0 && filteredCampaigns.every(c => selectedItems.has(c.id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Campaign</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Vehicles</th>
                  <th className="text-center py-3 px-4 w-24 text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCampaigns.slice(0, visibleCount).map((campaign) => (
                  <tr 
                    key={campaign.id} 
                    className={cn(
                      "hover:bg-slate-50 transition-colors",
                      selectedItems.has(campaign.id) && "bg-blue-50/50"
                    )}
                  >
                    <td className="py-4 px-6 text-center">
                      <input 
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                        checked={selectedItems.has(campaign.id)}
                        onChange={() => toggleSelection(campaign.id)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-900">{campaign.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary" className="font-normal bg-slate-100 text-slate-600">
                        {campaign.type}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-mono text-slate-700 font-medium">
                        {campaign.vehicles.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSingleDownload(campaign)}
                        disabled={downloading !== null}
                        title={`Download ${selectedPlatform} list`}
                        className={cn(
                          "h-8 w-8 hover:bg-slate-200",
                          selectedPlatform === 'facebook' ? "text-blue-600" : "text-green-600"
                        )}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {filteredCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No campaigns found matching &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Load More Footer */}
          {visibleCount < filteredCampaigns.length && (
            <div className="p-4 border-t border-slate-200 text-center bg-slate-50/50">
              <Button 
                variant="outline" 
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="w-full sm:w-auto"
              >
                Load More ({filteredCampaigns.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Bulk Action Floating Bar */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                {selectedItems.size}
              </div>
              <span className="text-sm font-medium">Campaigns selected</span>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedItems(new Set())}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleBulkDownload}
                disabled={downloading !== null}
                className={cn(
                  "gap-2 text-white border-0",
                  selectedPlatform === 'facebook' ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                )}
              >
                {downloading === 'bulk' ? (
                  <>Downloading...</>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    Download All
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}