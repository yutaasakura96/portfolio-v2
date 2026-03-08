export default function AboutLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-6 w-96 bg-gray-100 rounded animate-pulse" />
      </div>

      {/* Profile section */}
      <div className="mb-16 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-12 md:gap-16">
        {/* Left: profile card */}
        <div className="flex flex-col items-center text-center">
          <div className="w-44 h-44 rounded-full bg-gray-200 animate-pulse mb-6" />
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
          <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-5" />
          <div className="flex gap-5">
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Right: intro content */}
        <div>
          <div className="h-8 w-72 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="space-y-4 max-w-2xl">
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Skills section */}
      <section className="mb-16">
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Experience section */}
      <section className="mb-16">
        <div className="h-8 w-28 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-0">
          {[1, 2, 3].map((i, index) => (
            <div key={i} className="relative pl-8 pb-8 last:pb-0">
              {/* Timeline line */}
              {index < 2 && (
                <div className="absolute left-[11px] top-3 bottom-0 w-px bg-gray-200" />
              )}
              {/* Timeline dot */}
              <div className="absolute left-0 top-1.5 h-[22px] w-[22px] rounded-full border-2 border-gray-200 bg-white animate-pulse" />
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 shrink-0 bg-gray-100 rounded-lg animate-pulse" />
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
      </section>

      {/* Education section */}
      <section className="mb-16">
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 bg-white"
            >
              <div className="shrink-0 h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications section */}
      <section className="mb-16">
        <div className="h-8 w-36 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 bg-white"
            >
              <div className="shrink-0 h-10 w-10 rounded-lg bg-amber-50 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
