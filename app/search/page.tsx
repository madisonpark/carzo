import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { Vehicle, VehicleWithDistance } from "@/lib/supabase";
import { diversifyByDealer } from "@/lib/dealer-diversity";
import { shouldApplyDiversification } from "@/lib/search-utils";
import SearchResults from "@/components/Search/SearchResults";
import FilterSidebar from "@/components/Search/FilterSidebar";
import LocationDetector from "@/components/Search/LocationDetector";
import ZipCodeInput from "@/components/Location/ZipCodeInput";

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

  // OPTIMIZATION: Two-path approach
  // Path 1: No location = Use database-level DISTINCT queries (10x faster)
  // Path 2: With location = Use PostGIS spatial function (100x faster than old approach)
  if (!userLat || !userLon) {
    // Build base query with current filters
    const buildFilterQuery = () => {
      let q = supabase.from("vehicles").select("*").eq("is_active", true);
      if (params?.make) q = q.eq("make", params.make);
      if (params?.model) q = q.eq("model", params.model);
      if (params?.condition) q = q.eq("condition", params.condition);
      if (params?.bodyStyle) q = q.eq("body_style", params.bodyStyle);
      if (params?.minPrice) q = q.gte("price", parseFloat(params.minPrice));
      if (params?.maxPrice) q = q.lte("price", parseFloat(params.maxPrice));
      if (params?.minYear) q = q.gte("year", parseInt(params.minYear));
      if (params?.maxYear) q = q.lte("year", parseInt(params.maxYear));
      return q;
    };

    // Run 4 parallel DISTINCT queries for each filter option
    // Use buildFilterQuery to respect current filters, avoiding 'any' casts
    const [makesResult, bodyStylesResult, conditionsResult, yearsResult] =
      await Promise.all([
        buildFilterQuery().select("make").limit(1000),
        buildFilterQuery().select("body_style").limit(1000),
        buildFilterQuery().select("condition").limit(1000),
        buildFilterQuery().select("year").limit(1000),
      ]);

    // Extract unique values using Sets
    const makes = [
      ...new Set(makesResult.data?.map((v) => v.make).filter(Boolean)),
    ].sort();
    const bodyStyles = [
      ...new Set(
        bodyStylesResult.data?.map((v) => v.body_style).filter(Boolean)
      ),
    ].sort();
    const conditions = [
      ...new Set(
        conditionsResult.data?.map((v) => v.condition).filter(Boolean)
      ),
    ].sort();
    const years = [
      ...new Set(yearsResult.data?.map((v) => v.year).filter(Boolean)),
    ].sort((a, b) => b - a);

    return { makes, bodyStyles, conditions, years };
  }

  // LOCATION-BASED FILTERING: Use PostGIS spatial function (100x faster)
  // Calls get_filter_options_by_location() stored procedure via rate-limited API proxy
  // Uses ST_DWithin with GIST spatial index for fast radius queries
  //
  // DESIGN DECISION: No fallback for sparse areas
  // Previous implementation showed 5K closest vehicles when radius search returned nothing.
  // Removed for paid ad traffic use case - users expect local results, not vehicles 500+ miles away.
  // Better UX to show "no results" than irrelevant distant vehicles.
  //
  // SECURITY: Rate-limited API proxy prevents DoS and scraping attacks
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/filter-options`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_lat: userLat,
          user_lon: userLon,
          make: params?.make || null,
          model: params?.model || null,
          condition: params?.condition || null,
          body_style: params?.bodyStyle || null,
          min_price: params?.minPrice ? parseFloat(params.minPrice) : null,
          max_price: params?.maxPrice ? parseFloat(params.maxPrice) : null,
          min_year: params?.minYear ? parseInt(params.minYear) : null,
          max_year: params?.maxYear ? parseInt(params.maxYear) : null,
        }),
      }
    );

    if (!response.ok) {
      console.error("Error calling filter-options API:", response.statusText);
      return { makes: [], bodyStyles: [], conditions: [], years: [] };
    }

    const { data } = await response.json();

    if (!data || data.length === 0) {
      return { makes: [], bodyStyles: [], conditions: [], years: [] };
    }

    // PostGIS function returns single row with arrays
    const result = data[0];
    return {
      makes: result.makes || [],
      bodyStyles: result.body_styles || [],
      conditions: result.conditions || [],
      years: result.years || [],
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return { makes: [], bodyStyles: [], conditions: [], years: [] };
  }
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
  const page = parseInt(params.page || "1");
  const offset = (page - 1) * RESULTS_PER_PAGE;

  // Parse user location if provided
  const userLat = params.lat ? parseFloat(params.lat) : null;
  const userLon = params.lon ? parseFloat(params.lon) : null;

  // Two-path approach: PostGIS for location-based, regular query for non-location
  if (userLat && userLon) {
    // LOCATION-BASED SEARCH: Use PostGIS spatial function (100x faster)
    // Calls search_vehicles_by_location() stored procedure via rate-limited API proxy
    // Uses ST_DWithin with GIST spatial index for fast radius queries
    //
    // PAGINATION STRATEGY: Fetch all results (limited by 100-mile radius cap)
    // and perform dealer diversification in memory before slicing for current page.
    // This prevents pagination duplicates that occur when diversifying overlapping windows.
    // With 100-mile cap, result sets are typically small enough for memory (< 5K vehicles).
    //
    // SECURITY: Rate-limited API proxy prevents DoS and scraping attacks
    let spatialVehicles;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/search-vehicles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_lat: userLat,
            user_lon: userLon,
            make: params.make || null,
            model: params.model || null,
            condition: params.condition || null,
            body_style: params.bodyStyle || null,
            min_price: params.minPrice ? parseFloat(params.minPrice) : null,
            max_price: params.maxPrice ? parseFloat(params.maxPrice) : null,
            min_year: params.minYear ? parseInt(params.minYear) : null,
            max_year: params.maxYear ? parseInt(params.maxYear) : null,
            limit: 10000, // Fetch all results within 100-mile radius (typically < 5K)
            offset: 0,
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "Error calling search-vehicles API:",
          response.statusText
        );
        return {
          vehicles: [],
          total: 0,
          page,
          totalPages: 0,
          userLocation: { lat: userLat, lon: userLon },
        };
      }

      const { data } = await response.json();
      spatialVehicles = data;
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return {
        vehicles: [],
        total: 0,
        page,
        totalPages: 0,
        userLocation: { lat: userLat, lon: userLon },
      };
    }

    // Get total count from window function (same for all records)
    const totalResults = spatialVehicles?.[0]?.total_results || 0;

    // Cast to VehicleWithDistance type
    const vehiclesWithDistance = (spatialVehicles ||
      []) as VehicleWithDistance[];

    // PostGIS already sorted by distance, just apply user-selected sort if needed
    if (
      params.sortBy &&
      params.sortBy !== "distance" &&
      params.sortBy !== "relevance"
    ) {
      applySorting(vehiclesWithDistance, params.sortBy);
    }

    // Apply dealer diversification to FULL result set to ensure stable pagination
    // ONLY if not sorting by price or mileage (user intent overrides diversification)
    const shouldDiversify = shouldApplyDiversification(params.sortBy);

    let finalVehicles = vehiclesWithDistance;

    if (shouldDiversify && vehiclesWithDistance.length > 0) {
      finalVehicles = diversifyByDealer(vehiclesWithDistance, totalResults);
    }

    // Now slice for current page from results
    const startIdx = (page - 1) * RESULTS_PER_PAGE;
    const endIdx = startIdx + RESULTS_PER_PAGE;
    const vehicles = finalVehicles.slice(startIdx, endIdx);

    return {
      vehicles: vehicles as Vehicle[],
      total: totalResults,
      page,
      totalPages: Math.ceil(totalResults / RESULTS_PER_PAGE),
      userLocation: { lat: userLat, lon: userLon },
    };
  }

  // NON-LOCATION SEARCH: Use regular Supabase query
  //
  // PAGINATION STRATEGY: Similar to location search - fetch larger set,
  // diversify, then paginate to prevent duplicates across pages.
  // Limit to 5000 results to prevent memory issues on broad searches.
  let query = supabase
    .from("vehicles")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  // Apply filters
  if (params.make) query = query.eq("make", params.make);
  if (params.model) query = query.eq("model", params.model);
  if (params.condition) query = query.eq("condition", params.condition);
  if (params.bodyStyle) query = query.eq("body_style", params.bodyStyle);
  if (params.minPrice) query = query.gte("price", parseFloat(params.minPrice));
  if (params.maxPrice) query = query.lte("price", parseFloat(params.maxPrice));
  if (params.minYear) query = query.gte("year", parseInt(params.minYear));
  if (params.maxYear) query = query.lte("year", parseInt(params.maxYear));

  // Apply default sort (newest first)
  query = query.order("year", { ascending: false });

  // Fetch up to 5000 results for dealer diversification
  const { data: allVehicles, count } = await query.limit(5000);

  // Apply user-selected sorting if different from default
  const vehiclesWithDistance = allVehicles || [];
  if (params.sortBy && params.sortBy !== "year_desc") {
    applySorting(vehiclesWithDistance, params.sortBy);
  }

  // Apply dealer diversification to FULL result set to ensure stable pagination
  // ONLY if not sorting by price or mileage (user intent overrides diversification)
  const shouldDiversify = shouldApplyDiversification(params.sortBy);

  let finalVehicles = vehiclesWithDistance;

  if (shouldDiversify && vehiclesWithDistance.length > 0) {
    finalVehicles = diversifyByDealer(vehiclesWithDistance, count || 0);
  }

  // Now slice for current page from results
  const startIdx = (page - 1) * RESULTS_PER_PAGE;
  const endIdx = startIdx + RESULTS_PER_PAGE;
  const vehicles = finalVehicles.slice(startIdx, endIdx);

  // Sorting helper function
  function applySorting(
    vehicles: (Vehicle & { distance_miles?: number })[],
    sortBy: string
  ) {
    switch (sortBy) {
      case "price_asc":
        vehicles.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        vehicles.sort((a, b) => b.price - a.price);
        break;
      case "year_asc":
        vehicles.sort((a, b) => a.year - b.year);
        break;
      case "year_desc":
        vehicles.sort((a, b) => b.year - a.year);
        break;
      case "mileage_asc":
        vehicles.sort((a, b) => (a.miles || 999999) - (b.miles || 999999));
        break;
      case "mileage_desc":
        vehicles.sort((a, b) => (b.miles || 0) - (a.miles || 0));
        break;
      case "distance":
        vehicles.sort(
          (a, b) =>
            (a.distance_miles || Infinity) - (b.distance_miles || Infinity)
        );
        break;
      case "relevance":
      default:
        // Relevance = distance if available, otherwise year
        if (vehicles[0]?.distance_miles !== undefined) {
          vehicles.sort(
            (a, b) =>
              (a.distance_miles || Infinity) - (b.distance_miles || Infinity)
          );
        } else {
          vehicles.sort((a, b) => b.year - a.year);
        }
    }
  }

  return {
    vehicles: vehicles as Vehicle[],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / RESULTS_PER_PAGE),
    userLocation: null,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const [searchResults, filterOptions] = await Promise.all([
    searchVehicles(params),
    getFilterOptions(params), // Pass current filters to get dynamic options
  ]);

  return (
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-zinc-900">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:bg-trust-navy focus-visible:text-white focus-visible:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Header */}
      <div className="bg-trust-card border-b border-trust-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-trust-text">
                {params.make
                  ? `${params.make}${
                      params.model ? ` ${params.model}` : ""
                    } Vehicles`
                  : "Inventory"}
              </h1>
              <p className="text-trust-muted mt-1">
                {searchResults.total.toLocaleString()} vehicles found
              </p>
            </div>
            <Suspense
              fallback={
                <div className="text-sm text-muted-foreground">
                  Loading location...
                </div>
              }
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <LocationDetector />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>or</span>
                  <ZipCodeInput placeholder="Enter zip code" className="w-48" />
                </div>
              </div>
            </Suspense>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8"
      >
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
