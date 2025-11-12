'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Car, Home, ArrowLeft } from 'lucide-react';

export default function VehicleError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Vehicle page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-900 text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link href="/search" className="inline-flex items-center gap-2 text-sm hover:text-brand transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
        </div>
      </div>

      {/* Error Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-error/10 rounded-full mb-6">
            <Car className="w-8 h-8 text-error" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Unable to Load Vehicle
          </h1>

          {/* Message */}
          <p className="text-lg text-slate-600 mb-8">
            We&apos;re having trouble loading this vehicle&apos;s information. It may no longer be available.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Link
              href="/search"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg transition-colors"
            >
              Browse All Vehicles
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
