"use client";

import { Vehicle } from "@/lib/supabase";
import VehicleCard from "./VehicleCard";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { diversifyByDealer } from "@/lib/dealer-diversity";

interface SearchResultsProps {
  vehicles: Vehicle[];
  total: number;
  page: number; // Kept for initial state, but we use load more
  totalPages: number; // Kept for reference
  currentFilters: Record<string, string | undefined>;
}

export default function SearchResults({
  vehicles: initialVehicles,
  total,
  currentFilters,
}: SearchResultsProps) {
  const [vehicleList, setVehicleList] = useState<Vehicle[]>(initialVehicles);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialVehicles.length < total);
  const [error, setError] = useState<string | null>(null);

  // Reset list when filters/initial props change
  useEffect(() => {
    setVehicleList(initialVehicles);
    setPage(1);
    setHasMore(initialVehicles.length < total);
    setError(null);
  }, [initialVehicles, total]);

  const loadMoreVehicles = async () => {
    setIsLoading(true);
    setError(null);
    const nextPage = page + 1;

    try {
      // Construct body for API call
      const body = {
        ...currentFilters,
        page: nextPage.toString(),
        // Convert filters to appropriate types
        min_price: currentFilters.minPrice ? parseFloat(currentFilters.minPrice) : null,
        max_price: currentFilters.maxPrice ? parseFloat(currentFilters.maxPrice) : null,
        min_year: currentFilters.minYear ? parseInt(currentFilters.minYear) : null,
        max_year: currentFilters.maxYear ? parseInt(currentFilters.maxYear) : null,
        user_lat: currentFilters.lat ? parseFloat(currentFilters.lat) : null,
        user_lon: currentFilters.lon ? parseFloat(currentFilters.lon) : null,
        make: currentFilters.make || null,
        model: currentFilters.model || null,
        condition: currentFilters.condition || null,
        body_style: currentFilters.bodyStyle || null,
        sort_by: currentFilters.sortBy || 'relevance',
        limit: 24,
        offset: (nextPage - 1) * 24,
      };

      const response = await fetch("/api/search-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        setError("Too many requests. Please try again in a moment.");
        return;
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const { data } = await response.json();
      
      if (data && data.length > 0) {
        // Apply diversification before appending to ensure local variety
        const diversifiedData = diversifyByDealer(data, data.length);
        
        setVehicleList((prev) => [...prev, ...diversifiedData]);
        setPage(nextPage);
        if (data.length < 24) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error loading more vehicles:", error);
      }
      setError("Failed to load more vehicles. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (vehicleList.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-border p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">No vehicles found</h3>
        <p className="text-gray-500 mb-6">Try adjusting your filters.</p>
        <Button
          onClick={() => window.location.href = '/search'}
          className="bg-trust-blue text-white hover:brightness-90 active:scale-98"
        >
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Sort Controls - Desktop Only (Mobile uses FilterSidebar sticky) */}
      <div className="hidden lg:flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold">{vehicleList.length}</span> of{" "}
          <span className="font-semibold">{total.toLocaleString()}</span> vehicles
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={currentFilters.sortBy || "relevance"}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              params.set("sortBy", e.target.value);
              window.location.search = params.toString();
            }}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 cursor-pointer"
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="year_desc">Year: Newest First</option>
            <option value="year_asc">Year: Oldest First</option>
            <option value="mileage_asc">Mileage: Low to High</option>
            <option value="mileage_desc">Mileage: High to Low</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8" role="feed" aria-busy={isLoading}>
        {vehicleList.map((vehicle) => (
          <div key={vehicle.id} role="article">
            <VehicleCard vehicle={vehicle} />
          </div>
        ))}
      </div>

      {/* ARIA Live Region for Status Updates */}
      <div role="status" aria-live="polite" className="sr-only">
        {isLoading && "Loading more vehicles..."}
        {!isLoading && hasMore && `Loaded ${vehicleList.length} of ${total} vehicles`}
        {error && `Error: ${error}`}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 text-center">
          {error && (
            <p className="text-red-500 mb-4 text-sm">{error}</p>
          )}
          <button
            onClick={loadMoreVehicles}
            disabled={isLoading}
            className="w-full md:w-auto px-8 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer active:scale-98 transition-transform"
          >
            {isLoading ? "Loading..." : "Load More Vehicles"}
          </button>
        </div>
      )}
      
      <p className="text-center text-xs text-gray-400 mt-4">
        Showing {vehicleList.length} of {total.toLocaleString()} vehicles
      </p>
    </div>
  );
}
