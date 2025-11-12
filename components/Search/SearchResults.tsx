'use client';

import { Vehicle } from '@/lib/supabase';
import VehicleCard from './VehicleCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResultsProps {
  vehicles: Vehicle[];
  total: number;
  page: number;
  totalPages: number;
  currentFilters: Record<string, string | undefined>;
}

export default function SearchResults({
  vehicles,
  total,
  page,
  totalPages,
  currentFilters,
}: SearchResultsProps) {
  const router = useRouter();
  // Only consider actual user-selectable filters (not location, page, or default sort)
  const filterKeys = ['make', 'model', 'condition', 'bodyStyle', 'minPrice', 'maxPrice', 'minYear', 'maxYear'];
  const hasActiveFilters = filterKeys.some(key => currentFilters[key]);
  const currentSort = currentFilters.sortBy || 'relevance';

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    // Flow parameter automatically preserved
    router.push(`/search?${params.toString()}`);
  };

  const updateSort = (sortBy: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('sortBy', sortBy);
    params.delete('page'); // Reset to page 1 when sorting
    // Flow parameter automatically preserved
    router.push(`/search?${params.toString()}`);
  };

  if (vehicles.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        {/* Empty State Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
          <svg
            className="w-10 h-10 text-slate-400"
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

        {/* Message */}
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          No vehicles found
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          We couldn&apos;t find any vehicles matching your search criteria. Try adjusting your filters
          or browse all available vehicles.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              const flow = params.get('flow');
              router.push(flow ? `/search?flow=${flow}` : '/search');
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            View All Vehicles
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                const flow = params.get('flow');
                router.push(flow ? `/search?flow=${flow}` : '/search');
              }}
              className="px-6 py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold">{vehicles.length}</span> of{' '}
          <span className="font-semibold">{total.toLocaleString()}</span> vehicles
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-slate-700">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={currentSort}
            onChange={(e) => updateSort(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium ${
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Results Summary */}
      <p className="text-center text-sm text-slate-600 mt-6">
        Showing {(page - 1) * 24 + 1}-{Math.min(page * 24, total)} of {total.toLocaleString()}{' '}
        vehicles
      </p>
    </div>
  );
}
