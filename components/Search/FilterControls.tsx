"use client";

import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

interface FilterInputsProps {
  makes: string[];
  conditions: string[];
  bodyStyles: string[];
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
  };
  updateFilter: (key: string, value: string) => void;
  minPrice: string;
  maxPrice: string;
  setMinPrice: (val: string) => void;
  setMaxPrice: (val: string) => void;
}

export function FilterControls({
  makes,
  conditions,
  bodyStyles,
  years,
  currentFilters,
  updateFilter,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
}: FilterInputsProps) {
  return (
    <div className="space-y-6">
      {/* Make */}
      <div>
        <label className="block text-sm font-semibold text-trust-text mb-2">Make</label>
        <select
          value={currentFilters.make || ""}
          onChange={(e) => updateFilter("make", e.target.value)}
          className="w-full p-2 border border-border rounded-md text-sm bg-white text-trust-text cursor-pointer"
          aria-label="Filter by Make"
        >
          <option value="">All Makes</option>
          {makes.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-trust-text mb-2">Price Range</label>
        <div className="grid grid-cols-2 gap-2">
          <Input 
            type="number" 
            placeholder="Min" 
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="text-sm bg-white"
            aria-label="Minimum Price"
          />
          <Input 
            type="number" 
            placeholder="Max" 
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="text-sm bg-white"
            aria-label="Maximum Price"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-semibold text-trust-text mb-2">Condition</label>
        <select
          value={currentFilters.condition || ""}
          onChange={(e) => updateFilter("condition", e.target.value)}
          className="w-full p-2 border border-border rounded-md text-sm bg-white text-trust-text cursor-pointer"
          aria-label="Filter by Condition"
        >
          <option value="">Any</option>
          {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Body Style */}
      <div>
        <label className="block text-sm font-semibold text-trust-text mb-2">Body Style</label>
        <select
          value={currentFilters.bodyStyle || ""}
          onChange={(e) => updateFilter("bodyStyle", e.target.value)}
          className="w-full p-2 border border-border rounded-md text-sm bg-white text-trust-text cursor-pointer"
          aria-label="Filter by Body Style"
        >
          <option value="">Any</option>
          {bodyStyles.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Year Range */}
      <div>
        <label className="block text-sm font-semibold text-trust-text mb-2">Year</label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={currentFilters.minYear || ""}
            onChange={(e) => updateFilter("minYear", e.target.value)}
            className="w-full p-2 border border-border rounded-md text-sm bg-white text-trust-text cursor-pointer"
            aria-label="Minimum Year"
          >
            <option value="">Min</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={currentFilters.maxYear || ""}
            onChange={(e) => updateFilter("maxYear", e.target.value)}
            className="w-full p-2 border border-border rounded-md text-sm bg-white text-trust-text cursor-pointer"
            aria-label="Maximum Year"
          >
            <option value="">Max</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}