"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, GraduationCap, Clock, DollarSign, Calendar, Award, FileText, Languages, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UniversityShimmer } from "@/components/loaders/university-shimmer"

interface Program {
  name: string
  qualification: string
  duration: string
  fees: string
  nextIntake: string
  entryScore: string
}

interface UniversityDetails {
  universityName: string
  countryName: string
  universityImageUrl: string
  description: string
  worldRanking: string
  applicationFee: string
  applicationRequirements: string[]
  programs: Program[]
}

function ProgramCard({
  program,
  universityName,
  countryName,
}: { program: Program; universityName: string; countryName: string }) {
  const router = useRouter()

  const handleClick = () => {
    const encodedProgramName = encodeURIComponent(program.name)
    const encodedUniversityName = encodeURIComponent(universityName)
    const encodedCountryName = encodeURIComponent(countryName)
    router.push(
      `/dashboard/country/${encodedCountryName}/university/${encodedUniversityName}/program/${encodedProgramName}`,
    )
  }

  return (
    <div
      className="bg-slate-700 rounded-2xl p-5 border-2 border-slate-600 hover:border-slate-500 transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
      <h3 className="text-white font-semibold text-base mb-4 line-clamp-2 min-h-[3rem]">{program.name}</h3>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3 text-slate-300 text-sm">
          <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Qualification : {program.qualification}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300 text-sm">
          <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Duration : {program.duration}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300 text-sm">
          <DollarSign className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Fees : {program.fees}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300 text-sm">
          <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Next intake : {program.nextIntake}</span>
        </div>
        <div className="flex items-center gap-3 text-slate-300 text-sm">
          <Award className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Entry Score : {program.entryScore}</span>
        </div>
      </div>
    </div>
  )
}

export default function UniversityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const universityName = decodeURIComponent(params.universityName as string)
  const countryName = decodeURIComponent(params.countryName as string)

  const [details, setDetails] = useState<UniversityDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/university-details?university=${encodeURIComponent(universityName)}&country=${encodeURIComponent(countryName)}`,
        )
        const data = await response.json()

        if (data.success) {
          setDetails(data.data)
        } else {
          setError(data.error || "Failed to load university details")
        }
      } catch (err) {
        console.error("[GlobeAssist Server] Error fetching university details:", err)
        setError("Failed to connect to the server")
      } finally {
        setLoading(false)
      }
    }

    if (universityName && countryName) {
      fetchDetails()
    }
  }, [universityName, countryName])

  if (loading) {
    return <UniversityShimmer />
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-6">
        <div className="text-center">
          <p className="text-red-600 text-base md:text-lg mb-4">{error || "Failed to load university details"}</p>
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const getRequirementIcon = (index: number) => {
    const icons = [GraduationCap, Languages, FileText, Plane]
    const Icon = icons[index % icons.length]
    return <Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
  }

  const shortenRequirement = (req: string) => {
    if (req.length > 50) {
      return req.substring(0, 47) + "..."
    }
    return req
  }

  const handleAccommodationClick = () => {
    const encodedUniversityName = encodeURIComponent(universityName)
    const encodedCountryName = encodeURIComponent(countryName)
    router.push(`/dashboard/country/${encodedCountryName}/university/${encodedUniversityName}/accommodations`)
  }

  return (
    <div className="min-h-screen lg:h-screen bg-slate-100 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
      {/* Left Section - Programs Grid (Scrollable on desktop) */}
      <div className="flex-1 min-h-0 lg:overflow-y-auto p-3 md:p-4 lg:p-6 scrollbar-hide order-2 lg:order-1">
        {/* Back Button - Hidden on mobile */}
        <button
          onClick={() => router.back()}
          className="hidden lg:flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {countryName}
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 lg:gap-5 pb-4">
          {details.programs.map((program, index) => (
            <ProgramCard
              key={index}
              program={program}
              universityName={details.universityName}
              countryName={details.countryName}
            />
          ))}
        </div>
      </div>

      {/* Right Section - University Info (Fixed on desktop, first on mobile) */}
      <div className="w-full lg:w-[360px] xl:w-[400px] flex-shrink-0 p-3 md:p-4 lg:py-6 lg:pr-6 lg:pl-0 order-1 lg:order-2">
        <div className="bg-slate-800 rounded-xl lg:rounded-2xl overflow-hidden border border-slate-700 lg:h-full flex flex-col">
          {/* Mobile Back Button */}
          <button
            onClick={() => router.back()}
            className="flex lg:hidden items-center gap-2 text-slate-300 hover:text-white p-3 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {countryName}
          </button>

          {/* University Image with Logo */}
          <div className="relative h-32 sm:h-36 lg:h-44 overflow-hidden flex-shrink-0 mb-5">
            <Image
              src={details.universityImageUrl || "/placeholder.svg"}
              alt={details.universityName}
              fill
              className="object-cover"
              unoptimized
            />
            {/* University Logo */}
            <div className="absolute top-2 left-2 lg:top-3 lg:left-3 w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-lg shadow-lg flex items-center justify-center p-1">
              <GraduationCap className="w-5 h-5 lg:w-6 lg:h-6 text-slate-800" />
            </div>
          </div>

          {/* University Info - compact */}
          <div className="p-3 md:p-4 lg:p-5 flex-1 flex flex-col">
            <h1 className="text-lg lg:text-3xl font-bold text-white mb-1 line-clamp-1 mb-5">
              {details.universityName}
            </h1>
            <p className="text-slate-300 text-sm md:text-sm leading-relaxed mb-4 lg:mb-10  line-clamp-2 lg:line-clamp-3 ">
              {details.description}
            </p>

            {/* World Ranking */}
            <p className="text-lg lg:text-xl font-bold text-teal-400 mb-1 ">
              THE World Ranking: {details.worldRanking}
            </p>

            {/* Application Fee */}
            <p className="text-lg lg:text-xl font-bold text-teal-400 mb-2 lg:mb-10">
              Application Fee: {details.applicationFee}
            </p>

            {/* Application Requirements */}
            <div className="mb-2 lg:mb-10">
              <div className="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
                <h2 className="text-lg lg:text-2xl font-bold text-white mb-1.5 lg:mb-2">Application Requirements</h2>
              </div>
              <ul className="space-y-1 lg:space-y-1.5">
                {details.applicationRequirements.slice(0, 4).map((requirement, index) => (
                  <li key={index} className="flex items-start gap-1.5 lg:gap-2 text-slate-300 text-[10px] lg:text-sm">
                    {getRequirementIcon(index)}
                    <span className="line-clamp-1 lg:mb-3">{shortenRequirement(requirement)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto">
              <Button
                onClick={handleAccommodationClick}
                className="w-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 font-semibold py-2 lg:py-2.5 rounded-lg lg:rounded-xl border border-teal-500/30 text-xs lg:text-sm"
              >
                Accommodation for Students
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
