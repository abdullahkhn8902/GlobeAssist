"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JobDetailLoader } from "@/components/loaders/job-detail-loader"

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

interface JobDetailClientProps {
  countryName: string
  jobId: string
}

function generateAirbnbUrl(city: string, country: string): string {
  const cityName = city.split(",")[0].trim()
  const location = encodeURIComponent(`${cityName}, ${country}`)
  return `https://www.airbnb.com/s/${location}/homes?adults=1`
}

export function JobDetailClient({ countryName, jobId }: JobDetailClientProps) {
  const router = useRouter()
  const [job, setJob] = useState<JobData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJobDetails() {
      try {
        setLoading(true)
        const response = await fetch(`/api/professional-jobs/${encodeURIComponent(countryName)}`)
        const data = await response.json()

        if (data.success && data.jobs) {
          const foundJob = data.jobs.find((j: JobData) => j.id === jobId)
          if (foundJob) {
            setJob(foundJob)
          } else {
            setError("Job not found")
          }
        } else {
          setError(data.error || "Failed to load job details")
        }
      } catch (err) {
        console.error("[GlobeAssist Server] Error fetching job details:", err)
        setError("Failed to connect to server")
      } finally {
        setLoading(false)
      }
    }

    fetchJobDetails()
  }, [countryName, jobId])

  if (loading) {
    return <JobDetailLoader />
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 text-base mb-4">{error || "Job not found"}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const airbnbUrl = generateAirbnbUrl(job.location, countryName)

  return (
    <div className="min-h-screen bg-slate-200 p-4 md:p-6 lg:p-8 overflow-y-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </button>

      {/* Job Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 italic mb-1">{job.title}</h1>
        <p className="text-slate-600 text-sm md:text-base">At {job.company}</p>
      </div>

      {/* Job Details Table */}
      <div className="bg-slate-700 rounded-lg overflow-hidden mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5">
          <div className="p-3 md:p-4 border-r border-slate-600">
            <p className="text-teal-300 text-xs md:text-sm font-medium mb-1">Qualification</p>
            <p className="text-white text-xs md:text-sm">{job.qualification}</p>
          </div>
          <div className="p-3 md:p-4 border-r border-slate-600">
            <p className="text-teal-300 text-xs md:text-sm font-medium mb-1">Location</p>
            <p className="text-white text-xs md:text-sm">{job.location}</p>
          </div>
          <div className="p-3 md:p-4 border-r border-slate-600">
            <p className="text-teal-300 text-xs md:text-sm font-medium mb-1">Role</p>
            <p className="text-white text-xs md:text-sm">{job.role || "Permanent"}</p>
          </div>
          <div className="p-3 md:p-4 border-r border-slate-600">
            <p className="text-teal-300 text-xs md:text-sm font-medium mb-1">Contract type</p>
            <p className="text-white text-xs md:text-sm">{job.contractType}</p>
          </div>
          <div className="p-3 md:p-4">
            <p className="text-teal-300 text-xs md:text-sm font-medium mb-1">Salary</p>
            <p className="text-white text-xs md:text-sm">{job.salary}</p>
          </div>
        </div>
      </div>

      {/* About Job */}
      <div className="mb-8">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-3">About Job</h2>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed">{job.description}</p>
      </div>

      {/* Entry Requirements */}
      {job.requirements && job.requirements.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-3">Entry Requirements</h2>
          <ul className="list-disc list-outside ml-5 space-y-2 text-slate-600 text-sm md:text-base">
            {job.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4 max-w-2xl">
        {/* Apply Button */}
        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 rounded-lg">
            Apply Now
          </Button>
        </a>

        <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
          <h3 className="text-slate-800 font-semibold mb-3 text-center">Find Nearby Housing</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href={airbnbUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button
                variant="outline"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white border-rose-500 font-medium py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Airbnb
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
