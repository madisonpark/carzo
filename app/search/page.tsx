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

// Get unique filter options based on current filters and location
async function getFilterOptions(params?: {
  make?: string;
  model?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  bodyStyle?: string;
  lat?: string;
  lon?: string;
}) {
  // Parse user location if provided
  const userLat = params?.lat ? parseFloat(params.lat) : null;
  const userLon = params?.lon ? parseFloat(params.lon) : null;

  // OPTIMIZATION: If no location filtering, use database-level DISTINCT queries (much faster)
  if (!userLat || !userLon) {
    // Build base query with current filters
    const buildFilterQuery = () => {
      let q = supabase.from('vehicles').select('*').eq('is_active', true);
      if (params?.make) q = q.eq('make', params.make);
      if (params?.model) q = q.eq('model', params.model);
      if (params?.condition) q = q.eq('condition', params.condition);
      if (params?.bodyStyle) q = q.eq('body_style', params.bodyStyle);
      if (params?.minPrice) q = q.gte('price', parseFloat(params.minPrice));
      if (params?.maxPrice) q = q.lte('price', parseFloat(params.maxPrice));
      if (params?.minYear) q = q.gte('year', parseInt(params.minYear));
      if (params?.maxYear) q = q.lte('year', parseInt(params.maxYear));
      return q;
    };

    // Run 4 parallel DISTINCT queries for each filter option
    const [makesResult, bodyStylesResult, conditionsResult, yearsResult] = await Promise.all([
      buildFilterQuery().select('make').limit(1000),
      buildFilterQuery().select('body_style').limit(1000),
      buildFilterQuery().select('condition').limit(1000),
      buildFilterQuery().select('year').limit(1000),
    ]);

    // Extract unique values using Sets
    const makes = [...new Set(makesResult.data?.map(v => v.make).filter(Boolean))].sort();
    const bodyStyles = [...new Set(bodyStylesResult.data?.map(v => v.body_style).filter(Boolean))].sort();
    const conditions = [...new Set(conditionsResult.data?.map(v => v.condition).filter(Boolean))].sort();
    const years = [...new Set(yearsResult.data?.map(v => v.year).filter(Boolean))].sort((a, b) => b - a);

    return { makes, bodyStyles, conditions, years };
  }

  // LOCATION-BASED FILTERING (requires client-side distance calculation)
  // TODO: Replace with PostGIS spatial queries for production scalability
  // Current approach: Fetch 10,000 records and filter client-side (workaround)
  // Better solution: Use ST_DWithin() stored procedure in PostgreSQL with PostGIS
  // Example: SELECT * FROM vehicles WHERE ST_DWithin(location, ST_Point($lon, $lat)::geography, radius_meters)
  // This is acceptable for MVP but should be migrated to PostGIS as dataset grows

  // Build query with current filters applied
  let query = supabase
    .from('vehicles')
    .select('make, model, body_style, condition, year, latitude, longitude, targeting_radius')
    .eq('is_active', true);

  // Apply current filters
  if (params?.make) query = query.eq('make', params.make);
  if (params?.model) query = query.eq('model', params.model);
  if (params?.condition) query = query.eq('condition', params.condition);
  if (params?.bodyStyle) query = query.eq('body_style', params.bodyStyle);
  if (params?.minPrice) query = query.gte('price', parseFloat(params.minPrice));
  if (params?.maxPrice) query = query.lte('price', parseFloat(params.maxPrice));
  if (params?.minYear) query = query.gte('year', parseInt(params.minYear));
  if (params?.maxYear) query = query.lte('year', parseInt(params.maxYear));

  // Fetch up to 10,000 vehicles for filter options
  // For location filtering, fetch up to 10,000 vehicles to find nearby ones
  const { data: vehicles } = await query.limit(10000);

  if (!vehicles || vehicles.length === 0) {
    return { makes: [], bodyStyles: [], conditions: [], years: [] };
  }

  // Filter by distance
  let filteredVehicles = vehicles
    .map(v => ({
      ...v,
      distance: v.latitude && v.longitude
        ? calculateDistance(userLat, userLon, v.latitude, v.longitude)
        : Infinity,
    }))
    .filter(v => {
      const radius = v.targeting_radius || 30;
      return v.distance <= radius;
    });

  // If no vehicles within radius, show closest vehicles
  if (filteredVehicles.length === 0) {
    filteredVehicles = vehicles
      .map(v => ({
        ...v,
        distance: v.latitude && v.longitude
          ? calculateDistance(userLat, userLon, v.latitude, v.longitude)
          : Infinity,
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5000); // Take closest 5000
  }

  // Extract unique values from filtered results
  const makes = [...new Set(filteredVehicles?.map(v => v.make).filter(Boolean))].sort();
  const bodyStyles = [...new Set(filteredVehicles?.map(v => v.body_style).filter(Boolean))].sort();
  const conditions = [...new Set(filteredVehicles?.map(v => v.condition).filter(Boolean))].sort();
  const years = [...new Set(filteredVehicles?.map(v => v.year).filter(Boolean))].sort((a, b) => b - a);

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
  sortBy?: string;
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

  // Order by newest first (default) unless location filtering is active
  if (userLat && userLon) {
    // Don't order yet - we'll sort by distance after filtering
    // For location-based search, fetch a large sample to find nearby vehicles
    // Note: Ideally we'd use PostGIS for database-level distance filtering
  } else {
    query = query.order('year', { ascending: false });
  }

  // Execute query with count and data
  let allVehicles;
  let count;

  if (userLat && userLon) {
    // For location filtering, fetch up to 10,000 vehicles to find nearby ones
    // This is a workaround until we implement PostGIS
    const { data, count: total } = await query.limit(10000);
    allVehicles = data;
    count = total;
  } else {
    // Normal pagination - fetch 3x the results for dealer diversification
    const fetchLimit = RESULTS_PER_PAGE * 3;
    const { data, count: total } = await query.range(offset, offset + fetchLimit - 1);
    allVehicles = data;
    count = total;
  }

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

    // Sort by distance (nearest first) within the radius OR by user-selected sort
    applySorting(vehiclesWithDistance, params.sortBy || 'distance');

    // If no vehicles found within radius, fall back to showing closest vehicles
    if (vehiclesWithDistance.length === 0 && allVehicles.length > 0) {
      vehiclesWithDistance = allVehicles
        .map(v => ({
          ...v,
          distance: v.latitude && v.longitude
            ? calculateDistance(userLat, userLon, v.latitude, v.longitude)
            : Infinity,
        }));
      applySorting(vehiclesWithDistance, params.sortBy || 'distance');
    }
  } else if (allVehicles) {
    // Apply user-selected sorting or default
    vehiclesWithDistance = [...allVehicles];
    applySorting(vehiclesWithDistance, params.sortBy || 'year_desc');
  }

  // Sorting helper function
  function applySorting(vehicles: (Vehicle & { distance?: number })[], sortBy: string) {
    switch (sortBy) {
      case 'price_asc':
        vehicles.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        vehicles.sort((a, b) => b.price - a.price);
        break;
      case 'year_asc':
        vehicles.sort((a, b) => a.year - b.year);
        break;
      case 'year_desc':
        vehicles.sort((a, b) => b.year - a.year);
        break;
      case 'mileage_asc':
        vehicles.sort((a, b) => (a.miles || 999999) - (b.miles || 999999));
        break;
      case 'mileage_desc':
        vehicles.sort((a, b) => (b.miles || 0) - (a.miles || 0));
        break;
      case 'distance':
        vehicles.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        break;
      case 'relevance':
      default:
        // Relevance = distance if available, otherwise year
        if (userLat && userLon) {
          vehicles.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        } else {
          vehicles.sort((a, b) => b.year - a.year);
        }
    }
  }

  // For location-based search, apply pagination AFTER sorting by distance
  let paginatedVehicles = vehiclesWithDistance;
  let totalResults = count || 0;

  if (userLat && userLon && vehiclesWithDistance.length > 0) {
    // Use filtered results count for pagination
    totalResults = vehiclesWithDistance.length;
    // Apply pagination manually
    const startIdx = (page - 1) * RESULTS_PER_PAGE;
    const endIdx = startIdx + (RESULTS_PER_PAGE * 3); // Fetch extra for diversification
    paginatedVehicles = vehiclesWithDistance.slice(startIdx, endIdx);
  }

  // Apply dealer diversification
  const vehicles = paginatedVehicles.length > 0
    ? diversifyByDealer(paginatedVehicles, RESULTS_PER_PAGE)
    : [];

  return {
    vehicles: vehicles as Vehicle[],
    total: totalResults,
    page,
    totalPages: Math.ceil(totalResults / RESULTS_PER_PAGE),
    userLocation: userLat && userLon ? { lat: userLat, lon: userLon } : null,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [searchResults, filterOptions] = await Promise.all([
    searchVehicles(params),
    getFilterOptions(params), // Pass current filters to get dynamic options
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

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
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <section className="flex-1">
            <Suspense fallback={<div>Loading...</div>}>
              <SearchResults
                vehicles={searchResults.vehicles}
                total={searchResults.total}
                page={searchResults.page}
                totalPages={searchResults.totalPages}
                currentFilters={params}
              />
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  );
}

// Enable ISR: Revalidate every 1 hour
export const revalidate = 3600;
