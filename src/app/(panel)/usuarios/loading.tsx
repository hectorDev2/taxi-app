import { SkeletonTable } from "@/components/skeleton";

export default function UsuariosLoading() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white">
        <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="p-8">
        {/* Filter bar skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-3">
            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        <SkeletonTable rows={5} />
      </div>
    </div>
  );
}
