import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCountryImage, normalizeCountryName } from "@/lib/country-images"
import {
  COUNTRY_BUDGET_DATA,
  getCountriesWithinBudget,
  isBudgetSufficientForCountry,
  getTierDescription,
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
  preferred_destination: string
  budget_min: number
  budget_max: number
  cv_parsed_data: {
    skills?: string[]
    experience?: { title: string; company: string }[]
  } | null
}

const PERPLEXITY_API_KEY = process.env.OPENROUTER_API_KEY_SONAR_SEARCH
const MIN_REQUIRED_COUNTRIES = 4

const COST_TTL_MS = 1000 * 60 * 60 * 3
const costCache = new Map<string, { expires: number; min: number; max: number }>()

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 45000, ...rest } = init
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, { ...rest, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

async function perplexityChat(messages: any[], title: string, maxRetries = 3): Promise<any> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("Perplexity API key is not configured")
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        timeoutMs: 45000,
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.VERCEL_URL || "http://localhost:3000",
          "X-Title": title,
        },
        body: JSON.stringify({
          model: "perplexity/sonar-pro-search",
          messages,
          temperature: 0.1,
          max_tokens: 300,
        }),
      })

      if (res.ok) {
        return res.json()
      }

      if (res.status === 429) {
        // Rate limited - wait and retry
        const waitTime = 2000 * (attempt + 1)
        console.log(`[GlobeAssist Server] Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`)
        await sleep(waitTime)
        continue
      }

      throw new Error(`API error: ${res.status}`)
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log(`[GlobeAssist Server] Request timeout on attempt ${attempt + 1}/${maxRetries}`)
        await sleep(1000 * (attempt + 1))
        continue
      }

      if (attempt === maxRetries - 1) {
        throw error
      }

      await sleep(1000 * (attempt + 1))
    }
  }

  throw new Error("Max retries exceeded for Perplexity API")
}

async function getCostOfLiving(countryName: string): Promise<{ costOfLivingMin: number; costOfLivingMax: number }> {
  const cacheKey = `${countryName.toLowerCase()}_professional`
  const cached = costCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return { costOfLivingMin: cached.min, costOfLivingMax: cached.max }
  }

  try {
    const year = new Date().getFullYear()

    const data = await perplexityChat(
      [
        {
          role: "user",
          content: `What is the MONTHLY cost of living for a single professional/expat in ${countryName} in ${year}? Include rent, food, transport, utilities. Return ONLY a JSON object like {"min": 1500, "max": 3000} with USD amounts. If you cannot find specific data, return {"min": 0, "max": 0}. No explanation.`,
        },
      ],
      "Cost of Living Analysis",
    )

    const content = data.choices?.[0]?.message?.content || ""

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    // If no JSON found, try to parse as plain numbers
    if (!jsonMatch) {
      const numRegex = /(\d[\d,]*)/g
      const numbers = content.match(numRegex)
      if (numbers && numbers.length >= 2) {
        const min = Math.max(0, Number.parseInt(numbers[0].replace(/,/g, ""))) || 0
        const max = Math.max(0, Number.parseInt(numbers[1].replace(/,/g, ""))) || 0
        if (min > 0 && max >= min) {
          costCache.set(cacheKey, { expires: Date.now() + COST_TTL_MS, min, max })
          return { costOfLivingMin: min, costOfLivingMax: max }
        }
      }
      return { costOfLivingMin: 0, costOfLivingMax: 0 }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.min !== undefined && parsed.max !== undefined) {
        const min = Math.max(0, Number(parsed.min))
        const max = Math.max(0, Number(parsed.max))

        if (min > 0 && max >= min) {
          costCache.set(cacheKey, { expires: Date.now() + COST_TTL_MS, min, max })
          return { costOfLivingMin: min, costOfLivingMax: max }
        }
      }
    } catch (e) {
      console.error(`[GlobeAssist Server] Failed to parse cost JSON for ${countryName}:`, e)
    }

    return { costOfLivingMin: 0, costOfLivingMax: 0 }
  } catch (error) {
    console.error(`[GlobeAssist Server] Error getting cost of living for ${countryName}:`, error)
    return { costOfLivingMin: 0, costOfLivingMax: 0 }
  }
}

