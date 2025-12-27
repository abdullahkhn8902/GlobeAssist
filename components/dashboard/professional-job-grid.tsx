"use client"

import { ProfessionalJobCard } from "./professional-job-card"
import { AISequenceLoader } from "./ai-sequence-loader"

export interface ProfessionalCountryData {
  name: string
  imageUrl: string
  jobCount: number
  costOfLivingMin: number
  costOfLivingMax: number
}

interface ProfessionalJobGridProps {
  countries: ProfessionalCountryData[]
  loading: boolean
  error: string | null
}

export function ProfessionalJobGrid({ countries, loading, error }: ProfessionalJobGridProps) {
  if (loading) {
    return <AISequenceLoader type="professional" />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-400 text-lg mb-2">Something went wrong</p>
        <p className="text-slate-500 text-sm">{error}</p>
      </div>
    )
  }

  if (countries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-slate-400 text-lg">No job recommendations available yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
      {countries.map((country) => (
        <ProfessionalJobCard
          key={country.name}
          name={country.name}
          imageUrl={country.imageUrl}
          jobCount={country.jobCount}
          costOfLivingMin={country.costOfLivingMin}
          costOfLivingMax={country.costOfLivingMax}
        />
      ))}
    </div>
  )
}
