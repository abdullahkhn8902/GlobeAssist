"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function UniversityShimmer() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-10 w-full bg-slate-600" />
          <Skeleton className="h-8 w-3/4 bg-slate-600" />
          <Skeleton className="h-6 w-5/6 bg-slate-600" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Tabs/Navigation */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded flex-shrink-0" />
          ))}
        </div>

        {/* Program Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
