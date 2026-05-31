import { SkeletonCard, SkeletonMap, SkeletonLine } from "@/components/skeleton";

export default function DriverDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
          <div className="space-y-1.5">
            <SkeletonLine width="120px" />
            <SkeletonLine width="80px" />
          </div>
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded-full animate-pulse" />
      </div>

      <div className="p-4 space-y-4 max-w-xl mx-auto">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="w-7 h-7 bg-gray-200 rounded-lg" />
            </div>
            <div className="h-7 w-10 bg-gray-200 rounded" />
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Trip card skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="h-5 w-20 bg-gray-200 rounded" />
              <div className="h-5 w-24 bg-gray-200 rounded-full" />
            </div>
            {/* Progress bar skeleton */}
            <div className="flex items-center gap-1 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-1 bg-gray-200 rounded" />
                  <div className="w-5 h-5 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="px-5 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <SkeletonLine width="50px" />
                <SkeletonLine width="100px" />
              </div>
              <div className="space-y-1.5">
                <SkeletonLine width="50px" />
                <SkeletonLine width="120px" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <SkeletonLine width="40px" />
                <SkeletonLine width="200px" />
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="mx-5 mb-4">
            <SkeletonMap />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 px-5 pb-5">
            <div className="flex-1 h-11 bg-green-200 rounded-lg" />
            <div className="w-11 h-11 bg-red-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
