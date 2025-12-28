"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin, Star, ExternalLink, Search, Loader2, AlertCircle, Building2, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AccommodationLoader } from "@/components/loaders/accommodation-loader"

interface AccommodationOption {
  id: string
  name: string
  type: string
  description: string
  provider: string
  url: string
  features: string[]
  rating: number
  priceRange: string
}

interface AccommodationClientProps {
  country: string
  city: string
}

export function AccommodationClient({ country, city: initialCity }: AccommodationClientProps) {
  const router = useRouter()
  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([])
  const [bookingUrl, setBookingUrl] = useState<string>("")
  const [airbnbUrl, setAirbnbUrl] = useState<string>("")
  const [loading, setLoading] = useState(!!initialCity)
  const [error, setError] = useState<string | null>(null)
  const [searchCity, setSearchCity] = useState(initialCity || "")
  const [hasSearched, setHasSearched] = useState(!!initialCity)

  useEffect(() => {
    if (initialCity && !hasSearched) {
      console.log("[v0] Auto-loading accommodations for city:", initialCity)
      fetchAccommodations(initialCity)
      setHasSearched(true)
    } else if (!initialCity) {
      setLoading(false)
    }
  }, [initialCity, hasSearched])

  async function fetchAccommodations(cityName: string) {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Fetching accommodations for:", cityName, "Country:", country)

      const params = new URLSearchParams()
      params.set("city", cityName)
      params.set("country", country)

      const response = await fetch(`/api/professional-accommodations?${params.toString()}`)
      const data = await response.json()

      console.log("[v0] Response:", data)

      if (data.success) {
        setAccommodations(data.accommodations || [])
        setBookingUrl(data.bookingUrl || "")
        setAirbnbUrl(data.airbnbUrl || "")
      } else {
        setError(data.error || "Failed to load accommodations")
      }
    } catch (err) {
      console.error("[v0] Error fetching accommodations:", err)
      setError("Failed to connect to server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchCity.trim()) {
      setHasSearched(true)
      fetchAccommodations(searchCity.trim())
    }
  }

  return (
    <div className="min-h-screen bg-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white py-6 md:py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Find Nearby Housing
            {country && <span className="text-teal-300"> in {country}</span>}
          </h1>
          <p className="text-slate-300 text-base md:text-lg">
            Discover comfortable accommodations near your job location
          </p>
        </div>
      </div>

      {!initialCity && (
        <div className="bg-white border-b border-slate-300 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Enter city name (e.g., Sydney, Melbourne)"
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <Button
                type="submit"
                disabled={loading || !searchCity.trim()}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Loading State */}
        {loading && hasSearched && <AccommodationLoader city={searchCity || initialCity} />}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Unable to Load Accommodations</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Initial State - Prompt to Search */}
        {!loading && !hasSearched && !initialCity && (
          <div className="text-center py-16">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <MapPin className="w-12 h-12 text-teal-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Start Your Search</h3>
              <p className="text-slate-600 text-sm mb-4">
                Enter a city name above to find comfortable accommodations near your job location
              </p>
            </div>
          </div>
        )}

        {/* Accommodation Options */}
        {!loading && hasSearched && accommodations.length > 0 && (
          <div className="mb-12">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                Accommodations in {searchCity || initialCity}
              </h2>
              <p className="text-slate-600">Browse hotels, apartments, and unique stays from trusted providers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accommodations.map((option) => (
                <div
                  key={option.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-slate-200"
                >
                  {/* Provider Header */}
                  <div className={`p-4 ${option.provider === "Booking.com" ? "bg-blue-600" : "bg-rose-500"}`}>
                    <div className="flex items-center gap-3">
                      {option.provider === "Booking.com" ? (
                        <Building2 className="w-8 h-8 text-white" />
                      ) : (
                        <Home className="w-8 h-8 text-white" />
                      )}
                      <div>
                        <h3 className="text-white font-bold text-lg">{option.provider}</h3>
                        <p className="text-white/80 text-sm">{option.type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h4 className="font-bold text-slate-800 text-lg mb-2">{option.name}</h4>
                    <p className="text-slate-600 text-sm mb-4">{option.description}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(option.rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-600">{option.rating} average</span>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      {option.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <a
                      href={option.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                        option.provider === "Booking.com"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-rose-500 hover:bg-rose-600 text-white"
                      }`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Search on {option.provider}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Access Buttons */}
            <div className="mt-8 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Quick Access</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {bookingUrl && (
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    <Building2 className="w-5 h-5" />
                    View All on Booking.com
                  </a>
                )}
                {airbnbUrl && (
                  <a
                    href={airbnbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    View All on Airbnb
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
