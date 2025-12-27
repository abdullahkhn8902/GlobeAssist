"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import {
  ArrowLeft,
  Building2,
  Home,
  CheckCircle2,
  DollarSign,
  Calendar,
  FileText,
  MapPin,
  ExternalLink,
  Mail,
  Clock,
  AlertCircle,
  Lightbulb,
  Star,
  Users,
  Bed,
  Shield,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AccommodationsShimmer } from "@/components/loaders/accommodations-shimmer"

interface AccommodationData {
  dormInfo: {
    available: boolean
    types: string[]
    costRange: string
    costRangePKR: string
    facilities: string[]
    applicationDeadline: string
    images: string[]
  }
  privateHousing: {
    avgRent: string
    avgRentPKR: string
    popularAreas: string[]
    resources: Array<{
      name: string
      url: string
    }>
  }
  applicationProcess: {
    steps: string[]
    requiredDocuments: string[]
    timeline: string
    whereToApply: string
    applicationUrl: string
  }
  pakistaniStudentInfo: {
    tips: string[]
    supportResources: Array<{
      name: string
      contact: string
    }>
  }
}

export default function AccommodationsPage() {
  const params = useParams()
  const router = useRouter()
  const universityName = decodeURIComponent(params.universityName as string)
  const countryName = decodeURIComponent(params.countryName as string)

  const [data, setData] = useState<AccommodationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAccommodations() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/accommodation-details?university=${encodeURIComponent(universityName)}&country=${encodeURIComponent(countryName)}`,
        )
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || "Failed to load accommodation information")
        }
      } catch (err) {
        console.error("Error fetching accommodations:", err)
        setError("Failed to connect to the server")
      } finally {
        setLoading(false)
      }
    }

    if (universityName && countryName) {
      fetchAccommodations()
    }
  }, [universityName, countryName])

  if (loading) {
    return <AccommodationsShimmer />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Unable to Load Accommodations</h2>
          <p className="text-muted-foreground mb-6">{error || "Failed to load accommodation information"}</p>
          <Button onClick={() => router.back()} variant="outline" size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header with Background */}
      <div className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground">
        <div className="absolute inset-0 bg-[url('/modern-university-aerial.png')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <button
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to {universityName}
          </button>

          <div className="max-w-3xl">
            <Badge className="mb-4 bg-secondary text-secondary-foreground">For Pakistani Students</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-balance">
              Find Your Home at {universityName}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 text-pretty">
              Comprehensive accommodation guide with real-time pricing, application processes, and Pakistani student
              support
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-20 relative z-10">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <Building2 className="w-8 h-8 text-primary mb-3" />
            <div className="text-2xl font-bold text-foreground mb-1">{data.dormInfo.types.length}+</div>
            <div className="text-sm text-muted-foreground">Housing Options</div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <DollarSign className="w-8 h-8 text-primary mb-3" />
            <div className="text-2xl font-bold text-foreground mb-1">{data.dormInfo.costRange.split("-")[0]}</div>
            <div className="text-sm text-muted-foreground">Starting From</div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
            <Shield className="w-8 h-8 text-primary mb-3" />
            <div className="text-2xl font-bold text-foreground mb-1">24/7</div>
            <div className="text-sm text-muted-foreground">Support Available</div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-accent/50 border-l-4 border-primary rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-accent-foreground text-lg mb-2">Important for Pakistani Students</h3>
              <p className="text-accent-foreground/80 text-balance">
                Apply early as accommodation fills quickly. Keep your passport, admission letter, visa documents, and
                financial proof ready. Some universities offer guaranteed housing for first-year international students.
              </p>
            </div>
          </div>
        </div>

        {/* University Dormitories - Travel Style Cards */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-7 h-7 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">University Dormitories</h2>
            {data.dormInfo.available && (
              <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Available</Badge>
            )}
          </div>

          {/* Large Featured Image Grid */}
          {data.dormInfo.images && data.dormInfo.images.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 rounded-2xl overflow-hidden">
              {data.dormInfo.images.slice(0, 4).map((img, idx) => (
                <div key={idx} className={`relative ${idx === 0 ? "col-span-2 row-span-2" : ""} aspect-square`}>
                  <Image
                    src={img || `/placeholder.svg?height=400&width=400&query=modern university dorm room ${idx + 1}`}
                    alt={`University Dormitory ${idx + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  {idx === 3 && data.dormInfo.images.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">+{data.dormInfo.images.length - 4} more</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Info */}
            <div className="space-y-6">
              {/* Room Types */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Bed className="w-5 h-5 text-primary" />
                  Room Types Available
                </h3>
                <div className="space-y-3">
                  {data.dormInfo.types.map((type, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium">{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-3 text-lg">Monthly Cost</h3>
                    <div className="text-3xl font-bold text-foreground mb-2">{data.dormInfo.costRange}</div>
                    <div className="text-muted-foreground text-sm mb-3">≈ {data.dormInfo.costRangePKR}</div>
                    <p className="text-xs text-muted-foreground">Prices may vary by room type and meal plan</p>
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Application Deadline</h3>
                    <p className="text-amber-700 font-medium">{data.dormInfo.applicationDeadline}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Facilities */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                What's Included
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.dormInfo.facilities.map((facility, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground pt-1">{facility}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Private Housing */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Home className="w-7 h-7 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Private Housing & Apartments</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Pricing Card */}
            <div className="bg-card border border-border rounded-xl p-6 lg:col-span-1">
              <div className="text-center">
                <DollarSign className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-3">Average Rent</h3>
                <div className="text-3xl font-bold text-foreground mb-2">{data.privateHousing.avgRent}</div>
                <div className="text-muted-foreground text-sm mb-4">≈ {data.privateHousing.avgRentPKR}</div>
                <p className="text-xs text-muted-foreground">Per month, varies by location</p>
              </div>
            </div>

            {/* Popular Areas */}
            <div className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Popular Student Neighborhoods
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {data.privateHousing.popularAreas.map((area, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-primary" />
                Additional Resources
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.privateHousing.resources.map((resource, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-foreground hover:underline"
                    >
                      {resource.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Application Process */}
        <section className="bg-gradient-to-br from-muted/50 to-background border border-border rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-7 h-7 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">How to Apply</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Steps */}
            <div>
              <h3 className="font-semibold text-foreground mb-6 text-lg">Application Steps</h3>
              <div className="space-y-4">
                {data.applicationProcess.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground font-bold rounded-full flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-foreground leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents & Timeline */}
            <div className="space-y-6">
              {/* Required Documents */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Required Documents
                </h3>
                <div className="space-y-2">
                  {data.applicationProcess.requiredDocuments.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Timeline</h3>
                    <p className="text-foreground/80 text-sm">{data.applicationProcess.timeline}</p>
                  </div>
                </div>
              </div>

              {/* Where to Apply */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Submit Application
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{data.applicationProcess.whereToApply}</p>
                {data.applicationProcess.applicationUrl && (
                  <a
                    href={data.applicationProcess.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-semibold w-full justify-center"
                  >
                    Apply Online
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Pakistani Student Tips */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-7 h-7 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Tips for Pakistani Students</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {data.pakistaniStudentInfo.tips.map((tip, idx) => (
              <div key={idx} className="bg-accent/30 border border-accent rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <p className="text-accent-foreground leading-relaxed pt-1">{tip}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Support Resources */}
          <div className="mt-8 bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Pakistani Student Support
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {data.pakistaniStudentInfo.supportResources.map((resource, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">{resource.name}</p>
                    <p className="text-sm text-muted-foreground">{resource.contact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Ready to Secure Your Accommodation?
          </h3>
          <p className="text-primary-foreground/90 text-lg mb-6 max-w-2xl mx-auto text-balance">
            Don't wait! Accommodation fills up quickly, especially for international students. Apply early to get your
            preferred choice.
          </p>
          {data.applicationProcess.applicationUrl && (
            <a
              href={data.applicationProcess.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-background text-foreground hover:bg-background/90 rounded-xl transition-all font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105"
            >
              Start Your Application Now
              <ArrowRight className="w-5 h-5" />
            </a>
          )}
        </section>
      </div>
    </div>
  )
}
