"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function AccommodationsShimmer() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-4">
          <Skeleton className="h-5 w-32 bg-primary/50" />
          <Skeleton className="h-12 w-3/4 bg-primary/50" />
          <Skeleton className="h-6 w-5/6 bg-primary/50" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-20 relative z-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>

        {/* Important Notice */}
        <div className="mt-8 bg-accent/50 border-l-4 border-primary rounded-lg p-6 space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Accommodation Cards */}
        <div className="mt-12 space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-7 w-7 rounded" />
            <Skeleton className="h-8 w-1/3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm space-y-4 p-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
