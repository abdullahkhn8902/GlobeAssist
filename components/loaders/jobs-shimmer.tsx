"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function JobsShimmer() {
  return (
    <div className="min-h-screen lg:h-screen bg-slate-200 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
      {/* Left Section - Jobs Grid */}
      <div className="flex-1 min-h-0 lg:overflow-y-auto p-4 lg:p-6 scrollbar-hide order-2 lg:order-1">
        {/* Back Button */}
        <div className="hidden lg:block mb-4 h-5 w-32">
          <Skeleton className="h-full w-full" />
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Section - Country Info Panel */}
      <div className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 p-4 lg:py-6 lg:pr-6 lg:pl-0 order-1 lg:order-2">
        <div className="bg-white rounded-xl lg:rounded-2xl overflow-hidden lg:h-full flex flex-col shadow-lg">
          {/* Mobile Back Button */}
          <div className="flex lg:hidden items-center gap-2 p-4 h-10">
            <Skeleton className="h-5 w-32" />
          </div>

          {/* Country Image */}
          <div className="relative h-40 lg:h-48 overflow-hidden flex-shrink-0">
            <Skeleton className="w-full h-full" />
          </div>

          {/* Country Info */}
          <div className="p-4 lg:p-5 flex flex-col flex-1 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />

            <div className="space-y-2">
              <Skeleton className="h-6 w-1/2" />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
