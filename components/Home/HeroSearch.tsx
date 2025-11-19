'use client';

import { useState, FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ZipCodeInput from '@/components/Location/ZipCodeInput';
import { Button } from '@/components/ui';

export default function HeroSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      // No query, just go to search page
      router.push('/search');
      return;
    }

    // Simple parsing logic: detect if it's likely a make or body style
    const query = searchQuery.trim().toLowerCase();
    const params = new URLSearchParams();

    // Common body styles
    const bodyStyles = ['sedan', 'suv', 'truck', 'coupe', 'wagon', 'van', 'minivan', 'convertible', 'hatchback'];

    if (bodyStyles.includes(query)) {
      params.set('bodyStyle', query);
    } else {
      // Assume it's a make or model - capitalize first letter
      const capitalized = query.charAt(0).toUpperCase() + query.slice(1);
      params.set('make', capitalized);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Main Search Bar */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-background px-4 sm:px-6 py-4 sm:py-5 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 group border border-border/50"
      >
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground group-hover:text-brand transition-colors flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by make, model, or type..."
            className="flex-1 text-base sm:text-lg text-foreground placeholder:text-muted-foreground bg-transparent outline-none"
          />
        </div>
        <Button type="submit" variant="brand" className="w-full sm:w-auto sm:flex-shrink-0">
          Search
        </Button>
      </form>

      {/* Zip Code Input */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-white text-sm">
        <span>or find vehicles near</span>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 w-full sm:w-auto max-w-xs">
          <ZipCodeInput placeholder="Enter zip code" className="text-white w-full" />
        </div>
      </div>
    </div>
  );
}
