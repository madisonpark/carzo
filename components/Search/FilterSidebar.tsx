"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { Input, Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { FilterControls } from "./FilterControls";
import * as gtag from "@/lib/google-analytics";

interface FilterSidebarProps {
  makes: string[];
  bodyStyles: string[];
  conditions: string[];
  years: number[];
  currentFilters: {
    make?: string;
    model?: string;
    condition?: string;
    minPrice?: string;
    maxPrice?: string;
    minYear?: string;
    maxYear?: string;
    bodyStyle?: string;
    sortBy?: string;
  };
}

const ActiveFilterBadge = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <Badge variant="secondary" className="gap-1 rounded-full">
    {label}
    <Button
      onClick={onRemove}
      variant="ghost"
      size="icon"
      className="hover:bg-gray-100 rounded-full h-4 w-4"
      aria-label={`Remove ${label} filter`}
    >
      <X className="w-3 h-3" />
    </Button>
  </Badge>
);

export default function FilterSidebar({
  makes,
  bodyStyles,
  conditions,
  years,
  currentFilters,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || "");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsMobileDrawerOpen(false);
      };
      window.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isMobileDrawerOpen]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
        
        // Map URL keys to GA filter types
        const filterTypeMap: Record<string, 'make' | 'model' | 'body_style' | 'condition' | 'price' | 'year' | 'sort'> = {
          make: 'make',
          model: 'model',
          bodyStyle: 'body_style',
          condition: 'condition',
          minPrice: 'price',
          maxPrice: 'price',
          minYear: 'year',
          maxYear: 'year',
          sortBy: 'sort'
        };

        // Track filter change if it's a tracked filter type
        if (key in filterTypeMap) {
          gtag.trackFilterChange({
            filterType: filterTypeMap[key],
            filterValue: value,
          });
        }
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset pagination
      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams]
  );

  const updateSort = (sortBy: string) => {
    updateFilter("sortBy", sortBy);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (minPrice !== (currentFilters.minPrice || "")) {
        updateFilter("minPrice", minPrice);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [minPrice, currentFilters.minPrice, updateFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (maxPrice !== (currentFilters.maxPrice || "")) {
        updateFilter("maxPrice", maxPrice);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [maxPrice, currentFilters.maxPrice, updateFilter]);

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    const flow = params.get("flow");
    router.push(flow ? `/search?flow=${flow}` : "/search");
  };

  const hasActiveFilters = Object.keys(currentFilters).some(
    (key) => key !== "sortBy" && key !== "page" && key !== "lat" && key !== "lon" && currentFilters[key as keyof typeof currentFilters]
  );

  // Prepare shared props for FilterControls
  const filterControlProps = {
    makes,
    bodyStyles,
    conditions,
    years,
    currentFilters,
    updateFilter,
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
  };

  return (
    <>
      {/* Mobile Sticky Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-background border-b p-3 flex gap-2 items-center shadow-sm">
        <Button
          onClick={() => setIsMobileDrawerOpen(true)}
          variant="outline"
          className="flex-1 gap-2 bg-white border-gray-300 text-trust-text font-medium"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && <div className="w-2 h-2 bg-trust-blue rounded-full" />}
        </Button>
        
        <div className="flex-1 relative">
          <select
            value={currentFilters.sortBy || "relevance"}
            onChange={(e) => updateSort(e.target.value)}
            aria-label="Sort vehicles"
            className="w-full appearance-none bg-white border border-gray-300 text-trust-text py-2 px-3 pr-8 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-trust-blue focus:border-trust-blue text-sm h-10 cursor-pointer"
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price_asc">Sort: Price Low-High</option>
            <option value="price_desc">Sort: Price High-Low</option>
            <option value="year_desc">Sort: Newest</option>
            <option value="mileage_asc">Sort: Lowest Mileage</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 w-full max-w-xs bg-white z-50 overflow-y-auto transition-transform duration-300 ease-in-out shadow-2xl",
          isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-trust-text">Filters</h2>
          <Button
            onClick={() => setIsMobileDrawerOpen(false)}
            variant="ghost"
            size="icon"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 space-y-6">
          <FilterControls {...filterControlProps} />

          {hasActiveFilters && (
            <Button 
              onClick={clearFilters} 
              className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block bg-white rounded-lg border border-border p-6 sticky top-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-trust-text">Filters</h2>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-xs text-trust-blue font-semibold hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        
        <FilterControls {...filterControlProps} />
      </div>
    </>
  );
}
