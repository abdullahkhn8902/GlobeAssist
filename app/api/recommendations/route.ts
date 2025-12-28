import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { VALID_COUNTRIES, getCountryImage, normalizeCountryName } from "@/lib/country-images"
import {
  getCountriesWithinBudget,
  isBudgetSufficientForCountry,
  getTierDescription,
  getMinimumBudget,
  COUNTRY_BUDGET_DATA,
} from "@/lib/budget-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

interface CountryRecommendation {
  name: string
  reason: string
  tier: number
}

interface CountryData {
  name: string
  imageUrl: string
  universities: number
  costOfLivingMin: number
  costOfLivingMax: number
  reason: string
  tier: number
  withinBudget: boolean
}

interface StudentProfile {
  id: string
  user_id: string
  latest_qualification: string
  university_name: string
  graduation_year: number
  grade_cgpa: string
  currently_studying: boolean
  degree_to_pursue: string
  preferred_destination: string  // Fixed: snake_case
  preferred_year_of_intake: number
  budget_min: number
  budget_max: number
  apply_for_scholarships: boolean
}

// Pre-researched cost of living data for students (monthly in USD)
const PRE_RESEARCHED_STUDENT_COST_OF_LIVING: Record<string, { min: number; max: number }> = {
  "United States": { min: 1200, max: 2500 },
  "United Kingdom": { min: 1100, max: 2200 },
  "Canada": { min: 1000, max: 2000 },
  "Australia": { min: 1100, max: 2200 },
  "Germany": { min: 900, max: 1600 },
  "France": { min: 950, max: 1700 },
  "Netherlands": { min: 1000, max: 1800 },
  "Switzerland": { min: 1500, max: 2800 },
  "Sweden": { min: 1000, max: 1900 },
  "Norway": { min: 1200, max: 2200 },
  "Denmark": { min: 1100, max: 2100 },
  "Singapore": { min: 1000, max: 2000 },
  "Japan": { min: 900, max: 1700 },
  "South Korea": { min: 850, max: 1600 },
  "China": { min: 600, max: 1200 },
  "United Arab Emirates": { min: 1000, max: 2000 },
  "Saudi Arabia": { min: 800, max: 1500 },
  "Turkey": { min: 400, max: 800 },
  "Malaysia": { min: 450, max: 900 },
  "Poland": { min: 500, max: 1000 },
  "Italy": { min: 800, max: 1500 },
  "Spain": { min: 700, max: 1300 },
  "Austria": { min: 900, max: 1600 },
  "New Zealand": { min: 900, max: 1700 },
  "Ireland": { min: 1000, max: 1900 },
  "Finland": { min: 900, max: 1700 },
}

// Pre-researched university counts
const PRE_RESEARCHED_UNIVERSITIES: Record<string, number> = {
  "United States": 5300,
  "United Kingdom": 165,
  "Canada": 223,
  "Australia": 170,
  "Germany": 427,
  "France": 3580,
  "Netherlands": 55,
  "Switzerland": 50,
  "Sweden": 39,
  "Norway": 33,
  "Denmark": 29,
  "Singapore": 34,
  "Japan": 780,
  "South Korea": 374,
  "China": 2956,
  "United Arab Emirates": 70,
  "Saudi Arabia": 60,
  "Turkey": 207,
  "Malaysia": 100,
  "Poland": 400,
  "Italy": 97,
  "Spain": 84,
  "Austria": 72,
  "New Zealand": 36,
  "Ireland": 39,
  "Finland": 39,
}

const MIN_REQUIRED_COUNTRIES = 3

async function getCostOfLiving(countryName: string): Promise<{ costOfLivingMin: number; costOfLivingMax: number }> {
  const normalizedCountry = normalizeCountryName(countryName)
  
  // Use pre-researched data first
  if (PRE_RESEARCHED_STUDENT_COST_OF_LIVING[normalizedCountry]) {
    return {
      costOfLivingMin: PRE_RESEARCHED_STUDENT_COST_OF_LIVING[normalizedCountry].min,
      costOfLivingMax: PRE_RESEARCHED_STUDENT_COST_OF_LIVING[normalizedCountry].max,
    }
  }
  
  // Fallback: Estimate based on settlement cost
  const budgetData = COUNTRY_BUDGET_DATA.find(c => 
    c.country.toLowerCase() === normalizedCountry.toLowerCase()
  )
  
  if (budgetData) {
    // Estimate monthly cost as 30-50% of annual student cost divided by 12
    const monthlyMin = Math.round((budgetData.studentUsdMin * 0.3) / 12)
    const monthlyMax = Math.round((budgetData.studentUsdMax * 0.5) / 12)
    return {
      costOfLivingMin: Math.max(300, monthlyMin),
      costOfLivingMax: Math.max(600, monthlyMax),
    }
  }
  
  // Default reasonable range
  return { costOfLivingMin: 600, costOfLivingMax: 1200 }
}

