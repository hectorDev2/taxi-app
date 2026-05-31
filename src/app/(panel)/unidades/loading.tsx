import { SkeletonCard, SkeletonMap, SkeletonTable } from "@/components/skeleton";

export default function UnidadesLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="p-8">
        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Map section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="h-5 w-36 bg-gray-200 rounded mb-4 animate-pulse" />
          <SkeletonMap />
        </div>

        {/* Filter bar skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <div className="h-10 w-44 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-44 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        <SkeletonTable rows={6} />
      </div>
    </div>
  );
}
