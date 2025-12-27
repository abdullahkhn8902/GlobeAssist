"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  GraduationCap,
  ArrowLeft,
  Loader2,
  ExternalLink,
  CheckCircle2,
  BookOpen,
  Globe,
  FileText,
  Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ShimmerLoader } from "@/components/dashboard/shimmer-loader"

interface Scholarship {
  id: string
  name: string
  university: string
  location: string
  qualification: string
  valueMin: number
  valueMax: number
  currency: string
  deadline: string
  fundingType: string
  description: string
  eligibility: string[]
  subjects: string[]
  nationality: string
  howToApply: string
  applyLink: string
}

export default function ScholarshipDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [scholarship, setScholarship] = useState<Scholarship | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchingLink, setFetchingLink] = useState(false)

  useEffect(() => {
    if (id) {
      findScholarship()
    }
  }, [id])

  const findScholarship = async () => {
    const decodedId = decodeURIComponent(id)

    try {
      const cached = sessionStorage.getItem("scholarships_cache")
      if (cached) {
        const scholarships: Scholarship[] = JSON.parse(cached)
        const found = scholarships.find((s) => s.id === decodedId)
        if (found) {
          setScholarship(found)
          setLoading(false)
          return
        }
      }
    } catch (e) {
      console.error("Failed to read from cache:", e)
    }

    try {
      const response = await fetch("/api/scholarships")
      const data = await response.json()

      if (data.scholarships) {
        const found = data.scholarships.find((s: Scholarship) => s.id === decodedId)
        setScholarship(found || null)

        // Update cache with latest data
        try {
          sessionStorage.setItem("scholarships_cache", JSON.stringify(data.scholarships))
        } catch (e) {
          console.error("Failed to update cache:", e)
        }
      }
    } catch (error) {
      console.error("Error fetching scholarship:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyNow = async () => {
    if (!scholarship) return

    if (scholarship.applyLink && !scholarship.applyLink.includes("google.com/search")) {
      window.open(scholarship.applyLink, "_blank", "noopener,noreferrer")
      return
    }

    setFetchingLink(true)
    console.log("[GlobeAssist Server] User clicked Apply Now, fetching application link...")

    try {
      const response = await fetch("/api/scholarships/get-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scholarship: {
            id: scholarship.id,
            name: scholarship.name,
            university: scholarship.university,
            location: scholarship.location,
            qualification: scholarship.qualification,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const link = data.link

        console.log("[GlobeAssist Server] Got application link:", link)

        setScholarship((prev) => (prev ? { ...prev, applyLink: link } : null))

        window.open(link, "_blank", "noopener,noreferrer")
      } else {
        console.error("[GlobeAssist Server] Failed to fetch application link")
        const fallbackLink = `https://www.google.com/search?q=${encodeURIComponent(
          `${scholarship.name} ${scholarship.university} official application form 2026`,
        )}`
        window.open(fallbackLink, "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      console.error("[GlobeAssist Server] Error fetching application link:", error)
      const fallbackLink = `https://www.google.com/search?q=${encodeURIComponent(
        `${scholarship.name} ${scholarship.university} official application form 2026`,
      )}`
      window.open(fallbackLink, "_blank", "noopener,noreferrer")
    } finally {
      setFetchingLink(false)
    }
  }

  if (loading) {
    return (
      <ShimmerLoader
        message="Loading scholarship details..."
        subMessage="Fetching comprehensive scholarship information"
        type="full"
      />
    )
  }

  if (!scholarship) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-slate-600 mb-2">Scholarship not found</h2>
          <p className="text-slate-400 text-sm mb-4">This scholarship may have expired or been removed.</p>
          <Link href="/dashboard/scholarships">
            <Button variant="outline" className="mt-4 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to scholarships
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const valueDisplay =
    scholarship.valueMin === 0 && scholarship.valueMax === 0
      ? "Full Coverage"
      : `${scholarship.valueMin.toLocaleString()} to ${scholarship.valueMax.toLocaleString()} ${scholarship.currency}`

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard/scholarships">
          <Button variant="ghost" className="mb-6 text-slate-600 hover:text-slate-800 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to scholarships
          </Button>
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{scholarship.name}</h1>
            <p className="text-slate-500">At {scholarship.university}</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-0 md:divide-x divide-slate-600">
              <div className="text-center md:px-4">
                <p className="text-slate-400 text-xs md:text-sm mb-1">Location</p>
                <p className="text-white font-medium">{scholarship.location}</p>
              </div>
              <div className="text-center md:px-4">
                <p className="text-slate-400 text-xs md:text-sm mb-1">Qualification</p>
                <p className="text-white font-medium">{scholarship.qualification}</p>
              </div>
              <div className="text-center md:px-4">
                <p className="text-slate-400 text-xs md:text-sm mb-1">Value of award</p>
                <p className="text-white font-medium text-sm md:text-base">{valueDisplay}</p>
              </div>
              <div className="text-center md:px-4">
                <p className="text-slate-400 text-xs md:text-sm mb-1">Funding Type</p>
                <p className="text-white font-medium">{scholarship.fundingType}</p>
              </div>
              <div className="text-center md:px-4 col-span-2 md:col-span-1 mt-2 md:mt-0">
                <p className="text-slate-400 text-xs md:text-sm mb-1">Application Deadline</p>
                <p className="text-white font-medium">{scholarship.deadline}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-slate-600" />
              About the scholarship
            </h2>
            <p className="text-slate-600 leading-relaxed">{scholarship.description}</p>
          </div>

          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              Entry Requirements
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-slate-500 text-sm mb-2">Selection criteria:</p>
                <ul className="space-y-2">
                  {scholarship.eligibility.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <p className="text-slate-500 text-sm mb-1">Course subject you are applying for:</p>
                <p className="text-slate-700">{scholarship.subjects.join(", ")}</p>
              </div>

              <div>
                <p className="text-slate-500 text-sm mb-1">Award can be used for:</p>
                <p className="text-slate-700">
                  {scholarship.fundingType === "Fully Funded"
                    ? "Tuition fees, Living expenses, Travel costs"
                    : "Tuition fees"}
                </p>
              </div>

              <div>
                <p className="text-slate-500 text-sm mb-1">Nationality requirement:</p>
                <p className="text-slate-700">{scholarship.nationality}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-slate-600" />
              How to apply
            </h2>

            <p className="text-slate-600 mb-4">{scholarship.howToApply}</p>

            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-slate-500 text-sm mb-2">Application deadlines and announcement dates:</p>
              <p className="text-slate-700">Deadline: {scholarship.deadline}</p>
            </div>
          </div>

          <Button
            onClick={handleApplyNow}
            disabled={fetchingLink}
            className="w-full h-14 rounded-2xl bg-slate-600 hover:bg-slate-700 text-white text-lg font-medium disabled:opacity-50"
          >
            {fetchingLink ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Finding application page...
              </>
            ) : (
              <>
                Apply now
                <ExternalLink className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
            <h3 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Tips for Pakistani Students
            </h3>
            <ul className="space-y-2 text-emerald-700 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                Start your application at least 3-6 months before the deadline
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                Prepare IELTS/TOEFL scores well in advance (most require 6.5+ IELTS)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                Get HEC attestation for your degree certificates
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                Prepare a strong Statement of Purpose highlighting your goals
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
