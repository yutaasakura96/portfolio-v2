export default function AboutLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      {/* Header skeleton */}
      <div className="mb-12">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-6 w-96 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Skills section skeleton */}
      <div className="mb-16">
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience section skeleton */}
      <div className="mb-16">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative pl-8">
              <div className="absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full bg-gray-200 animate-pulse" />
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                    <div className="h-16 w-full bg-gray-50 rounded animate-pulse mt-3" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