async function getUniversityCount(countryName: string): Promise<number> {
  const normalizedCountry = normalizeCountryName(countryName)
  
  // Use pre-researched data
  if (PRE_RESEARCHED_UNIVERSITIES[normalizedCountry]) {
    return PRE_RESEARCHED_UNIVERSITIES[normalizedCountry]
  }
  
  // Fallback estimation based on country tier
  const budgetData = COUNTRY_BUDGET_DATA.find(c => 
    c.country.toLowerCase() === normalizedCountry.toLowerCase()
  )
  
  if (budgetData) {
    const tierMultipliers: Record<number, number> = {
      1: 150,   // Turkey, Malaysia, China, Poland
      2: 200,   // Germany, Spain, Italy, Austria, Japan, South Korea
      3: 100,   // Netherlands, France, New Zealand, Ireland, Saudi Arabia, UAE, Finland
      4: 80,    // Australia, Canada, Singapore, Sweden, Denmark
      5: 2000,  // USA has many, UK, Switzerland, Norway
    }
    
    return tierMultipliers[budgetData.tier] || 100
  }
  
  return 50
}

async function getCountryRecommendations(
  profile: StudentProfile,
): Promise<CountryRecommendation[]> {
  const budgetMax = profile.budget_max || 50000
  const budgetMin = profile.budget_min || 0
  
  // Step 1: Get all affordable countries within budget
  const affordableCountries = getCountriesWithinBudget(budgetMax, "student")
  
  if (affordableCountries.length === 0) {
    // If no countries within budget, show countries with minimum budget
    const minBudget = getMinimumBudget("student")
    const fallbackCountries = COUNTRY_BUDGET_DATA
      .filter(c => c.studentUsdMin <= Math.max(budgetMax, minBudget))
      .sort((a, b) => a.studentUsdMin - b.studentUsdMin)
      .slice(0, 8)
    
    return fallbackCountries.map(c => ({
      name: c.country,
      reason: `Budget-friendly study destination with total costs of $${c.studentUsdMin.toLocaleString()}-$${c.studentUsdMax.toLocaleString()}`,
      tier: c.tier,
    }))
  }
  
  // Step 2: Check if preferred destination is affordable
  const preferredDestination = normalizeCountryName(profile.preferred_destination || "") // FIXED: snake_case
  const isPreferredAffordable = affordableCountries.some(c => 
    c.country.toLowerCase() === preferredDestination.toLowerCase()
  )
  
  // Step 3: Prioritize preferred destination first
  const recommendations: CountryRecommendation[] = []
  
  if (isPreferredAffordable && preferredDestination) {
    const preferredCountry = affordableCountries.find(c => 
      c.country.toLowerCase() === preferredDestination.toLowerCase()
    )
    if (preferredCountry) {
      const scholarshipText = profile.apply_for_scholarships 
        ? " (scholarship opportunities available)" 
        : ""
      recommendations.push({
        name: preferredCountry.country,
        reason: `Your preferred destination - Excellent for ${profile.degree_to_pursue} programs${scholarshipText}`,
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
  
  // Add up to 7 more countries
  const additionalCountries = remainingCountries.slice(0, 7)
  
  additionalCountries.forEach(country => {
    const scholarshipText = profile.apply_for_scholarships 
      ? " with good scholarship opportunities" 
      : ""
    recommendations.push({
      name: country.country,
      reason: `${getTierDescription(country.tier)} study destination${scholarshipText} - Total costs: $${country.studentUsdMin.toLocaleString()}-$${country.studentUsdMax.toLocaleString()}`,
      tier: country.tier,
    })
  })
  
  // Step 5: If we still don't have enough, add some just below budget
  if (recommendations.length < 6) {
    const slightlyAboveBudget = COUNTRY_BUDGET_DATA
      .filter(c => c.studentUsdMin > budgetMax && c.studentUsdMin <= budgetMax * 1.3)
      .sort((a, b) => a.studentUsdMin - b.studentUsdMin)
      .slice(0, 6 - recommendations.length)
    
    slightlyAboveBudget.forEach(country => {
      if (!recommendations.some(r => r.name.toLowerCase() === country.country.toLowerCase())) {
        const scholarshipNote = profile.apply_for_scholarships 
          ? " Consider applying for scholarships to cover the difference." 
          : ""
        recommendations.push({
          name: country.country,
          reason: `Consider increasing your budget by $${(country.studentUsdMin - budgetMax).toLocaleString()} for this ${getTierDescription(country.tier).toLowerCase()} destination${scholarshipNote}`,
          tier: country.tier,
        })
      }
    })
  }
  
  return recommendations.slice(0, 8)
}

function validateCountryData(country: CountryData): boolean {
  return (
    typeof country.name === "string" &&
    country.name.length > 0 &&
    typeof country.imageUrl === "string" &&
    country.imageUrl.length > 0 &&
    typeof country.universities === "number" &&
    country.universities > 0 &&
    typeof country.costOfLivingMin === "number" &&
    country.costOfLivingMin > 0 &&
    typeof country.costOfLivingMax === "number" &&
    country.costOfLivingMax >= country.costOfLivingMin
  )
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to get recommendations." },
        { status: 401 },
      )
    }

    console.log(`[GlobeAssist Server] Fetching recommendations for user: ${user.id}`)

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("profile_type")
      .eq("user_id", user.id)
      .maybeSingle()

    const profileType = userProfile?.profile_type || "student"
    console.log(`[GlobeAssist Server] User profile type: ${profileType}`)

    // Check cached recommendations
    const { data: existingRecommendations } = await supabase
      .from("country_recommendations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (existingRecommendations && existingRecommendations.length >= MIN_REQUIRED_COUNTRIES) {
      const countries: CountryData[] = existingRecommendations.map((rec) => ({
        name: rec.country_name,
        imageUrl: rec.image_url,
        universities: rec.universities,
        costOfLivingMin: rec.cost_of_living_min,
        costOfLivingMax: rec.cost_of_living_max,
        reason: rec.reason || "",
        tier: 3,
        withinBudget: true,
      }))

      const completeCountries = countries.filter(validateCountryData)

      if (completeCountries.length >= MIN_REQUIRED_COUNTRIES) {
        console.log(`[GlobeAssist Server] Found ${completeCountries.length} complete cached recommendations`)

        const { data: studentProfile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()

        return NextResponse.json({
          success: true,
          countries: completeCountries,
          cached: true,
          profile: studentProfile ? {
            degreeToPursue: studentProfile.degree_to_pursue,
            preferredDestination: studentProfile.preferred_destination,
            budgetRange: `$${studentProfile.budget_min} - $${studentProfile.budget_max}`,
          } : null,
        })
      }
    }

    // Get fresh recommendations
    console.log(`[GlobeAssist Server] No valid cached recommendations found, generating new ones`)
    
    const { data: studentProfile, error: profileError } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profileError || !studentProfile) {
      return NextResponse.json(
        { success: false, error: "Student profile not found. Please complete your profile first." },
        { status: 404 },
      )
    }

    console.log(`[GlobeAssist Server] Starting recommendations for profile:`, studentProfile.degree_to_pursue)

    const recommendations = await getCountryRecommendations(studentProfile as StudentProfile)
    console.log(`[GlobeAssist Server] Got ${recommendations.length} recommendations`)

    console.log("[GlobeAssist Server] Fetching data for all recommended countries...")

    const countryPromises = recommendations.map(async (rec) => {
      const normalizedName = normalizeCountryName(rec.name)
      const imageUrl = getCountryImage(normalizedName)

      if (!imageUrl) {
        console.log(`[GlobeAssist Server] No image for ${normalizedName}`)
        return null
      }

      try {
        const [costData, universities] = await Promise.all([
          getCostOfLiving(normalizedName),
          getUniversityCount(normalizedName),
        ])

        const budgetCheck = isBudgetSufficientForCountry(normalizedName, studentProfile.budget_max, "student")

        return {
          name: normalizedName,
          imageUrl,
          universities: universities,
          costOfLivingMin: costData.costOfLivingMin,
          costOfLivingMax: costData.costOfLivingMax,
          reason: rec.reason,
          tier: rec.tier,
          withinBudget: budgetCheck.sufficient,
        }
      } catch (error) {
        console.error(`[GlobeAssist Server] Error fetching data for ${normalizedName}:`, error)
        return null
      }
    })

    const results = await Promise.all(countryPromises)
    const countries = results.filter((c): c is CountryData => c !== null && validateCountryData(c))

    console.log(`[GlobeAssist Server] Valid countries: ${countries.length}`)

    if (countries.length < MIN_REQUIRED_COUNTRIES) {
      console.error(`[GlobeAssist Server] Insufficient valid countries: ${countries.length}`)
      return NextResponse.json(
        { success: false, error: "Unable to fetch complete data. Please try again." },
        { status: 503 },
      )
    }

    // Store in database
    console.log("[GlobeAssist Server] Writing dataset to database...")
    await supabase.from("country_recommendations").delete().eq("user_id", user.id)

    const recommendationsToInsert = countries.map((country) => ({
      user_id: user.id,
      country_name: country.name,
      image_url: country.imageUrl,
      universities: country.universities,
      cost_of_living_min: country.costOfLivingMin,
      cost_of_living_max: country.costOfLivingMax,
      reason: country.reason,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase.from("country_recommendations").insert(recommendationsToInsert)

    if (insertError) {
      console.error("[GlobeAssist Server] Error storing recommendations:", insertError)
    }

    console.log(`[GlobeAssist Server] Successfully stored ${countries.length} recommendations`)

    return NextResponse.json({
      success: true,
      countries: countries,
      cached: false,
      profile: {
        degreeToPursue: studentProfile.degree_to_pursue,
        preferredDestination: studentProfile.preferred_destination,
        budgetRange: studentProfile.budget_min ? `$${studentProfile.budget_min} - $${studentProfile.budget_max}` : "N/A",
      },
    })
  } catch (error) {
    console.error("[GlobeAssist Server] Error in recommendations API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get recommendations. Please try again.",
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await supabase.from("country_recommendations").delete().eq("user_id", user.id)

    return NextResponse.json({ success: true, message: "Recommendations cleared" })
  } catch (error) {
    console.error("[GlobeAssist Server] Error in DELETE recommendations:", error)
    return NextResponse.json({ success: false, error: "Failed to clear recommendations" }, { status: 500 })
  }
}