async function getJobCount(countryName: string, jobTitle: string, industry: string): Promise<number> {
  try {
    // Try to get actual job count data from Perplexity
    const data = await perplexityChat(
      [
        {
          role: "user",
          content: `Search for current job openings for "${jobTitle}" positions in ${countryName} in the ${industry} industry. Look at major job portals. Return ONLY a JSON object with a single key "jobCount" containing the estimated number of job openings as a number. Example: {"jobCount": 2500}. No explanation.`,
        },
      ],
      "Job Market Analysis",
      2, // Fewer retries for job count
    )

    const content = data.choices?.[0]?.message?.content || ""
    const jsonMatch = content.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.jobCount !== undefined) {
          const count = Math.max(0, Math.min(Number(parsed.jobCount), 100000))
          console.log(`[GlobeAssist Server] Job count for ${countryName} (${jobTitle}): ${count}`)
          return count
        }
      } catch (e) {
        console.error(`[GlobeAssist Server] Failed to parse job count JSON for ${countryName}:`, e)
      }
    }

    // Fallback: Look for any number in the response
    const numRegex = /\d[\d,]*/
    const numMatch = content.match(numRegex)
    if (numMatch) {
      const count = Number.parseInt(numMatch[0].replace(/,/g, "")) || 0
      const reasonableCount = Math.max(20, Math.min(count, 5000))
      console.log(`[GlobeAssist Server] Fallback job count for ${countryName}: ${reasonableCount}`)
      return reasonableCount
    }

    // Final fallback: Use tier-based estimation
    console.log(`[GlobeAssist Server] Using tier-based estimation for ${countryName}`)
    const budgetData = COUNTRY_BUDGET_DATA.find((c) => c.country.toLowerCase() === countryName.toLowerCase())

    if (budgetData) {
      // Tier 1: Very high job market (US, UK, etc.)
      // Tier 2: High job market (Canada, Australia, etc.)
      // Tier 3: Medium job market (Germany, France, etc.)
      // Tier 4: Lower job market
      // Tier 5: Developing markets
      const baseJobs = [800, 500, 300, 150, 50][budgetData.tier - 1] || 100
      const randomFactor = 0.8 + Math.random() * 0.4 // 0.8 to 1.2
      const estimatedJobs = Math.round(baseJobs * randomFactor)
      console.log(`[GlobeAssist Server] Tier-based job count for ${countryName} (T${budgetData.tier}): ${estimatedJobs}`)
      return estimatedJobs
    }

    return Math.floor(Math.random() * 200) + 50
  } catch (error) {
    console.error(`[GlobeAssist Server] Error getting job count for ${countryName}:`, error)
    // Conservative fallback
    return Math.floor(Math.random() * 150) + 30
  }
}

