'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Car, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

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
            <Button asChild variant="brand">
              <Link href="/search">
                Browse All Vehicles
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/" className="gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
