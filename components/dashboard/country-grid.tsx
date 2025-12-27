"use client"

import { CountryCard } from "./country-card"
import { AISequenceLoader } from "./ai-sequence-loader"

export interface CountryData {
  name: string
  imageUrl: string
  universities: number
  costOfLivingMin: number
  costOfLivingMax: number
}

interface CountryGridProps {
  countries: CountryData[]
  loading: boolean
  error: string | null
}

export function CountryGrid({ countries, loading, error }: CountryGridProps) {
  if (loading) {
    return <AISequenceLoader type="student" />
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
        <p className="text-slate-400 text-lg">No recommendations available yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
      {countries.map((country) => (
        <CountryCard
          key={country.name}
          name={country.name}
          imageUrl={country.imageUrl}
          universities={country.universities}
          costOfLivingMin={country.costOfLivingMin}
          costOfLivingMax={country.costOfLivingMax}
        />
      ))}
    </div>
  )
}
