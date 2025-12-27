"use client"

interface ShimmerLoaderProps {
  message?: string
  subMessage?: string
  type?: "minimal" | "cards" | "full"
}

export function ShimmerLoader({
  message = "Loading...",
  subMessage = "Please wait while we fetch your data",
  type = "minimal",
}: ShimmerLoaderProps) {
  if (type === "minimal") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-slate-700 border-r-transparent mb-4" />
          <p className="text-slate-600 text-base">{message}</p>
          <p className="text-slate-500 text-sm mt-2">{subMessage}</p>
        </div>
      </div>
    )
  }

  if (type === "cards") {
    return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header shimmer */}
          <div className="mb-8">
            <div className="h-8 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 animate-shimmer rounded w-1/3 mb-2" />
            <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-300 animate-shimmer rounded w-1/2" />
          </div>

          {/* Cards grid shimmer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-slate-200 rounded-lg overflow-hidden shadow-sm"
                style={{
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "1.5s",
                }}
              >
                {/* Image shimmer */}
                <div className="h-40 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer" />

                {/* Content shimmer */}
                <div className="p-4 space-y-3">
                  <div
                    className="h-6 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer rounded"
                    style={{ width: "70%" }}
                  />
                  <div
                    className="h-4 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer rounded"
                    style={{ width: "90%" }}
                  />
                  <div
                    className="h-4 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer rounded"
                    style={{ width: "60%" }}
                  />
                  <div className="flex gap-2 mt-4">
                    <div className="h-8 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer rounded flex-1" />
                    <div className="h-8 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer rounded flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Full page shimmer */}
        <div className="space-y-6">
          {/* Header section */}
          <div className="space-y-3">
            <div className="h-10 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer rounded w-3/4" />
            <div className="h-6 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer rounded w-full" />
            <div className="h-4 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer rounded w-5/6" />
          </div>

          {/* Content sections */}
          {[1, 2, 3].map((section) => (
            <div key={section} className="space-y-4 pt-4 border-t border-slate-300">
              <div className="h-8 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer rounded w-1/3" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((line) => (
                  <div
                    key={line}
                    className="h-4 bg-gradient-to-r from-slate-300 via-slate-250 to-slate-300 animate-shimmer rounded"
                    style={{ width: `${100 - Math.random() * 20}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
