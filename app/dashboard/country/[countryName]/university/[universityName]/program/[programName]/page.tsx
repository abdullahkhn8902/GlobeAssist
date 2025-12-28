"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  DollarSign,
  Calendar,
  FileCheck,
  ExternalLink,
  MapPin,
  Award,
  RefreshCw,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ProgramLoader } from "@/components/loaders/program-loader"

interface ProgramDetails {
  programName: string
  universityName: string
  location: string
  qualification: string
  fees: string
  duration: string
  nextIntake: string
  applicationDeadline: string
  aboutCourse: string
  entryRequirements: string[]
  applicationUrl: string
  entryScore?: string
}

export default function ProgramDetailPage() {
  const params = useParams()
  const router = useRouter()

  const programName = decodeURIComponent(params.programName as string)
  const universityName = decodeURIComponent(params.universityName as string)
  const countryName = decodeURIComponent(params.countryName as string)

  const [details, setDetails] = useState<ProgramDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchProgramDetails(forceRefresh = false) {
    try {
      if (forceRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const refreshParam = forceRefresh ? "&refresh=true" : ""
      const response = await fetch(
        `/api/program-details?program=${encodeURIComponent(programName)}&university=${encodeURIComponent(universityName)}&country=${encodeURIComponent(countryName)}${refreshParam}`,
      )
      const data = await response.json()

      if (data.success) {
        setDetails(data.data)
        console.log("[GlobeAssist Server] Program details loaded:", data.cached ? "from cache" : "fresh from API")
      } else {
        setError(data.error || "Failed to load program details")
      }
    } catch (err) {
      console.error("[GlobeAssist Server] Error fetching program details:", err)
      setError("Failed to connect to the server")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (programName && universityName && countryName) {
      fetchProgramDetails()
    }
  }, [programName, universityName, countryName])

  const handleRefresh = () => {
    fetchProgramDetails(true)
  }

  const handleApplyNow = () => {
    if (details?.applicationUrl) {
      window.open(details.applicationUrl, "_blank", "noopener,noreferrer")
    }
  }

  if (loading) {
    return <ProgramLoader programName={programName} />
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-6">
        <div className="text-center">
          <p className="text-red-600 text-base md:text-lg mb-4">{error || "Failed to load program details"}</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
            <Button onClick={() => fetchProgramDetails(true)} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => router.back()} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 overflow-y-auto scrollbar-hide">
      <div className="max-w-5xl mx-auto p-3 md:p-4 lg:p-6 xl:p-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-800 hover:bg-slate-200 px-2 md:px-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Back to Programs</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="text-slate-600 hover:text-slate-800 bg-transparent px-2 md:px-3"
          >
            <RefreshCw className={`w-4 h-4 mr-1 md:mr-2 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Refresh Data"}</span>
            <span className="sm:hidden">{refreshing ? "..." : "Refresh"}</span>
          </Button>
        </div>

        <div className="mb-4 md:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 md:mb-3 text-balance">
            {details.programName}
          </h1>
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
            <p className="text-sm md:text-base lg:text-lg line-clamp-1">
              At {details.universityName}, {details.location}
            </p>
          </div>
        </div>

        <Card className="bg-slate-800 border-slate-700 p-3 md:p-4 lg:p-6 mb-4 md:mb-6 lg:mb-8 shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
            <div className="sm:border-r sm:border-slate-600 sm:pr-3 lg:pr-4">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wide">
                  Qualification
                </p>
              </div>
              <p className="text-white font-semibold text-xs md:text-sm">{details.qualification}</p>
            </div>

            <div className="sm:border-r sm:border-slate-600 sm:pr-3 lg:pr-4">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wide">Duration</p>
              </div>
              <p className="text-white font-semibold text-xs md:text-sm">{details.duration}</p>
            </div>

            <div className="sm:border-r sm:border-slate-600 sm:pr-3 lg:pr-4">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wide">Fees</p>
              </div>
              <p className="text-white font-semibold text-xs md:text-sm">{details.fees}</p>
            </div>

            <div className="sm:border-r sm:border-slate-600 sm:pr-3 lg:pr-4">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wide">Next Intake</p>
              </div>
              <p className="text-white font-semibold text-xs md:text-sm">{details.nextIntake}</p>
            </div>

            <div className="sm:border-r sm:border-slate-600 sm:pr-3 lg:pr-4">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <FileCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wide">Deadline</p>
              </div>
              <p className="text-white font-semibold text-xs md:text-sm">{details.applicationDeadline}</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
                <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                <p className="text-slate-400 text-[10px] md:text-xs font-medium uppercase tracking-wide">Entry Score</p>
              </div>
              <p className="text-white font-semibold text-xs md:text-sm">{details.entryScore || "6.5 IELTS"}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border-slate-200 p-4 md:p-6 lg:p-8 mb-4 md:mb-6 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-lg flex items-center justify-center">
              <Award className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900">About Course</h2>
          </div>
          <p className="text-slate-700 leading-relaxed text-sm md:text-base">{details.aboutCourse}</p>
        </Card>

        <Card className="bg-white border-slate-200 p-4 md:p-6 lg:p-8 mb-4 md:mb-6 lg:mb-8 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-800 rounded-lg flex items-center justify-center">
              <FileCheck className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900">Entry Requirements</h2>
          </div>
          <ul className="space-y-2 md:space-y-3">
            {details.entryRequirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-2 md:gap-3">
                <div className="w-1.5 h-1.5 bg-slate-800 rounded-full mt-2 flex-shrink-0" />
                <p className="text-slate-700 leading-relaxed text-sm md:text-base flex-1">{requirement}</p>
              </li>
            ))}
          </ul>
        </Card>

        <div className="sticky bottom-3 md:bottom-6 z-10">
          <Button
            onClick={handleApplyNow}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-4 md:py-6 text-base md:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            Apply Now
            <ExternalLink className="w-4 h-4 md:w-5 md:h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
