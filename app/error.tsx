'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-error/10 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-error" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Oops! Something Went Wrong
          </h1>

          {/* Message */}
          <p className="text-slate-600 mb-6">
            We encountered an unexpected error. Please try again or return to the homepage.
          </p>

          {/* Error details (only in development) */}
          {process.env.NODE_ENV === 'development' && error.digest && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg text-left">
              <p className="text-xs font-mono text-slate-500">
                Error Digest: {error.digest}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white font-semibold rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>

        {/* Support hint */}
        <p className="text-center text-sm text-slate-500 mt-6">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
