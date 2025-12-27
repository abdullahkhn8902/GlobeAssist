"use client"

import { useEffect, useState } from "react"
import { CountryGrid, type CountryData } from "@/components/dashboard/country-grid"
import { ProfessionalJobGrid, type ProfessionalCountryData } from "@/components/dashboard/professional-job-grid"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { AISequenceLoader } from "@/components/dashboard/ai-sequence-loader"

export default function DashboardHome() {
  const [countries, setCountries] = useState<CountryData[]>([])
  const [jobCountries, setJobCountries] = useState<ProfessionalCountryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCached, setIsCached] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [profileType, setProfileType] = useState<string | null>(null)

  useEffect(() => {
    async function detectProfileType() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("profile_type")
          .eq("user_id", user.id)
          .single()

        if (userProfile) {
          setProfileType(userProfile.profile_type)
        }
      }
    }

    detectProfileType()
  }, [])

  async function fetchRecommendations() {
    if (!profileType) return

    try {
      setLoading(true)
      setError(null)

      // Use different API endpoints based on profile type
      const apiEndpoint = profileType === "professional" ? "/api/professional-jobs" : "/api/recommendations"

      const response = await fetch(apiEndpoint)
      const data = await response.json()

      console.log("[GlobeAssist Server] Recommendations response:", {
        success: data.success,
        cached: data.cached,
        countryCount: data.countries?.length,
        profileType,
      })

      if (data.success && data.countries && data.countries.length > 0) {
        if (profileType === "professional") {
          setJobCountries(data.countries)
        } else {
          setCountries(data.countries)
        }
        setIsCached(data.cached || false)
      } else {
        setError(data.error || "Failed to load recommendations")
      }
    } catch (err) {
      console.error("[GlobeAssist Server] Error fetching recommendations:", err)
      setError("Failed to connect to the server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function regenerateRecommendations() {
    if (!profileType) return

    try {
      setIsRegenerating(true)
      setError(null)

      const apiEndpoint = profileType === "professional" ? "/api/professional-jobs" : "/api/recommendations"

      // Clear cached recommendations
      const deleteResponse = await fetch(apiEndpoint, {
        method: "DELETE",
      })

      if (!deleteResponse.ok) {
        throw new Error("Failed to clear cached recommendations")
      }

      // Fetch new recommendations
      await fetchRecommendations()
    } catch (err) {
      console.error("[GlobeAssist Server] Error regenerating recommendations:", err)
      setError("Failed to regenerate recommendations. Please try again.")
    } finally {
      setIsRegenerating(false)
    }
  }

  useEffect(() => {
    if (profileType) {
      fetchRecommendations()
    }
  }, [profileType])

  if (loading || !profileType) {
    return (
      <div className="p-4 md:p-6 lg:p-8 min-h-screen">
        <AISequenceLoader type={profileType === "professional" ? "professional" : "student"} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-base md:text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 md:px-6 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const hasData = profileType === "professional" ? jobCountries.length > 0 : countries.length > 0

  if (!hasData) {
    return (
      <div className="p-4 md:p-6 lg:p-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 text-base md:text-lg">No recommendations available. Please refresh.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 md:px-6 py-2 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-1 md:mb-2">
            {profileType === "professional" ? "Recommended Job Markets for You" : "Recommended Countries for You"}
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            {isCached
              ? profileType === "professional"
                ? "Showing your saved job market recommendations based on your profile"
                : "Showing your saved recommendations based on your profile"
              : profileType === "professional"
                ? "Personalized job opportunities based on your skills and experience"
                : "Personalized study abroad destinations based on your profile and preferences"}
          </p>
        </div>
        {isCached && (
          <Button
            onClick={regenerateRecommendations}
            disabled={isRegenerating}
            variant="outline"
            size="sm"
            className="bg-transparent w-full sm:w-auto"
          >
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </Button>
        )}
      </div>

      {profileType === "professional" ? (
        <ProfessionalJobGrid countries={jobCountries} loading={false} error={null} />
      ) : (
        <CountryGrid countries={countries} loading={false} error={null} />
      )}
    </div>
  )
}
