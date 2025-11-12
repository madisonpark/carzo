'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, SlidersHorizontal } from 'lucide-react';
import { Input, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

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
  };
}

// Extracted reusable active filter badge component
const ActiveFilterBadge = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <Badge variant="secondary" className="gap-1 rounded-full text-brand">
    {label}
    <Button
      onClick={onRemove}
      variant="ghost"
      size="icon"
      className="hover:bg-slate-300 rounded-full"
      aria-label={`Remove ${label} filter`}
    >
      <X className="w-3 h-3" />
    </Button>
  </Badge>
);

// Filter content component extracted to avoid React anti-pattern
const FilterContent = ({
  currentFilters,
  isUpdating,
  updateFilter,
  clearFilters,
  hasActiveFilters,
  makes,
  conditions,
  bodyStyles,
  years,
  minPrice,
  maxPrice,
  handleMinPriceChange,
  handleMaxPriceChange,
}: {
  currentFilters: FilterSidebarProps['currentFilters'];
  isUpdating: boolean;
  updateFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  makes: string[];
  conditions: string[];
  bodyStyles: string[];
  years: number[];
  minPrice: string;
  maxPrice: string;
  handleMinPriceChange: (value: string) => void;
  handleMaxPriceChange: (value: string) => void;
}) => (
  <>
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-900">Filters</h2>
        {isUpdating && (
          <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
      {hasActiveFilters && (
        <Button
          onClick={clearFilters}
          variant="ghost"
          size="sm"
          aria-label="Clear all filters"
        >
          <X className="w-4 h-4" />
          Clear
        </Button>
      )}
    </div>

    <div className="space-y-6">
      {/* Make */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Make</label>
        <select
          value={currentFilters.make || ''}
          onChange={(e) => updateFilter('make', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Makes</option>
          {makes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Condition</label>
        <select
          value={currentFilters.condition || ''}
          onChange={(e) => updateFilter('condition', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Conditions</option>
          {conditions.map((condition) => (
            <option key={condition} value={condition}>
              {condition}
            </option>
          ))}
        </select>
      </div>

      {/* Body Style */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Body Style</label>
        <select
          value={currentFilters.bodyStyle || ''}
          onChange={(e) => updateFilter('bodyStyle', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Body Styles</option>
          {bodyStyles.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>

      {/* Year Range */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Year</label>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={currentFilters.minYear || ''}
            onChange={(e) => updateFilter('minYear', e.target.value)}
            aria-label="Minimum year"
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Min</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={currentFilters.maxYear || ''}
            onChange={(e) => updateFilter('maxYear', e.target.value)}
            aria-label="Maximum year"
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Max</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Price</label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => handleMinPriceChange(e.target.value)}
            aria-label="Minimum price"
            className="text-sm py-2"
          />
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => handleMaxPriceChange(e.target.value)}
            aria-label="Maximum price"
            className="text-sm py-2"
          />
        </div>
      </div>
    </div>

    {/* Active Filters */}
    {hasActiveFilters && (
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Active Filters</h3>
        <div className="flex flex-wrap gap-2">
          {currentFilters.make && (
            <ActiveFilterBadge
              label={currentFilters.make}
              onRemove={() => updateFilter('make', '')}
            />
          )}
          {currentFilters.condition && (
            <ActiveFilterBadge
              label={currentFilters.condition}
              onRemove={() => updateFilter('condition', '')}
            />
          )}
          {currentFilters.bodyStyle && (
            <ActiveFilterBadge
              label={currentFilters.bodyStyle}
              onRemove={() => updateFilter('bodyStyle', '')}
            />
          )}
        </div>
      </div>
    )}
  </>
);

export default function FilterSidebar({
  makes,
  bodyStyles,
  conditions,
  years,
  currentFilters,
}: FilterSidebarProps) {
  const router = useRouter();
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);

    // Update or delete the changed filter
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset to page 1 when filtering
    params.delete('page');

    // Flow parameter is automatically preserved since we're using window.location.search
    router.push(`/search?${params.toString()}`);
  }, [router]);

  // Debounce minPrice updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (minPrice !== (currentFilters.minPrice || '')) {
        updateFilter('minPrice', minPrice);
        setIsUpdating(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [minPrice, currentFilters.minPrice, updateFilter]);

  // Debounce maxPrice updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (maxPrice !== (currentFilters.maxPrice || '')) {
        updateFilter('maxPrice', maxPrice);
        setIsUpdating(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [maxPrice, currentFilters.maxPrice, updateFilter]);

  // Handle price input changes
  const handleMinPriceChange = (value: string) => {
    setMinPrice(value);
    setIsUpdating(true);
  };

  const handleMaxPriceChange = (value: string) => {
    setMaxPrice(value);
    setIsUpdating(true);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(window.location.search);
    const flow = params.get('flow');

    // Clear all filters but preserve flow
    if (flow) {
      router.push(`/search?flow=${flow}`);
    } else {
      router.push('/search');
    }
  };

  const hasActiveFilters = Object.keys(currentFilters).length > 0;
  const activeFilterCount = [
    currentFilters.make,
    currentFilters.model,
    currentFilters.condition,
    currentFilters.bodyStyle,
    currentFilters.minPrice,
    currentFilters.maxPrice,
    currentFilters.minYear,
    currentFilters.maxYear,
  ].filter(Boolean).length;

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.classList.add('overflow-hidden');
      return () => {
        document.body.classList.remove('overflow-hidden');
      };
    }
  }, [isMobileDrawerOpen]);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileDrawerOpen]);

  // Props for FilterContent component
  const filterContentProps = {
    currentFilters,
    isUpdating,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    makes,
    conditions,
    bodyStyles,
    years,
    minPrice,
    maxPrice,
    handleMinPriceChange,
    handleMaxPriceChange,
  };

  return (
    <>
      {/* Mobile Filter Button - Fixed at bottom on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg p-4">
        <Button
          onClick={() => setIsMobileDrawerOpen(true)}
          variant="brand"
          className="w-full gap-2"
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-white text-brand">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in"
          onClick={() => setIsMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 bottom-0 w-full max-w-sm bg-white z-[60] overflow-y-auto transform duration-300 ease-in-out shadow-2xl',
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ transition: 'transform 300ms ease-in-out' }}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Filters</h2>
          <Button
            onClick={() => setIsMobileDrawerOpen(false)}
            variant="ghost"
            size="icon"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6">
          <FilterContent {...filterContentProps} />
        </div>
      </div>

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 p-6 sticky top-8">
        <FilterContent {...filterContentProps} />
      </div>
    </>
  );
}
