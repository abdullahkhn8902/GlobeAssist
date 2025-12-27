"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  FileText,
  Clock,
  DollarSign,
  Calendar,
  CheckCircle2,
  MapPin,
  Globe,
  Phone,
  Lightbulb,
  Building2,
  Wallet,
  FileCheck,
  ChevronRight,
  RefreshCw,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShimmerLoader } from "@/components/dashboard/shimmer-loader"

interface VisaRequirements {
  countryName: string
  visaType: string
  processingTime: string
  visaFee: string
  validity: string
  requiredDocuments: string[]
  financialRequirements: {
    bankStatement: string
    sponsorshipLetter: boolean
    proofOfFunds: string
  }
  applicationSteps: {
    step: number
    title: string
    description: string
  }[]
  whereToApply: {
    name: string
    address: string
    website: string
    phone?: string
  }[]
  importantTips: string[]
  processingCenters: string[]
}

export default function ProfessionalVisaRequirementsPage() {
  const params = useParams()
  const router = useRouter()
  const countryName = decodeURIComponent(params.countryName as string)

  const [data, setData] = useState<VisaRequirements | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true)
      else setLoading(true)

      const url = `/api/professional-visa-requirements?country=${encodeURIComponent(countryName)}&nationality=Pakistani${refresh ? "&refresh=true" : ""}`
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || "Failed to load visa requirements")
      }
    } catch (err) {
      console.error("Error fetching visa requirements:", err)
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (countryName) fetchData()
  }, [countryName])

  if (loading) {
    return (
      <ShimmerLoader
        message="Loading work visa requirements..."
        subMessage="Fetching latest information for professionals"
        type="full"
      />
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 text-base mb-4">{error || "Failed to load"}</p>
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-200 overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="bg-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-3 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {countryName} Jobs
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-teal-400" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">{countryName} Work Visa</h1>
                  <p className="text-slate-400 text-sm">For Pakistani Professionals</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 w-fit"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 md:mt-6">
            <div className="bg-slate-700/50 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <FileText className="w-3.5 h-3.5" />
                Visa Type
              </div>
              <p className="text-white font-semibold text-sm md:text-base">{data.visaType}</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-3.5 h-3.5" />
                Processing
              </div>
              <p className="text-white font-semibold text-sm md:text-base">{data.processingTime}</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                Visa Fee
              </div>
              <p className="text-white font-semibold text-sm md:text-base">{data.visaFee}</p>
            </div>
            <div className="bg-slate-700/50 rounded-xl p-3 md:p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" />
                Validity
              </div>
              <p className="text-white font-semibold text-sm md:text-base">{data.validity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Steps & Documents */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Application Steps */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                How to Apply - Step by Step
              </h2>
              <div className="space-y-3">
                {data.applicationSteps.map((step, index) => (
                  <div key={index} className="flex gap-3 md:gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold text-sm md:text-base">
                        {step.step}
                      </div>
                      {index < data.applicationSteps.length - 1 && (
                        <div className="w-0.5 h-full bg-teal-200 mx-auto mt-1" style={{ minHeight: "20px" }} />
                      )}
                    </div>
                    <div className="pb-4">
                      <h3 className="font-semibold text-slate-800 text-sm md:text-base">{step.title}</h3>
                      <p className="text-slate-600 text-xs md:text-sm mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Documents */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Required Documents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                {data.requiredDocuments.map((doc, index) => (
                  <div key={index} className="flex items-start gap-2 p-2.5 md:p-3 bg-slate-50 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-xs md:text-sm">{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Where to Apply */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Where to Apply in Pakistan
              </h2>
              <div className="space-y-3">
                {data.whereToApply.map((center, index) => (
                  <div key={index} className="p-3 md:p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h3 className="font-semibold text-slate-800 text-sm md:text-base mb-2">{center.name}</h3>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2 text-slate-600 text-xs md:text-sm">
                        <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 mt-0.5" />
                        <span>{center.address}</span>
                      </div>
                      {center.website && (
                        <a
                          href={center.website.startsWith("http") ? center.website : `https://${center.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-xs md:text-sm"
                        >
                          <Globe className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                          <span className="hover:underline">{center.website}</span>
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      )}
                      {center.phone && (
                        <div className="flex items-center gap-2 text-slate-600 text-xs md:text-sm">
                          <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                          <span>{center.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {data.processingCenters.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-slate-600 text-xs md:text-sm">
                    <span className="font-medium">Visa Processing Centers:</span> {data.processingCenters.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Financial & Tips */}
          <div className="space-y-4 md:space-y-6">
            {/* Financial Requirements */}
            <div className="bg-slate-800 text-white rounded-xl p-4 md:p-5">
              <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-400" />
                Financial Requirements
              </h2>
              <div className="space-y-3">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Bank Statement</p>
                  <p className="text-white text-sm font-medium">{data.financialRequirements.bankStatement}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Proof of Funds</p>
                  <p className="text-white text-sm font-medium">{data.financialRequirements.proofOfFunds}</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1">Sponsorship Letter</p>
                  <p className="text-white text-sm font-medium">
                    {data.financialRequirements.sponsorshipLetter ? "Required (from employer)" : "Not Required"}
                  </p>
                </div>
              </div>
            </div>

            {/* Important Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 md:p-5">
              <h2 className="text-base md:text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                Important Tips
              </h2>
              <ul className="space-y-2.5">
                {data.importantTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-amber-900 text-xs md:text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-5 md:py-6 rounded-xl text-sm md:text-base"
              onClick={() => {
                const applyUrl = data.whereToApply[0]?.website
                if (applyUrl) {
                  window.open(applyUrl.startsWith("http") ? applyUrl : `https://${applyUrl}`, "_blank")
                }
              }}
            >
              Start Your Application
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
