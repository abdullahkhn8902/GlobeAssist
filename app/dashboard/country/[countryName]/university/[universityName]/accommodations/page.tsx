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
  Users,
  Bed,
  Shield,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import AccommodationsAgentLoader from "@/components/loaders/accommodations-agent-loader"

const PRIMARY = "#1e2a3e"

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
    resources: { name: string; url: string }[]
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
    supportResources: { name: string; contact: string }[]
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
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/accommodation-details?university=${encodeURIComponent(
            universityName
          )}&country=${encodeURIComponent(countryName)}`
        )
        const json = await res.json()
        if (json.success) setData(json.data)
        else setError(json.error)
      } catch {
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [universityName, countryName])

  if (loading) return <AccommodationsAgentLoader />

  if (!data || error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <AlertCircle className="mx-auto mb-4" size={48} />
          <p className="mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-[#1e2a3e] ">
      {/* Header */}
      <header
        className="px-6 py-12 "
        style={{ backgroundColor: PRIMARY }}
      >
        <div className="max-w-6xl mx-auto text-white ">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-6 opacity-80 hover:opacity-100"
          >
            <ArrowLeft size={18} /> Back
          </button>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Accommodation at {universityName}
          </h1>
          <p className="text-white/80 max-w-2xl">
            Simple and clear housing guidance tailored for Pakistani students.
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-14 ">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 ">
          {[
            { icon: Building2, label: "Housing Options", value: data.dormInfo.types.length + "+" },
            { icon: DollarSign, label: "Starting Cost", value: data.dormInfo.costRange.split("-")[0] },
            { icon: Shield, label: "Student Support", value: "24/7" },
          ].map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-xl shadow-lg bg-white "
            >
              <item.icon size={28} className="mb-3" />
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-sm opacity-70">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Dorm Images */}
        {data.dormInfo.images?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-xl overflow-hidden">
            {data.dormInfo.images.slice(0, 4).map((img, i) => (
              <div key={i} className="relative aspect-square">
                <Image
                  src={img}
                  alt="Dorm"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {/* Dorm Info */}
        <section className="grid md:grid-cols-2 gap-8">
          <Card title="Room Types" icon={Bed}>
            {data.dormInfo.types.map((t, i) => (
              <Item key={i}>{t}</Item>
            ))}
          </Card>

          <Card title="Monthly Cost" icon={DollarSign}>
            <p className="text-2xl font-bold">{data.dormInfo.costRange}</p>
            <p className="opacity-70">{data.dormInfo.costRangePKR}</p>
          </Card>
        </section>

        {/* Private Housing */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Private Housing</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Average Rent" icon={Home}>
              <p className="text-xl font-bold">{data.privateHousing.avgRent}</p>
              <p className="opacity-70">{data.privateHousing.avgRentPKR}</p>
            </Card>

            <Card title="Popular Areas" icon={MapPin}>
              {data.privateHousing.popularAreas.map((a, i) => (
                <Item key={i}>{a}</Item>
              ))}
            </Card>
          </div>
        </section>

        {/* Application */}
        <section>
          <h2 className="text-2xl font-bold mb-6">How to Apply</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card title="Steps" icon={FileText}>
              {data.applicationProcess.steps.map((s, i) => (
                <Item key={i}>{s}</Item>
              ))}
            </Card>

            <Card title="Documents" icon={FileText}>
              {data.applicationProcess.requiredDocuments.map((d, i) => (
                <Item key={i}>{d}</Item>
              ))}
            </Card>
          </div>
        </section>

        {/* CTA */}
        {data.applicationProcess.applicationUrl && (
          <div
            className="rounded-xl p-10 text-center text-white"
            style={{ backgroundColor: PRIMARY }}
          >
            <h3 className="text-2xl font-bold mb-4">
              Ready to Apply?
            </h3>
            <a
              href={data.applicationProcess.applicationUrl}
              target="_blank"
              className="inline-flex items-center gap-2 bg-white text-[#1e2a3e] px-6 py-3 rounded-lg font-semibold"
            >
              Apply Now <ArrowRight size={18} />
            </a>
          </div>
        )}
      </main>
    </div>
  )
}

/* Small reusable components */

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: any
  children: React.ReactNode
}) {
  return (
    <div className="p-6 rounded-xl shadow-lg bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <CheckCircle2 size={16} className="mt-0.5" />
      <span>{children}</span>
    </div>
  )
}
