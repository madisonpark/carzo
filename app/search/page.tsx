import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/supabase';
import { diversifyByDealer } from '@/lib/dealer-diversity';
import { calculateDistance } from '@/lib/geolocation';
import SearchResults from '@/components/Search/SearchResults';
import FilterSidebar from '@/components/Search/FilterSidebar';
import LocationDetector from '@/components/Search/LocationDetector';
import ZipCodeInput from '@/components/Location/ZipCodeInput';

interface SearchPageProps {
  searchParams: Promise<{
    make?: string;
    model?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    minYear?: string;
    maxYear?: string;
    bodyStyle?: string;
    page?: string;
    lat?: string;
    lon?: string;
  }>;
}

// Get unique filter options
async function getFilterOptions() {
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('make, model, body_style, condition, year')
    .eq('is_active', true);

  const makes = [...new Set(vehicles?.map(v => v.make).filter(Boolean))].sort();
  const bodyStyles = [...new Set(vehicles?.map(v => v.body_style).filter(Boolean))].sort();
  const conditions = [...new Set(vehicles?.map(v => v.condition).filter(Boolean))].sort();
  const years = [...new Set(vehicles?.map(v => v.year).filter(Boolean))].sort((a, b) => b - a);

  return { makes, bodyStyles, conditions, years };
}

// Search vehicles with filters
async function searchVehicles(params: {
  make?: string;
  model?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  bodyStyle?: string;
  page?: string;
  lat?: string;
  lon?: string;
}) {
  const RESULTS_PER_PAGE = 24;
  const page = parseInt(params.page || '1');
  const offset = (page - 1) * RESULTS_PER_PAGE;

  // Parse user location if provided
  const userLat = params.lat ? parseFloat(params.lat) : null;
  const userLon = params.lon ? parseFloat(params.lon) : null;

  // Build query
  let query = supabase
    .from('vehicles')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  // Apply filters
  if (params.make) query = query.eq('make', params.make);
  if (params.model) query = query.eq('model', params.model);
  if (params.condition) query = query.eq('condition', params.condition);
  if (params.bodyStyle) query = query.eq('body_style', params.bodyStyle);
  if (params.minPrice) query = query.gte('price', parseFloat(params.minPrice));
  if (params.maxPrice) query = query.lte('price', parseFloat(params.maxPrice));
  if (params.minYear) query = query.gte('year', parseInt(params.minYear));
  if (params.maxYear) query = query.lte('year', parseInt(params.maxYear));

  // Order by newest first (default)
  query = query.order('year', { ascending: false });

  // Get total count
  const { count } = await query;

  // Get more results than needed for dealer diversification
  const fetchLimit = RESULTS_PER_PAGE * 3; // Fetch 3x to ensure diversity
  const { data: allVehicles } = await query.range(offset, offset + fetchLimit - 1);

  // Calculate distances and filter by targeting radius if user location provided
  let vehiclesWithDistance = allVehicles || [];
  if (userLat && userLon && allVehicles) {
    vehiclesWithDistance = allVehicles
      .map(v => ({
        ...v,
        distance: v.latitude && v.longitude
          ? calculateDistance(userLat, userLon, v.latitude, v.longitude)
          : Infinity,
      }))
      .filter(v => {
        // Only show vehicles within their targeting radius
        const radius = v.targeting_radius || 30;
        return v.distance <= radius;
      });

    // Sort by distance (nearest first) within the radius
    vehiclesWithDistance.sort((a, b) => a.distance - b.distance);
  }

  // Apply dealer diversification
  const vehicles = vehiclesWithDistance.length > 0
    ? diversifyByDealer(vehiclesWithDistance, RESULTS_PER_PAGE)
    : [];

  return {
    vehicles: vehicles as Vehicle[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / RESULTS_PER_PAGE),
    userLocation: userLat && userLon ? { lat: userLat, lon: userLon } : null,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [searchResults, filterOptions] = await Promise.all([
    searchVehicles(params),
    getFilterOptions(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {params.make
                  ? `${params.make}${params.model ? ` ${params.model}` : ''} Vehicles`
                  : 'Search Vehicles'}
              </h1>
              <p className="text-slate-600 mt-1">
                {searchResults.total.toLocaleString()} vehicles found
              </p>
            </div>
            <Suspense fallback={<div className="text-sm text-slate-600">Loading location...</div>}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <LocationDetector />
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>or</span>
                  <ZipCodeInput placeholder="Enter zip code" className="w-48" />
                </div>
              </div>
            </Suspense>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <Suspense fallback={<div>Loading filters...</div>}>
              <FilterSidebar
                makes={filterOptions.makes}
                bodyStyles={filterOptions.bodyStyles}
                conditions={filterOptions.conditions}
                years={filterOptions.years}
                currentFilters={params}
              />
            </Suspense>
          </aside>

          {/* Results */}
          <main className="flex-1">
            <Suspense fallback={<div>Loading...</div>}>
              <SearchResults
                vehicles={searchResults.vehicles}
                total={searchResults.total}
                page={searchResults.page}
                totalPages={searchResults.totalPages}
                currentFilters={params}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

// Enable ISR: Revalidate every 1 hour
export const revalidate = 3600;
