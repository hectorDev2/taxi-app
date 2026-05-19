export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
      <div className="h-8 w-16 bg-gray-200 rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3 flex gap-8">
        {[120, 160, 200, 100, 100, 80].map((w, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded" style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-gray-100 px-6 py-4 flex gap-8">
          {[100, 140, 120, 80, 80, 60].map((w, j) => (
            <div key={j} className="h-4 bg-gray-100 rounded" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonMap() {
  return <div className="bg-gray-100 rounded-lg h-[350px] animate-pulse" />;
}

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width }} />;
}
