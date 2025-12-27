"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, MapPin, DollarSign, Calendar, GraduationCap, Globe, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JobsShimmer } from "@/components/loaders/jobs-shimmer"

interface JobData {
  id: string
  title: string
  company: string
  location: string
  salary: string
  contractType: string
  qualification: string
  postedDate: string
  description: string
  requirements: string[]
  applyUrl: string
  role: string
}

interface CountryData {
  name: string
  imageUrl: string
  description: string
  whyWork: string[]
  visaProcessingTime: string
  language: string
}

interface JobsPageClientProps {
  countryName: string
}

function JobCard({ job, onClick, isSelected }: { job: JobData; onClick: () => void; isSelected: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`bg-slate-700 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected ? "ring-2 ring-teal-500" : "hover:bg-slate-650"
      }`}
    >
      {/* Header with title */}
      <div className="bg-slate-800 px-4 py-3">
        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">{job.title}</h3>
      </div>

      {/* Job details */}
      <div className="p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-slate-300 text-xs">
          <GraduationCap className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">Qualification: {job.qualification}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-xs">
          <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Contract type: {job.contractType}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-xs">
          <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span className="truncate">Location: {job.location}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-xs">
          <DollarSign className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Salary: {job.salary}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-xs">
          <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          <span>Job Posting: {job.postedDate}</span>
        </div>
      </div>
    </div>
  )
}

export function JobsPageClient({ countryName }: JobsPageClientProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<JobData[]>([])
  const [country, setCountry] = useState<CountryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true)
        const response = await fetch(`/api/professional-jobs/${encodeURIComponent(countryName)}`)
        const data = await response.json()

        if (data.success) {
          setJobs(data.jobs || [])
          setCountry(data.country || null)
        } else {
          setError(data.error || "Failed to load jobs")
        }
      } catch (err) {
        console.error("[GlobeAssist Server] Error fetching jobs:", err)
        setError("Failed to connect to server")
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [countryName])

  const handleJobClick = (jobId: string) => {
    router.push(`/dashboard/jobs/${encodeURIComponent(countryName)}/${jobId}`)
  }

  if (loading) {
    return <JobsShimmer />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 text-base mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:h-screen bg-slate-200 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
      {/* Left Section - Jobs Grid (Scrollable) */}
      <div className="flex-1 min-h-0 lg:overflow-y-auto p-4 lg:p-6 scrollbar-hide order-2 lg:order-1">
        {/* Back Button - Desktop only */}
        <button
          onClick={() => router.push("/dashboard")}
          className="hidden lg:flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {jobs.length === 0 ? (
          <div className="bg-slate-700 rounded-xl p-8 text-center">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-white text-lg">No jobs found for {countryName}</p>
            <p className="text-slate-400 mt-2">Try regenerating your recommendations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={() => handleJobClick(job.id)} isSelected={false} />
            ))}
          </div>
        )}
      </div>

      {/* Right Section - Country Info (Fixed on desktop, first on mobile) */}
      <div className="w-full lg:w-[340px] xl:w-[380px] flex-shrink-0 p-4 lg:py-6 lg:pr-6 lg:pl-0 order-1 lg:order-2">
        <div className="bg-white rounded-xl lg:rounded-2xl overflow-hidden lg:h-full flex flex-col shadow-lg">
          {/* Mobile Back Button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="flex lg:hidden items-center gap-2 text-slate-600 hover:text-slate-800 p-4 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          {/* Country Image */}
          <div className="relative h-40 lg:h-48 overflow-hidden flex-shrink-0">
            <Image
              src={country?.imageUrl || "/placeholder.svg"}
              alt={countryName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Country Info - No scroll, fixed content */}
          <div className="p-4 lg:p-5 flex flex-col flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">{countryName}</h1>
            <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-4">{country?.description}</p>

            {/* Why Country Section */}
            <div className="mb-4">
              <h2 className="text-lg lg:text-xl font-bold text-slate-800 mb-2">Why {countryName}?</h2>
              <ul className="space-y-2">
                {country?.whyWork?.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-slate-600 text-sm">
                    <span className="text-slate-400 mt-0.5">●</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Other Information */}
            <div className="mb-4">
              <h2 className="text-lg lg:text-xl font-bold text-slate-800 mb-2">Other Information</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span>Visa Processing Time: {country?.visaProcessingTime}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>Language: {country?.language}</span>
                </div>
              </div>
            </div>

            {/* Visa Requirements Button */}
            <div className="mt-auto">
              <Link href={`/dashboard/jobs/${encodeURIComponent(countryName)}/visa-requirements`}>
                <Button className="w-full bg-teal-600/20 hover:bg-teal-600/30 text-teal-700 font-semibold py-3 rounded-xl border border-teal-600/30">
                  Visa Requirements
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
