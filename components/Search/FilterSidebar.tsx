"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { Input, Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

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
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || "");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset pagination
      router.push(`/search?${params.toString()}`);
    },
    [router]
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
    router.push("/search");
  };

  const hasActiveFilters = Object.keys(currentFilters).some(
    (key) => key !== "sortBy" && key !== "page" && key !== "lat" && key !== "lon" && currentFilters[key as keyof typeof currentFilters]
  );

  return (
    <>
      {/* Mobile Sticky Header */}
      <div className="lg:hidden sticky top-0 z-30 bg-background border-b p-3 flex gap-2 items-center shadow-sm">
        <Button
          onClick={() => setIsMobileDrawerOpen(true)}
          variant="outline"
          className="flex-1 gap-2 bg-white border-gray-300 text-gray-700 font-medium"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
        </Button>
        
        <div className="flex-1 relative">
          <select
            value={currentFilters.sortBy || "relevance"}
            onChange={(e) => updateSort(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm h-10"
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
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          <Button
            onClick={() => setIsMobileDrawerOpen(false)}
            variant="ghost"
            size="icon"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 space-y-6">
          {/* Filter Content (Duplicated for mobile/desktop separation simplicity) */}
           <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Make</label>
            <select
              value={currentFilters.make || ""}
              onChange={(e) => updateFilter("make", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">All Makes</option>
              {makes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Price Range</label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                placeholder="Min" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="bg-white"
              />
              <Input 
                type="number" 
                placeholder="Max" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          {/* Other Filters... simplified for this refactor to main components */}
           <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Condition</label>
            <select
              value={currentFilters.condition || ""}
              onChange={(e) => updateFilter("condition", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Any</option>
              {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
           <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Body Style</label>
            <select
              value={currentFilters.bodyStyle || ""}
              onChange={(e) => updateFilter("bodyStyle", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md bg-white"
            >
              <option value="">Any</option>
              {bodyStyles.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

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
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Make</label>
            <select
              value={currentFilters.make || ""}
              onChange={(e) => updateFilter("make", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Makes</option>
              {makes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Price</label>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                type="number" 
                placeholder="Min" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="text-sm"
              />
              <Input 
                type="number" 
                placeholder="Max" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

           <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Condition</label>
            <select
              value={currentFilters.condition || ""}
              onChange={(e) => updateFilter("condition", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Any</option>
              {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

           <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Body Style</label>
            <select
              value={currentFilters.bodyStyle || ""}
              onChange={(e) => updateFilter("bodyStyle", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">Any</option>
              {bodyStyles.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}