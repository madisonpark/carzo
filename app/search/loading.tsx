export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-fade-in">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="h-9 w-48 bg-slate-200 rounded animate-skeleton-pulse"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar Skeleton */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              {/* Location Filter Skeleton */}
              <div>
                <div className="h-5 w-24 bg-slate-200 rounded animate-skeleton-pulse mb-3"></div>
                <div className="h-10 bg-slate-100 rounded animate-skeleton-pulse"></div>
              </div>

              {/* Make Filter Skeleton */}
              <div>
                <div className="h-5 w-16 bg-slate-200 rounded animate-skeleton-pulse mb-3"></div>
                <div className="h-10 bg-slate-100 rounded animate-skeleton-pulse"></div>
              </div>

              {/* Model Filter Skeleton */}
              <div>
                <div className="h-5 w-20 bg-slate-200 rounded animate-skeleton-pulse mb-3"></div>
                <div className="h-10 bg-slate-100 rounded animate-skeleton-pulse"></div>
              </div>

              {/* Price Range Skeleton */}
              <div>
                <div className="h-5 w-28 bg-slate-200 rounded animate-skeleton-pulse mb-3"></div>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 bg-slate-100 rounded animate-skeleton-pulse"></div>
                  <div className="flex-1 h-10 bg-slate-100 rounded animate-skeleton-pulse"></div>
                </div>
              </div>

              {/* More Filters */}
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-5 w-32 bg-slate-200 rounded animate-skeleton-pulse mb-3"></div>
                  <div className="h-10 bg-slate-100 rounded animate-skeleton-pulse"></div>
                </div>
              ))}
            </div>
          </aside>

          {/* Results Skeleton */}
          <main className="flex-1">
            {/* Results Count Skeleton */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-48 bg-slate-200 rounded animate-skeleton-pulse"></div>
              <div className="h-10 w-32 bg-slate-200 rounded animate-skeleton-pulse"></div>
            </div>

            {/* Vehicle Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden animate-skeleton-pulse"
                >
                  {/* Image Skeleton */}
                  <div className="h-48 bg-slate-200"></div>

                  {/* Content Skeleton */}
                  <div className="p-4 space-y-3">
                    {/* Title */}
                    <div className="space-y-2">
                      <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>

                    {/* Price */}
                    <div className="h-7 bg-slate-200 rounded w-1/3"></div>

                    {/* Details */}
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>

                    {/* Location */}
                    <div className="h-4 bg-slate-200 rounded w-full"></div>

                    {/* CTA Button */}
                    <div className="h-12 bg-slate-200 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex justify-center gap-2 mt-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 bg-slate-200 rounded animate-skeleton-pulse"
                ></div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
