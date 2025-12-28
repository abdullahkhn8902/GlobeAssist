import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCountryImage, normalizeCountryName } from "@/lib/country-images"
import {
  COUNTRY_BUDGET_DATA,
  getCountriesWithinBudget,
  isBudgetSufficientForCountry,
  getTierDescription,
  getMinimumBudget,
} from "@/lib/budget-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

interface CountryJobData {
  name: string
  imageUrl: string
  jobCount: number
  costOfLivingMin: number
  costOfLivingMax: number
  reason: string
  settlementCostMin: number
  settlementCostMax: number
  tier: number
  withinBudget: boolean
}

interface ProfessionalProfile {
  id: string
  user_id: string
  current_job_title: string
  company_name: string
  years_of_experience: number
  industry_field: string
  highest_qualification: string
  preferred_destination: string  // Fixed: snake_case
  budget_min: number
  budget_max: number
  cv_parsed_data: {
    skills?: string[]
    experience?: { title: string; company: string }[]
  } | null
}

const MIN_REQUIRED_COUNTRIES = 4

// Pre-researched cost of living data (monthly in USD)
const PRE_RESEARCHED_COST_OF_LIVING: Record<string, { min: number; max: number }> = {
  "United States": { min: 2000, max: 4000 },
  "United Kingdom": { min: 1800, max: 3500 },
  "Canada": { min: 1700, max: 3200 },
  "Australia": { min: 1800, max: 3500 },
  "Germany": { min: 1200, max: 2500 },
  "France": { min: 1300, max: 2600 },
  "Netherlands": { min: 1500, max: 2800 },
  "Switzerland": { min: 2500, max: 4500 },
  "Sweden": { min: 1600, max: 3000 },
  "Norway": { min: 1800, max: 3500 },
  "Denmark": { min: 1700, max: 3200 },
  "Singapore": { min: 1800, max: 3500 },
  "Japan": { min: 1400, max: 2800 },
  "South Korea": { min: 1300, max: 2500 },
  "China": { min: 800, max: 1800 },
  "United Arab Emirates": { min: 1500, max: 2800 },
  "Saudi Arabia": { min: 1200, max: 2200 },
  "Turkey": { min: 600, max: 1200 },
  "Malaysia": { min: 700, max: 1400 },
  "Poland": { min: 800, max: 1500 },
  "Italy": { min: 1100, max: 2200 },
  "Spain": { min: 1000, max: 2000 },
  "Austria": { min: 1300, max: 2500 },
  "New Zealand": { min: 1400, max: 2700 },
  "Ireland": { min: 1500, max: 2800 },
  "Finland": { min: 1300, max: 2500 },
}

async function getCostOfLiving(countryName: string): Promise<{ costOfLivingMin: number; costOfLivingMax: number }> {
  const normalizedCountry = normalizeCountryName(countryName)
  
  // Use pre-researched data first
  if (PRE_RESEARCHED_COST_OF_LIVING[normalizedCountry]) {
    return {
      costOfLivingMin: PRE_RESEARCHED_COST_OF_LIVING[normalizedCountry].min,
      costOfLivingMax: PRE_RESEARCHED_COST_OF_LIVING[normalizedCountry].max,
    }
  }
  
  // Fallback: Estimate based on settlement cost
  const budgetData = COUNTRY_BUDGET_DATA.find(c => 
    c.country.toLowerCase() === normalizedCountry.toLowerCase()
  )
  
  if (budgetData) {
    // Estimate monthly cost as 40-60% of annual settlement cost divided by 12
    const monthlyMin = Math.round((budgetData.professionalUsdMin * 0.4) / 12)
    const monthlyMax = Math.round((budgetData.professionalUsdMax * 0.6) / 12)
    return {
      costOfLivingMin: Math.max(500, monthlyMin),
      costOfLivingMax: Math.max(1000, monthlyMax),
    }
  }
  
  // Default reasonable range
  return { costOfLivingMin: 1000, costOfLivingMax: 2000 }
}

async function getJobCount(countryName: string, jobTitle: string, industry: string): Promise<number> {
  const normalizedCountry = normalizeCountryName(countryName)
  const budgetData = COUNTRY_BUDGET_DATA.find(c => 
    c.country.toLowerCase() === normalizedCountry.toLowerCase()
  )
  
  if (!budgetData) return Math.floor(Math.random() * 200) + 50
  
  // Tier-based job count estimation
  const tierMultipliers: Record<number, number> = {
    1: 50,   // Turkey, Malaysia, China, Poland
    2: 100,  // Germany, Spain, Italy, Austria, Japan, South Korea
    3: 150,  // Netherlands, France, New Zealand, Ireland, Saudi Arabia, UAE, Finland
    4: 200,  // Australia, Canada, Singapore, Sweden, Denmark
    5: 250,  // USA, UK, Switzerland, Norway
  }
  
  const baseJobs = tierMultipliers[budgetData.tier] || 100
  const randomFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
  return Math.round(baseJobs * randomFactor)
}

