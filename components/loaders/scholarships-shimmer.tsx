"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function ScholarshipsShimmer() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48 bg-blue-500" />
          <Skeleton className="h-12 w-3/4 bg-blue-500" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 bg-blue-500" />
            <Skeleton className="h-10 w-32 bg-blue-500" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Filter Bar */}
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Scholarship Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
