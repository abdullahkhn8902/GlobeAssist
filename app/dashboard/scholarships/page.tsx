"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  GraduationCap,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Search,
  Filter,
  X,
  Loader2,
  RefreshCw,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ScholarshipsShimmer } from "@/components/loaders/scholarships-shimmer"

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

interface UserProfile {
  qualification: string
  destinations: string
  fields: string[]
}

const FILTER_OPTIONS = {
  fundingType: ["Fully Funded", "Partial", "Fee waiver"],
  location: ["USA", "UK", "Germany", "Australia", "Europe"],
  qualification: ["Undergraduate", "Masters", "PhD"],
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterLoading, setFilterLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({
    fundingType: [],
    location: [],
    qualification: [],
  })
  const [showFilters, setShowFilters] = useState(false)
  const [appliedApiFilters, setAppliedApiFilters] = useState<{ location: string[]; qualification: string[] }>({
    location: [],
    qualification: [],
  })

  const fetchScholarships = useCallback(
    async (refresh = false, locationFilters: string[] = [], qualificationFilters: string[] = [], keyword = "") => {
      if (refresh) setRefreshing(true)
      else if (locationFilters.length > 0 || qualificationFilters.length > 0 || keyword) setFilterLoading(true)
      else setLoading(true)

      try {
        const params = new URLSearchParams()
        if (refresh) params.set("refresh", "true")
        if (locationFilters.length > 0) params.set("locations", locationFilters.join(","))
        if (qualificationFilters.length > 0) params.set("qualifications", qualificationFilters.join(","))
        if (keyword) params.set("keyword", keyword)

        const url = `/api/scholarships${params.toString() ? `?${params.toString()}` : ""}`
        const response = await fetch(url)
        const data = await response.json()

        if (data.scholarships) {
          setScholarships(data.scholarships)
          setUserProfile(data.userProfile)

          try {
            sessionStorage.setItem("scholarships_cache", JSON.stringify(data.scholarships))
          } catch (e) {
            console.error("Failed to cache scholarships:", e)
          }
        }
      } catch (error) {
        console.error("Error fetching scholarships:", error)
      } finally {
        setLoading(false)
        setRefreshing(false)
        setFilterLoading(false)
        setIsSearching(false)
      }
    },
    [],
  )

  const handleKeywordSearch = () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    fetchScholarships(false, activeFilters.location, activeFilters.qualification, searchQuery.trim())
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleKeywordSearch()
    }
  }

  useEffect(() => {
    fetchScholarships()
  }, [fetchScholarships])

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[category] || []
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
      const newFilters = { ...prev, [category]: updated }

      if (category === "location" || category === "qualification") {
        const newLocationFilters = category === "location" ? updated : prev.location
        const newQualificationFilters = category === "qualification" ? updated : prev.qualification

        const locationsChanged =
          JSON.stringify(newLocationFilters.sort()) !== JSON.stringify(appliedApiFilters.location.sort())
        const qualificationsChanged =
          JSON.stringify(newQualificationFilters.sort()) !== JSON.stringify(appliedApiFilters.qualification.sort())

        if (locationsChanged || qualificationsChanged) {
          setAppliedApiFilters({ location: newLocationFilters, qualification: newQualificationFilters })
          fetchScholarships(false, newLocationFilters, newQualificationFilters)
        }
      }

      return newFilters
    })
  }

  const removeFilter = (category: string, value: string) => {
    setActiveFilters((prev) => {
      const updated = prev[category].filter((v) => v !== value)
      const newFilters = { ...prev, [category]: updated }

      if (category === "location" || category === "qualification") {
        const newLocationFilters = category === "location" ? updated : prev.location
        const newQualificationFilters = category === "qualification" ? updated : prev.qualification
        setAppliedApiFilters({ location: newLocationFilters, qualification: newQualificationFilters })
        fetchScholarships(false, newLocationFilters, newQualificationFilters)
      }

      return newFilters
    })
  }

  const clearAllFilters = () => {
    setActiveFilters({
      fundingType: [],
      location: [],
      qualification: [],
    })
    setSearchQuery("")

    if (appliedApiFilters.location.length > 0 || appliedApiFilters.qualification.length > 0) {
      setAppliedApiFilters({ location: [], qualification: [] })
      fetchScholarships(false, [], [])
    }
  }

  const filteredScholarships = useMemo(() => {
    if (isSearching || filterLoading) {
      return scholarships
    }

    return scholarships.filter((scholarship) => {
      if (activeFilters.fundingType.length > 0) {
        if (!activeFilters.fundingType.some((f) => scholarship.fundingType.toLowerCase().includes(f.toLowerCase()))) {
          return false
        }
      }

      return true
    })
  }, [scholarships, activeFilters.fundingType, isSearching, filterLoading])

  const activeFilterCount = Object.values(activeFilters).flat().length

  if (loading) {
    return <ScholarshipsShimmer />
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">Scholarships</h1>
          {userProfile && (
            <p className="text-slate-500 text-sm">
              Personalized for {userProfile.qualification} in {userProfile.destinations}
            </p>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search scholarships by keyword (e.g., 'Engineering', 'STEM', 'Medicine')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="pl-12 pr-32 h-12 bg-white border-slate-200 rounded-full text-slate-700 placeholder:text-slate-400"
            />
            <Button
              onClick={handleKeywordSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-5 rounded-full bg-slate-800 hover:bg-slate-700 text-white"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching
                </>
              ) : (
                "Start Searching"
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-12 px-6 rounded-full border-slate-200 bg-white"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>

          <Button
            variant="outline"
            onClick={() => fetchScholarships(true, activeFilters.location, activeFilters.qualification)}
            disabled={refreshing}
            className="h-12 px-6 rounded-full border-slate-200 bg-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Active Filters */}
        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-6"
            >
              {Object.entries(activeFilters).map(([category, values]) =>
                values.map((value) => (
                  <motion.button
                    key={`${category}-${value}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={() => removeFilter(category, value)}
                    disabled={filterLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                    {value}
                  </motion.button>
                )),
              )}
              <button
                onClick={clearAllFilters}
                disabled={filterLoading}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl p-6 mb-6 border border-slate-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(FILTER_OPTIONS).map(([category, options]) => (
                  <div key={category}>
                    <h3 className="font-medium text-slate-700 mb-3 capitalize flex items-center gap-2">
                      {category === "fundingType" ? "Funding Type" : category}
                      {(category === "location" || category === "qualification") && (
                        <span className="text-xs text-slate-400 font-normal">(fetches new data)</span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => (
                        <button
                          key={option}
                          onClick={() => toggleFilter(category, option)}
                          disabled={filterLoading}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors disabled:opacity-50 ${
                            activeFilters[category]?.includes(option)
                              ? "bg-slate-800 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <p className="text-slate-500 text-sm mb-4">
          Showing {filteredScholarships.length} of {scholarships.length} scholarships
        </p>

        {filterLoading && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
              <Loader2 className="h-10 w-10 animate-spin text-slate-600 mx-auto mb-4" />
              <p className="text-slate-700 font-medium">Searching scholarships...</p>
              <p className="text-slate-400 text-sm mt-1">
                Finding opportunities in{" "}
                {activeFilters.location.length > 0 ? activeFilters.location.join(", ") : "selected countries"}
              </p>
            </div>
          </div>
        )}

        {/* Scholarship Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredScholarships.map((scholarship, index) => (
            <motion.div
              key={scholarship.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/dashboard/scholarships/${encodeURIComponent(scholarship.id)}`}>
                <div className="bg-slate-800 rounded-2xl p-5 h-full hover:bg-slate-700 transition-colors cursor-pointer group">
                  <h3 className="font-semibold text-white text-lg mb-4 leading-tight line-clamp-2 group-hover:text-slate-100">
                    {scholarship.name}
                  </h3>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Qualification : {scholarship.qualification}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Location : {scholarship.location}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <DollarSign className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>
                        Value of award :{" "}
                        {scholarship.valueMin === 0 && scholarship.valueMax === 0
                          ? "Full Coverage"
                          : `${scholarship.valueMin.toLocaleString()} to ${scholarship.valueMax.toLocaleString()} ${scholarship.currency}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Deadline : {scholarship.deadline}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Briefcase className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>Funding type : {scholarship.fundingType}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-end">
                    <span className="text-slate-400 text-xs group-hover:text-white transition-colors flex items-center gap-1">
                      View details <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filteredScholarships.length === 0 && !filterLoading && (
          <div className="text-center py-16">
            <GraduationCap className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-600 mb-2">No scholarships found</h3>
            <p className="text-slate-400">Try adjusting your filters or search query</p>
            <Button onClick={clearAllFilters} variant="outline" className="mt-4 bg-transparent">
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