async function getCountryRecommendations(
  profile: ProfessionalProfile,
): Promise<{ name: string; reason: string; tier: number }[]> {
  const budgetMax = profile.budget_max || 10000
  const budgetMin = profile.budget_min || 0
  
  // Step 1: Get all affordable countries within budget
  const affordableCountries = getCountriesWithinBudget(budgetMax, "professional")
  
  if (affordableCountries.length === 0) {
    // If no countries within budget, show countries with minimum budget
    const minBudget = getMinimumBudget("professional")
    const fallbackCountries = COUNTRY_BUDGET_DATA
      .filter(c => c.professionalUsdMin <= Math.max(budgetMax, minBudget))
      .sort((a, b) => a.professionalUsdMin - b.professionalUsdMin)
      .slice(0, 6)
    
    return fallbackCountries.map(c => ({
      name: c.country,
      reason: `Budget-friendly option with initial settlement costs of $${c.professionalUsdMin.toLocaleString()}-$${c.professionalUsdMax.toLocaleString()}`,
      tier: c.tier,
    }))
  }
  
  // Step 2: Check if preferred destination is affordable
  const preferredDestination = normalizeCountryName(profile.preferred_destination || "") // FIXED: snake_case
  const isPreferredAffordable = affordableCountries.some(c => 
    c.country.toLowerCase() === preferredDestination.toLowerCase()
  )
  
  // Step 3: Prioritize preferred destination first
  const recommendations: { name: string; reason: string; tier: number }[] = []
  
  if (isPreferredAffordable && preferredDestination) {
    const preferredCountry = affordableCountries.find(c => 
      c.country.toLowerCase() === preferredDestination.toLowerCase()
    )
    if (preferredCountry) {
      recommendations.push({
        name: preferredCountry.country,
        reason: `Your preferred destination - Strong job market in ${profile.industry_field || "your industry"} for professionals with ${profile.years_of_experience || 0} years experience`,
        tier: preferredCountry.tier,
      })
    }
  }
  
  // Step 4: Add other affordable countries (excluding preferred if already added)
  const remainingCountries = affordableCountries.filter(c => 
    !recommendations.some(r => r.name.toLowerCase() === c.country.toLowerCase())
  )
  
  // Sort by tier (lower tier = more affordable)
  remainingCountries.sort((a, b) => a.tier - b.tier)
  
  // Add up to 5 more countries
  const additionalCountries = remainingCountries.slice(0, 5)
  
  additionalCountries.forEach(country => {
    recommendations.push({
      name: country.country,
      reason: `${getTierDescription(country.tier)} option - Good opportunities in ${profile.industry_field || "various industries"} with initial costs of $${country.professionalUsdMin.toLocaleString()}-$${country.professionalUsdMax.toLocaleString()}`,
      tier: country.tier,
    })
  })
  
  // Step 5: If we still don't have enough, add some just below budget
  if (recommendations.length < 4) {
    const slightlyAboveBudget = COUNTRY_BUDGET_DATA
      .filter(c => c.professionalUsdMin > budgetMax && c.professionalUsdMin <= budgetMax * 1.5)
      .sort((a, b) => a.professionalUsdMin - b.professionalUsdMin)
      .slice(0, 4 - recommendations.length)
    
    slightlyAboveBudget.forEach(country => {
      if (!recommendations.some(r => r.name.toLowerCase() === country.country.toLowerCase())) {
        recommendations.push({
          name: country.country,
          reason: `Consider increasing your budget by $${(country.professionalUsdMin - budgetMax).toLocaleString()} for this ${getTierDescription(country.tier).toLowerCase()} destination with excellent opportunities`,
          tier: country.tier,
        })
      }
    })
  }
  
  return recommendations.slice(0, 6)
}

function getSettlementCost(countryName: string): { min: number; max: number; tier: number } {
  const normalized = normalizeCountryName(countryName)
  const budgetData = COUNTRY_BUDGET_DATA.find((c) => c.country.toLowerCase() === normalized.toLowerCase())

  if (budgetData) {
    return {
      min: budgetData.professionalUsdMin,
      max: budgetData.professionalUsdMax,
      tier: budgetData.tier,
    }
  }

  // Default for unknown countries
  return { min: 5000, max: 8000, tier: 3 }
}

