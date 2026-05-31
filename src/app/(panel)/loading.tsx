import { SkeletonCard, SkeletonMap, SkeletonTable, SkeletonLine } from "@/components/skeleton";

export default function PanelLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <SkeletonLine width="180px" />
      </div>

      <div className="p-8">
        {/* Stats cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Map + Recent requests */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-pulse" />
            <SkeletonMap />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-5 w-44 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="space-y-1.5">
                    <SkeletonLine width="120px" />
                    <SkeletonLine width="180px" />
                  </div>
                  <SkeletonLine width="70px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
