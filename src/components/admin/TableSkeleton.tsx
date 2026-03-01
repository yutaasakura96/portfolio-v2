export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-gray-200" />
            <div className="h-3 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="h-4 w-20 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
