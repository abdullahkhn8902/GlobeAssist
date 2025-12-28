"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, DollarSign, BookOpen, GraduationCap, Clock, Globe, Calendar, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CountryDetailShimmer } from "@/components/loaders/country-detail-shimmer"

interface University {
  name: string
  imageUrl: string
  tuitionFeeMin: number
  tuitionFeeMax: number
  numberOfCourses: number
  scholarshipsAvailable: number
}

interface Scholarship {
  name: string
  link: string
}

interface CountryDetails {
  countryName: string
  description: string
  countryImageUrl: string
  visaProcessingTime: string
  language: string
  intakes: string
  popularScholarships: Scholarship[]
  universities: University[]
}

function UniversityCard({ university, countryName }: { university: University; countryName: string }) {
  const router = useRouter()

  const formatTuition = (min: number, max: number) => {
    const formatNum = (n: number) => {
      if (n >= 1000) return `${(n / 1000).toFixed(0)},${(n % 1000).toString().padStart(3, "0")}`
      return n.toString()
    }
    return `USD ${formatNum(min)}-${formatNum(max)}/year`
  }

  const handleClick = () => {
    router.push(
      `/dashboard/country/${encodeURIComponent(countryName)}/university/${encodeURIComponent(university.name)}`,
    )
  }

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
    >
      <div className="relative h-40 overflow-hidden">
        <Image
          src={university.imageUrl || "/placeholder.svg"}
          alt={university.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
      </div>
      <div className="p-4">
        <h3 className="text-slate-800 font-semibold text-base mb-3 line-clamp-1">{university.name}</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <DollarSign className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>Tuition fee: {formatTuition(university.tuitionFeeMin, university.tuitionFeeMax)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <BookOpen className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>Number of Courses: {university.numberOfCourses}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <GraduationCap className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span>Scholarships Available: {university.scholarshipsAvailable}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CountryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const countryName = decodeURIComponent(params.countryName as string)

  const [details, setDetails] = useState<CountryDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/country-details?country=${encodeURIComponent(countryName)}`)
        const data = await response.json()

        if (data.success) {
          setDetails(data.data)
        } else {
          setError(data.error || "Failed to load country details")
        }
      } catch (err) {
        console.error("[GlobeAssist Server] Error fetching country details:", err)
        setError("Failed to connect to the server")
      } finally {
        setLoading(false)
      }
    }

    if (countryName) {
      fetchDetails()
    }
  }, [countryName])

  if (loading) {
    return <CountryDetailShimmer countryName={countryName} />
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-6">
        <div className="text-center">
          <p className="text-red-600 text-base md:text-lg mb-4">{error || "Failed to load country details"}</p>
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:h-screen bg-slate-100 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
      {/* Left Section - Universities Grid (Scrollable on desktop, stacked on mobile) */}
      <div className="flex-1 min-h-0 lg:overflow-y-auto p-3 md:p-4 lg:p-6 scrollbar-hide order-2 lg:order-1">
        {/* Back Button - Hidden on mobile (shown in right panel instead) */}
        <button
          onClick={() => router.back()}
          className="hidden lg:flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Recommendations
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-5 pb-4">
          {details.universities.map((university, index) => (
            <UniversityCard key={index} university={university} countryName={details.countryName} />
          ))}
        </div>
      </div>

      {/* Right Section - Country Info (Fixed on desktop, first on mobile) */}
      <div className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 p-3 md:p-4 lg:py-6 lg:pr-6 lg:pl-0 order-1 lg:order-2">
        <div className="bg-slate-800 rounded-xl lg:rounded-2xl overflow-hidden text-white lg:h-full flex flex-col">
          {/* Mobile Back Button */}
          <button
            onClick={() => router.back()}
            className="flex lg:hidden items-center gap-2 text-slate-300 hover:text-white p-3 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Recommendations
          </button>

          {/* Country Image */}
          <div className="relative h-40 lg:h-48 overflow-hidden flex-shrink-0">
            <Image
              src={details.countryImageUrl || "/placeholder.svg"}
              alt={`${details.countryName}`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Country Info - compact, no scroll needed */}
          <div className="p-4 lg:p-5 flex flex-col flex-1 gap-5">
            <h1 className="text-xl md:text-3xl font-bold mb-1 lg:mb-2">{details.countryName}</h1>
            <p className="text-slate-300 text-sm md:text-sm leading-relaxed mb-4 lg:mb-4 line-clamp-2 lg:line-clamp-3">
              {details.description}
            </p>

            {/* Popular Scholarships - Only show first 3 */}
            <div className="mb-3 lg:mb-4">
              <h2 className="text-lg lg:text-2xl font-bold mb-1.5 lg:mb-2">Popular Scholarships</h2>
              <ul className="space-y-2 lg:space-y-1.5">
                {details.popularScholarships.slice(0, 3).map((scholarship, index) => (
                  <li key={index}>
                    <a
                      href={scholarship.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs lg:text-sm text-teal-400 hover:text-teal-300 transition-colors group"
                    >
                      <ExternalLink className="w-3 h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                      <span className="group-hover:underline line-clamp-1">{scholarship.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Other Information */}
            <div className="mb-3 lg:mb-4">
              <h2 className="text-base lg:text-2xl font-bold mb-1.5 lg:mb-2">Other Information</h2>
              <ul className="space-y-1.5 lg:space-y-2">
                <li className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                  <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-red-400 flex-shrink-0" />
                  <span>Visa Processing: {details.visaProcessingTime}</span>
                </li>
                <li className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                  <Globe className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-teal-400 flex-shrink-0" />
                  <span>Language: {details.language}</span>
                </li>
                <li className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                  <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-teal-400 flex-shrink-0" />
                  <span className="line-clamp-1">Intakes: {details.intakes}</span>
                </li>
              </ul>
            </div>

            <div className="mt-auto">
              <Button
                onClick={() => router.push(`/dashboard/country/${encodeURIComponent(countryName)}/visa-requirements`)}
                className="w-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 font-semibold py-2 lg:py-3 rounded-lg lg:rounded-xl border border-teal-500/30 text-xs lg:text-sm"
              >
                Visa Requirements
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
