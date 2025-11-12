export default function VehicleLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="bg-slate-900 text-white py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-4 w-32 bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Skeleton */}
            <div className="space-y-3">
              <div className="h-8 bg-slate-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-6 bg-slate-200 rounded w-1/2 animate-pulse"></div>
            </div>

            {/* Badge Skeleton */}
            <div className="h-6 w-40 bg-blue-100 rounded-full animate-pulse"></div>

            {/* Photo Gallery Skeleton */}
            <div className="bg-slate-50 rounded-xl p-8 space-y-4">
              <div className="h-7 bg-slate-200 rounded w-48 animate-pulse"></div>

              {/* Main Image Skeleton */}
              <div className="aspect-video bg-slate-200 rounded-lg animate-pulse"></div>

              {/* Thumbnails Grid Skeleton */}
              <div className="grid grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-video bg-slate-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>

              {/* CTA Button Skeleton */}
              <div className="h-14 bg-slate-200 rounded-lg animate-pulse"></div>
            </div>

            {/* Details Section Skeleton */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="h-6 bg-slate-200 rounded w-32 animate-pulse mb-4"></div>

              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="h-6 bg-slate-200 rounded w-32 animate-pulse mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>

          {/* Sidebar - Right Column (1/3 width) */}
          <div className="space-y-6">
            {/* Price Card Skeleton */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-6 space-y-4 sticky top-4">
              <div className="h-10 bg-slate-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>

              {/* CTA Buttons Skeleton */}
              <div className="space-y-3 pt-4">
                <div className="h-12 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-slate-200 rounded-lg animate-pulse"></div>
              </div>
            </div>

            {/* Dealer Info Skeleton */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
              <div className="h-6 bg-slate-200 rounded w-32 animate-pulse mb-4"></div>
              <div className="h-5 bg-slate-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