async function getCountryRecommendations(
  profile: ProfessionalProfile,
): Promise<{ name: string; reason: string; tier: number }[]> {
  const budgetMax = profile.budget_max || 10000

  const affordableCountries = getCountriesWithinBudget(budgetMax, "professional")
  const affordableNames = affordableCountries.map((c) => c.country)

  const preferredDestination = normalizeCountryName(profile.preferred_destination || "")
  const isPreferredAffordable = preferredDestination && affordableNames.includes(preferredDestination)

  if (!PERPLEXITY_API_KEY) {
    console.log("[GlobeAssist Server] No Perplexity API key, using budget-filtered countries")
    const recommendations = affordableCountries.slice(0, 6).map((c) => ({
      name: c.country,
      reason: `${getTierDescription(c.tier)} option - Settlement cost: $${c.professionalUsdMin.toLocaleString()}-$${c.professionalUsdMax.toLocaleString()}`,
      tier: c.tier,
    }))

    if (isPreferredAffordable) {
      const preferredIndex = recommendations.findIndex((r) => r.name === preferredDestination)
      if (preferredIndex > 0) {
        const [preferred] = recommendations.splice(preferredIndex, 1)
        recommendations.unshift(preferred)
      }
    }

    return recommendations
  }

  const skills = profile.cv_parsed_data?.skills?.slice(0, 5).join(", ") || "Not specified"
  const experience = profile.years_of_experience || 0

  const affordableList = affordableCountries
    .slice(0, 12)
    .map((c) => `${c.country} (T${c.tier}: $${c.professionalUsdMin}-${c.professionalUsdMax})`)
    .join(", ")

  const prompt = `You are a career relocation advisor. Recommend 6 countries for job opportunities for this professional:

PROFILE:
- Job Title: ${profile.current_job_title || "Professional"}
- Industry: ${profile.industry_field || "General"}
- Experience: ${experience} years
- Key Skills: ${skills}
- Highest Qualification: ${profile.highest_qualification || "Degree"}
- Budget for Relocation: $${budgetMax} USD
- Preferred Destination: ${profile.preferred_destination || "Open to suggestions"}

AFFORDABLE COUNTRIES (MUST choose ONLY from this list):
${affordableList}

IMPORTANT RULES:
1. Select exactly 6 countries from the affordable list above
2. Consider job market strength for "${profile.industry_field}" industry
3. Consider career growth opportunities for ${experience} years experience
4. ${isPreferredAffordable ? `PRIORITY: Include "${preferredDestination}" as the FIRST recommendation since it's within budget` : `Note: User prefers "${preferredDestination}" but it may be outside budget`}
5. Provide specific, personalized reasons (15-20 words max)

Return ONLY valid JSON with this exact structure:
{
  "countries": [
    {"name": "CountryName", "reason": "Specific reason here", "tier": 1},
    ...
  ]
}`

  try {
    console.log("[GlobeAssist Server] Getting personalized country recommendations from Perplexity")
    const data = await perplexityChat([{ role: "user", content: prompt }], "Professional Country Recommendations")

    const content = data.choices?.[0]?.message?.content || ""
    let clean = content.trim()

    if (clean.startsWith("```json")) clean = clean.slice(7)
    else if (clean.startsWith("```")) clean = clean.slice(3)
    if (clean.endsWith("```")) clean = clean.slice(0, -3)

    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])

        if (parsed.countries && Array.isArray(parsed.countries)) {
          const validRecommendations = parsed.countries
            .map((c: { name: string; reason: string; tier?: number }) => {
              const normalized = normalizeCountryName(c.name)
              const budgetInfo = isBudgetSufficientForCountry(normalized, budgetMax, "professional")
              return {
                name: normalized,
                reason: c.reason || "Strong job market and career opportunities for your profile",
                tier: c.tier || budgetInfo.tier,
              }
            })
            .filter((c: { name: string }) => {
              const withinBudget = isBudgetSufficientForCountry(c.name, budgetMax, "professional").sufficient
              const hasImage = getCountryImage(c.name) !== null
              const isValidCountry = affordableNames.includes(c.name)
              return withinBudget && hasImage && isValidCountry
            })

          if (validRecommendations.length >= 3) {
            if (isPreferredAffordable) {
              const preferredIndex = validRecommendations.findIndex(
                (r: { name: string }) => r.name === preferredDestination,
              )
              if (preferredIndex > 0) {
                const [preferred] = validRecommendations.splice(preferredIndex, 1)
                validRecommendations.unshift(preferred)
              }
            }

            const existingNames = new Set(validRecommendations.map((r: { name: string }) => r.name.toLowerCase()))
            for (const affordable of affordableCountries) {
              if (validRecommendations.length >= 6) break
              if (
                !existingNames.has(affordable.country.toLowerCase()) &&
                getCountryImage(affordable.country) !== null
              ) {
                validRecommendations.push({
                  name: affordable.country,
                  reason: `${getTierDescription(affordable.tier)} - Good career opportunities in ${profile.industry_field || "your field"} with your ${experience} years experience`,
                  tier: affordable.tier,
                })
                existingNames.add(affordable.country.toLowerCase())
              }
            }
            console.log(`[GlobeAssist Server] Perplexity returned ${validRecommendations.length} valid recommendations`)
            return validRecommendations.slice(0, 6)
          }
        }
      } catch (error) {
        console.error("[GlobeAssist Server] Failed to parse recommendations JSON:", error)
      }
    }
  } catch (error) {
    console.error("[GlobeAssist Server] Error getting country recommendations from Perplexity:", error)
  }

  console.log("[GlobeAssist Server] Using fallback budget-based recommendations")
  const fallbackRecommendations = affordableCountries
    .filter((c) => getCountryImage(c.country) !== null)
    .slice(0, 6)
    .map((c) => ({
      name: c.country,
      reason: `${getTierDescription(c.tier)} - Strong job opportunities in ${profile.industry_field || "various industries"} for professionals with ${profile.years_of_experience || 0} years experience`,
      tier: c.tier,
    }))

  if (isPreferredAffordable) {
    const preferredIndex = fallbackRecommendations.findIndex((r) => r.name === preferredDestination)
    if (preferredIndex > 0) {
      const [preferred] = fallbackRecommendations.splice(preferredIndex, 1)
      fallbackRecommendations.unshift(preferred)
    }
  }

  return fallbackRecommendations
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
    typeof country.tier === "number"
  )
}

export async function GET() {
  try {
    if (!PERPLEXITY_API_KEY) {
      console.error("[GlobeAssist Server] Perplexity API key is not configured")
      return NextResponse.json({ success: false, error: "API configuration error" }, { status: 500 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

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

    console.log(`[GlobeAssist Server] Fetching detailed data for ${recommendations.length} countries in parallel...`)

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
            `[GlobeAssist Server] Completed ${rec.name}: ${jobCount} jobs, Cost: $${costData.costOfLivingMin}-${costData.costOfLivingMax}`,
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
