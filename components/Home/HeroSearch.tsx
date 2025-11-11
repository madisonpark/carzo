'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import ZipCodeInput from '@/components/Location/ZipCodeInput';

export default function HeroSearch() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Main Search Bar */}
      <Link
        href="/search"
        className="flex items-center gap-4 bg-white text-slate-900 px-6 py-5 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 group"
      >
        <Search className="w-6 h-6 text-slate-400 group-hover:text-blue-600 transition-colors" />
        <span className="flex-1 text-left text-lg text-slate-600">
          Search by make, model, or type...
        </span>
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
          Search
        </button>
      </Link>

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
