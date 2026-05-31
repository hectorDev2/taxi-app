import { SkeletonLine } from "@/components/skeleton";

export default function ConfiguracionLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="p-8 space-y-6">
        {/* Tarifas section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-5 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonLine width="140px" />
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Tipos de Unidad section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-5 w-36 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* Preferencias section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-5 w-44 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <SkeletonLine width="200px" />
                  <SkeletonLine width="280px" />
                </div>
                <div className="h-10 w-36 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <div className="h-11 w-44 bg-yellow-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
