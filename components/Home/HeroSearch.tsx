'use client';

import { useState, FormEvent } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ZipCodeInput from '@/components/Location/ZipCodeInput';

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
        className="flex items-center gap-4 bg-white text-slate-900 px-6 py-5 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 group"
      >
        <Search className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by make, model, or type..."
          className="flex-1 text-lg text-slate-900 placeholder:text-slate-500 bg-transparent outline-none"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Zip Code Input */}
      <div className="flex items-center justify-center gap-3 text-white">
        <span className="text-sm">or find vehicles near</span>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
          <ZipCodeInput placeholder="Enter zip code" className="text-white" />
        </div>
      </div>
    </div>
  );
}
