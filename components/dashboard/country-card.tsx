"use client"

import { Building2, DollarSign } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface CountryCardProps {
  name: string
  imageUrl: string
  universities: number
  costOfLivingMin: number
  costOfLivingMax: number
}

export function CountryCard({ name, imageUrl, universities, costOfLivingMin, costOfLivingMax }: CountryCardProps) {
  const router = useRouter()

  const formatCost = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`
    }
    return `$${value}`
  }

  const handleClick = () => {
    router.push(`/dashboard/country/${encodeURIComponent(name)}`)
  }

  return (
    <div
      onClick={handleClick}
      className="bg-slate-700 rounded-xl md:rounded-2xl overflow-hidden border-2 border-slate-600 hover:border-slate-500 transition-all duration-300 cursor-pointer group"
    >
      <div className="relative h-32 sm:h-36 md:h-40 overflow-hidden">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={`${name} skyline`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
      </div>
      <div className="p-3 md:p-4">
        <h3 className="text-white font-semibold text-base md:text-lg mb-2 md:mb-3">{name}</h3>
        <div className="flex items-center gap-2 text-slate-300 text-xs md:text-sm mb-1.5 md:mb-2">
          <Building2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>{universities} Universities</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-xs md:text-sm">
          <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>
            Cost of living: {formatCost(costOfLivingMin)}–{formatCost(costOfLivingMax)}
          </span>
        </div>
      </div>
    </div>
  )
}
