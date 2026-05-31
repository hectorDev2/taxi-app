import { SkeletonMap, SkeletonLine } from "@/components/skeleton";

export default function NuevaSolicitudLoading() {
  return (
    <div>
      {/* Back button + title skeleton */}
      <div className="flex items-center gap-4 px-8 py-4 border-b border-gray-200 bg-white">
        <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
        <SkeletonLine width="160px" />
      </div>

      <div className="p-8 max-w-2xl space-y-6">
        {/* Datos del Pasajero section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <SkeletonLine width="140px" />
          <div className="space-y-2">
            <SkeletonLine width="160px" />
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2">
            <SkeletonLine width="120px" />
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Punto de Recojo section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <SkeletonLine width="140px" />
          <div className="space-y-2">
            <SkeletonLine width="180px" />
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2">
            <SkeletonLine width="100px" />
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div>
            <SkeletonLine width="200px" />
            <div className="mt-2">
              <SkeletonMap />
            </div>
          </div>
        </div>

        {/* Tipo de Servicio section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <SkeletonLine width="130px" />
          <div className="flex gap-4">
            <div className="flex-1 h-12 bg-gray-100 rounded-lg animate-pulse" />
            <div className="flex-1 h-12 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <div className="h-11 w-28 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-11 w-36 bg-yellow-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