function validateCountryData(country: CountryJobData): boolean {
  return (
    typeof country.name === "string" &&
    country.name.length > 0 &&
    typeof country.imageUrl === "string" &&
    country.imageUrl.length > 0 &&
    typeof country.tier === "number" &&
    country.costOfLivingMin > 0 &&
    country.costOfLivingMax >= country.costOfLivingMin
  )
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check cached recommendations
    const { data: cachedData } = await supabase
      .from("job_recommendations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (cachedData && cachedData.length >= MIN_REQUIRED_COUNTRIES) {
      const countries: CountryJobData[] = cachedData.map((rec) => {
        const settlement = getSettlementCost(rec.country_name)
        return {
          name: rec.country_name,
          imageUrl: rec.image_url || getCountryImage(rec.country_name) || "",
          jobCount: rec.job_count || 0,
          costOfLivingMin: rec.cost_of_living_min || 0,
          costOfLivingMax: rec.cost_of_living_max || 0,
          reason: rec.reason || "",
          settlementCostMin: settlement.min,
          settlementCostMax: settlement.max,
          tier: settlement.tier,
          withinBudget: true,
        }
      })

      const allValid = countries.every(validateCountryData)
      if (allValid) {
        console.log("[GlobeAssist Server] Using validated cached job recommendations")
        return NextResponse.json({ success: true, countries, cached: true })
      }
    }

    // Get fresh recommendations
    const { data: profile, error: profileError } = await supabase
      .from("professional_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: "Professional profile not found" }, { status: 404 })
    }

    console.log(`[GlobeAssist Server] Generating job recommendations for ${profile.current_job_title}`)

    const recommendations = await getCountryRecommendations(profile as ProfessionalProfile)
    const budgetMax = profile.budget_max || 10000

    console.log(`[GlobeAssist Server] Processing ${recommendations.length} countries...`)

    const countryPromises = recommendations.map(async (rec) => {
      try {
        console.log(`[GlobeAssist Server] Processing ${rec.name}...`)

        const [costData, jobCount] = await Promise.all([
          getCostOfLiving(rec.name),
          getJobCount(rec.name, profile.current_job_title || "professional", profile.industry_field || "general"),
        ])

        const settlement = getSettlementCost(rec.name)
        const budgetCheck = isBudgetSufficientForCountry(rec.name, budgetMax, "professional")

        const countryData: CountryJobData = {
          name: rec.name,
          imageUrl: getCountryImage(rec.name) || "",
          jobCount: jobCount,
          costOfLivingMin: costData.costOfLivingMin,
          costOfLivingMax: costData.costOfLivingMax,
          reason: rec.reason,
          settlementCostMin: settlement.min,
          settlementCostMax: settlement.max,
          tier: rec.tier,
          withinBudget: budgetCheck.sufficient,
        }

        if (validateCountryData(countryData)) {
          console.log(
            `[GlobeAssist Server] Completed ${rec.name}: ${jobCount} jobs, Monthly Cost: $${costData.costOfLivingMin}-${costData.costOfLivingMax}`
          )
          return countryData
        }
        return null
      } catch (error) {
        console.error(`[GlobeAssist Server] Error processing ${rec.name}:`, error)
        return null
      }
    })

    const countryResults = await Promise.all(countryPromises)
    const countries = countryResults.filter((c): c is CountryJobData => c !== null)

    console.log(`[GlobeAssist Server] Completed processing. Valid countries: ${countries.length}`)

    if (countries.length < MIN_REQUIRED_COUNTRIES) {
      console.error(`[GlobeAssist Server] Insufficient valid countries: ${countries.length}`)
      return NextResponse.json(
        { success: false, error: "Unable to fetch complete data. Please try again." },
        { status: 503 },
      )
    }

    // Store in database
    console.log("[GlobeAssist Server] Storing recommendations in database...")
    await supabase.from("job_recommendations").delete().eq("user_id", user.id)

    const upsertData = countries.map((country) => ({
      user_id: user.id,
      country_name: country.name,
      image_url: country.imageUrl,
      job_count: country.jobCount,
      cost_of_living_min: country.costOfLivingMin,
      cost_of_living_max: country.costOfLivingMax,
      reason: country.reason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase.from("job_recommendations").insert(upsertData)

    if (insertError) {
      console.error("[GlobeAssist Server] Error storing recommendations:", insertError)
    }

    return NextResponse.json({ success: true, countries, cached: false })
  } catch (error) {
    console.error("[GlobeAssist Server] Unexpected error in professional-jobs route:", error)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again later." },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await supabase.from("job_recommendations").delete().eq("user_id", user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GlobeAssist Server] Error deleting job recommendations:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}