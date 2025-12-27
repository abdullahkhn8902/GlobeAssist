import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { VALID_COUNTRIES, getCountryImage, normalizeCountryName } from "@/lib/country-images"
import { generateBudgetContextForLLM, getCountriesWithinBudget, BUDGET_TIERS } from "@/lib/budget-data"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 120

interface CountryRecommendation {
  name: string
  reason: string
}

interface CountryData {
  name: string
  imageUrl: string
  universities: number
  costOfLivingMin: number
  costOfLivingMax: number
}

interface SerperResult {
  title: string
  snippet: string
  link: string
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
  preferred_destination: string
  preferred_year_of_intake: number
  budget_min: number
  budget_max: number
  apply_for_scholarships: boolean
}

interface ProfessionalProfile {
  id: string
  user_id: string
  highest_qualification: string
  company_name: string
  years_of_experience: number
  industry_field: string
  preferred_destination: string
  budget_min: number
  budget_max: number
}

const OPENROUTER_API_KEYS = [
  process.env.OPENROUTER_API_KEY,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
  process.env.OPENROUTER_API_KEY_4,
  process.env.OPENROUTER_API_KEY_5,
  process.env.OPENROUTER_API,
  process.env.OPENROUTER_API_KEY_MISTRAL_FREE,
].filter((key): key is string => Boolean(key))

const PERPLEXITY_API_KEY = process.env.OPENROUTER_API_KEY_SONAR_SEARCH

const MIN_REQUIRED_COUNTRIES = 3

// Track which keys are rate-limited and when they reset
const rateLimitedKeys = new Map<string, number>()
let currentKeyIndex = 0

function getNextAvailableKey(): string | null {
  const now = Date.now()

  for (let i = 0; i < OPENROUTER_API_KEYS.length; i++) {
    const index = (currentKeyIndex + i) % OPENROUTER_API_KEYS.length
    const key = OPENROUTER_API_KEYS[index]
    const resetTime = rateLimitedKeys.get(key)

    if (!resetTime || resetTime < now) {
      rateLimitedKeys.delete(key)
      currentKeyIndex = index
      return key
    }
  }

  let soonestReset = Number.POSITIVE_INFINITY
  let soonestKey: string | null = null

  for (const key of OPENROUTER_API_KEYS) {
    const resetTime = rateLimitedKeys.get(key) || 0
    if (resetTime < soonestReset) {
      soonestReset = resetTime
      soonestKey = key
    }
  }

  return soonestKey
}

function markKeyAsRateLimited(key: string, resetTime?: number) {
  const resetAt = resetTime || Date.now() + 60000
  rateLimitedKeys.set(key, resetAt)
  console.log(`[v0] Key ending in ...${key.slice(-8)} rate-limited until ${new Date(resetAt).toISOString()}`)
}

class RateLimitedQueue {
  private queue: (() => Promise<unknown>)[] = []
  private processing = false
  private lastRequestTime = 0
  private readonly minDelay: number

  constructor(minDelay = 250) {
    this.minDelay = minDelay
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return
    this.processing = true

    while (this.queue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime

      if (timeSinceLastRequest < this.minDelay) {
        await new Promise((resolve) => setTimeout(resolve, this.minDelay - timeSinceLastRequest))
      }

      const fn = this.queue.shift()
      if (fn) {
        this.lastRequestTime = Date.now()
        await fn()
      }
    }

    this.processing = false
  }
}

const serperQueue = new RateLimitedQueue(250)
const openRouterQueue = new RateLimitedQueue(650)

const COST_TTL_MS = 1000 * 60 * 60 * 3
const UNIS_TTL_MS = 1000 * 60 * 60 * 12

const costCache = new Map<string, { expires: number; min: number; max: number }>()
const unisCache = new Map<string, { expires: number; count: number }>()

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 30000, ...rest } = init
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, { ...rest, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

function stripModelNoise(text: string): string {
  return text
    .replace(/<Thinking>[\s\S]*?<\/think>/gi, "")
    .replace(/<Thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<Thinking>[\s\S]*?<\/Thinking>/gi, "")
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim()
}

function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1].trim()

  const first = text.indexOf("{")
  const last = text.lastIndexOf("}")
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1).trim()
  }

  return null
}

function toInt(n: string): number {
  const cleaned = n.replace(/,/g, "").trim()
  const asNum = Number.parseFloat(cleaned)
  if (!Number.isFinite(asNum)) return 0
  return Math.round(asNum)
}

function extractUsdMonthlyRangeFromText(text: string): { min: number; max: number } | null {
  const t = text
  const ranges: Array<{ min: number; max: number }> = []

  const re1 =
    /(?:US\$|\$|USD)\s*([\d]{2,5}(?:,\d{3})*)(?:\s*)(?:-|–|—|to)\s*(?:US\$|\$|USD)?\s*([\d]{2,5}(?:,\d{3})*)/gi
  const re2 = /([\d]{2,5}(?:,\d{3})*)\s*(?:USD|US\$)\s*(?:-|–|—|to)\s*([\d]{2,5}(?:,\d{3})*)\s*(?:USD|US\$)/gi

  for (const re of [re1, re2]) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(t)) !== null) {
      const min = toInt(m[1])
      const max = toInt(m[2])
      if (min >= 200 && max >= min && max <= 15000) ranges.push({ min, max })
    }
  }

  if (ranges.length > 0) {
    ranges.sort((a, b) => a.max - a.min - (b.max - b.min))
    return ranges[0]
  }

  const nums: number[] = []

  const money1 = t.match(/(?:US\$|\$)\s*([\d]{2,5}(?:,\d{3})*)/gi) || []
  for (const s of money1) {
    const n = s.replace(/(?:US\$|\$)/gi, "").trim()
    const v = toInt(n)
    if (v >= 200 && v <= 15000) nums.push(v)
  }

  const money2 = t.match(/([\d]{2,5}(?:,\d{3})*)\s*(?:USD|US Dollars|US\$)/gi) || []
  for (const s of money2) {
    const n = s.replace(/(?:USD|US Dollars|US\$)/gi, "").trim()
    const v = toInt(n)
    if (v >= 200 && v <= 15000) nums.push(v)
  }

  if (nums.length >= 2) {
    nums.sort((a, b) => a - b)
    return { min: nums[0], max: nums[nums.length - 1] }
  }

  return null
}

async function openRouterChat(body: Record<string, unknown>, title: string) {
  return openRouterQueue.add(async () => {
    const maxKeyAttempts = OPENROUTER_API_KEYS.length
    const maxRetriesPerKey = 3 // Increased retries
    let lastErrText = ""
    let keysAttempted = 0

    while (keysAttempted < maxKeyAttempts) {
      const currentKey = getNextAvailableKey()

      if (!currentKey) {
        const waitTime = Math.min(...Array.from(rateLimitedKeys.values())) - Date.now()
        if (waitTime > 0 && waitTime < 120000) {
          console.log(`[v0] All keys rate-limited. Waiting ${Math.ceil(waitTime / 1000)}s for reset...`)
          await sleep(waitTime + 1000)
          continue
        }
        throw new Error("All OpenRouter API keys are rate-limited. Please try again later.")
      }

      console.log(`[v0] Using API key ending in ...${currentKey.slice(-8)}`)

      for (let retry = 0; retry < maxRetriesPerKey; retry++) {
        try {
          const res = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            timeoutMs: 45000, // Increased timeout
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${currentKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": process.env.VERCEL_URL || "http://localhost:3000",
              "X-Title": title,
            },
            body: JSON.stringify(body),
          })

          if (res.ok) {
            return res.json()
          }

          lastErrText = await res.text()

          if (res.status === 429) {
            let resetTime: number | undefined
            try {
              const errorData = JSON.parse(lastErrText)
              const resetHeader = errorData?.error?.metadata?.headers?.["X-RateLimit-Reset"]
              if (resetHeader) {
                resetTime = Number.parseInt(resetHeader, 10)
              }
            } catch {
              // Use default reset time
            }

            markKeyAsRateLimited(currentKey, resetTime)
            console.log(`[v0] Key rate-limited (429). Switching to next key...`)
            break
          }

          if (res.status === 502 || res.status === 503) {
            const backoff = Math.min(8000, 600 * 2 ** retry) + Math.floor(Math.random() * 250)
            console.warn(
              `[v0] OpenRouter ${res.status}. Retry in ${backoff}ms (retry ${retry + 1}/${maxRetriesPerKey})`,
            )
            await sleep(backoff)
            continue
          }

          throw new Error(`OpenRouter API error: ${res.status} - ${lastErrText}`)
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            console.warn(`[v0] Request timeout. Retry ${retry + 1}/${maxRetriesPerKey}`)
            await sleep(1000)
            continue
          }
          throw error
        }
      }

      keysAttempted++
      currentKeyIndex = (currentKeyIndex + 1) % OPENROUTER_API_KEYS.length
    }

    throw new Error(
      `OpenRouter API error: All ${OPENROUTER_API_KEYS.length} API keys exhausted or rate-limited. Last error: ${lastErrText || "Rate limited"}`,
    )
  })
}

async function getCostOfLivingWithLLM(
  countryName: string,
): Promise<{ costOfLivingMin: number; costOfLivingMax: number }> {
  const serperKey = process.env.SERPER_GOOGLE_SEARCH_API
  if (!serperKey) {
    console.log(`[v0] Missing SERPER_GOOGLE_SEARCH_API`)
    return { costOfLivingMin: 0, costOfLivingMax: 0 }
  }

  const cacheKey = countryName.toLowerCase()
  const cached = costCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return { costOfLivingMin: cached.min, costOfLivingMax: cached.max }
  }

  try {
    const year = new Date().getFullYear()

    const searchResponse = await serperQueue.add(async () => {
      const response = await fetchWithTimeout("https://google.serper.dev/search", {
        method: "POST",
        timeoutMs: 15000,
        cache: "no-store",
        headers: {
          "X-API-KEY": serperKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: `"${countryName}" student monthly cost of living ${year} in USD rent food transport utilities`,
          num: 10,
        }),
      })

      if (!response.ok) {
        console.log(`[v0] Serper failed for ${countryName}: ${response.status}`)
        return null
      }
      return response.json()
    })

    if (!searchResponse) return { costOfLivingMin: 0, costOfLivingMax: 0 }

    const searchData = [
      searchResponse.answerBox?.answer || "",
      searchResponse.answerBox?.snippet || "",
      searchResponse.knowledgeGraph?.description || "",
      ...(searchResponse.organic || []).map((r: SerperResult) => `${r.title}: ${r.snippet}`),
    ]
      .filter(Boolean)
      .join("\n")
      .substring(0, 4500)

    const quick = extractUsdMonthlyRangeFromText(searchData)
    if (quick) {
      costCache.set(cacheKey, { expires: Date.now() + COST_TTL_MS, min: quick.min, max: quick.max })
      return { costOfLivingMin: quick.min, costOfLivingMax: quick.max }
    }

    const llmData = await openRouterChat(
      {
        model: "perplexity/sonar-pro-search",
        messages: [
          {
            role: "system",
            content:
              'You are a strict extractor. From the given search text, extract a MONTHLY student cost-of-living min/max in USD ONLY if explicit USD numbers exist. Do NOT estimate or guess. If not found, return {"min":0,"max":0}. Output ONLY valid JSON.',
          },
          {
            role: "user",
            content: `Country: ${countryName}

Return ONLY: {"min":NUMBER,"max":NUMBER}

SEARCH RESULTS:
${searchData}`,
          },
        ],
        temperature: 0.0,
        max_tokens: 120,
      },
      "StudyAbroad Cost Analysis",
    )

    const content = llmData.choices?.[0]?.message?.content || ""
    const clean = stripModelNoise(content)

    const match = clean.match(/\{\s*"min"\s*:\s*([\d,]+)\s*,\s*"max"\s*:\s*([\d,]+)\s*\}/i)
    if (match?.[1] && match?.[2]) {
      const min = toInt(match[1])
      const max = toInt(match[2])

      if (min === 0 && max === 0) {
        return { costOfLivingMin: 0, costOfLivingMax: 0 }
      }

      if (min >= 200 && max >= min && max <= 15000) {
        costCache.set(cacheKey, { expires: Date.now() + COST_TTL_MS, min, max })
        return { costOfLivingMin: min, costOfLivingMax: max }
      }
    }

    console.log(`[v0] Could not parse cost for ${countryName}. LLM said: ${clean.slice(0, 200)}`)
    return { costOfLivingMin: 0, costOfLivingMax: 0 }
  } catch (error) {
    console.error(`[v0] Cost of living error for ${countryName}:`, error)
    return { costOfLivingMin: 0, costOfLivingMax: 0 }
  }
}

async function getAIRecommendations(
  profile: StudentProfile,
  profileType: "student" | "professional" = "student",
): Promise<CountryRecommendation[]> {
  const validCountriesList = VALID_COUNTRIES.join(", ")

  const affordableCountries = getCountriesWithinBudget(profile.budget_max, profileType)
  const affordableNames = affordableCountries.map((c) => c.country)

  const preferredDestination = normalizeCountryName(profile.preferred_destination || "")
  const isPreferredAffordable = preferredDestination && affordableNames.includes(preferredDestination)

  const budgetContext = generateBudgetContextForLLM(profile.budget_max, profileType)

  const tierInfo = Object.entries(BUDGET_TIERS)
    .map(([tier, data]) => `T${tier}:${data.countries.join(",")}`)
    .join("|")

  const prompt = `You are an expert study abroad counselor. Recommend 10-12 best countries based on profile and BUDGET CONSTRAINTS.

PROFILE:
- Qualification: ${profile.latest_qualification}
- Degree: ${profile.degree_to_pursue}
- Budget: $${profile.budget_max} USD
- Preferred: ${profile.preferred_destination || "None"}
- Scholarships: ${profile.apply_for_scholarships}

BUDGET DATA (pre-computed):
${budgetContext}
TIERS:${tierInfo}

RULES:
1. ONLY from: ${validCountriesList}
2. PRIORITIZE affordable countries: ${affordableNames.slice(0, 10).join(", ")}
3. ${isPreferredAffordable ? `IMPORTANT: Include "${preferredDestination}" as the FIRST recommendation since it's within the user's budget` : `Note: User prefers "${preferredDestination}" but consider if it's affordable`}
4. Consider scholarship opportunities for budget stretch
5. Return ONLY valid JSON

{"countries":[{"name":"Country","reason":"15 words max"}]}`

  if (PERPLEXITY_API_KEY) {
    try {
      console.log("[v0] Using Perplexity Sonar Pro for recommendations")

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://v0.dev",
        },
        body: JSON.stringify({
          model: "perplexity/sonar-pro-search",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: 600,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ""

        let clean = content.trim()
        if (clean.startsWith("```json")) clean = clean.slice(7)
        else if (clean.startsWith("```")) clean = clean.slice(3)
        if (clean.endsWith("```")) clean = clean.slice(0, -3)

        const jsonMatch = clean.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])

          if (parsed.countries && Array.isArray(parsed.countries)) {
            const validRecommendations = parsed.countries
              .map((c: CountryRecommendation) => ({
                name: normalizeCountryName(c.name),
                reason: c.reason,
              }))
              .filter((c: CountryRecommendation) => getCountryImage(c.name) !== null)

            if (validRecommendations.length >= 6) {
              if (isPreferredAffordable) {
                const preferredIndex = validRecommendations.findIndex(
                  (r: CountryRecommendation) => r.name === preferredDestination,
                )
                if (preferredIndex > 0) {
                  const [preferred] = validRecommendations.splice(preferredIndex, 1)
                  validRecommendations.unshift(preferred)
                }
              }

              console.log(`[v0] Perplexity returned ${validRecommendations.length} valid recommendations`)
              return validRecommendations.slice(0, 12)
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Perplexity recommendation error:", error)
    }
  }

  try {
    const data = await openRouterChat(
      {
        model: "mistralai/devstral-2512:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 800,
      },
      "StudyAbroad Recommendations",
    )

    const content = data.choices?.[0]?.message?.content || ""
    const clean = stripModelNoise(content)
    const jsonStr = extractJsonObject(clean)

    if (!jsonStr) {
      throw new Error("No JSON found in model response")
    }

    const parsed = JSON.parse(jsonStr)

    if (!parsed.countries || !Array.isArray(parsed.countries)) {
      throw new Error("Invalid response structure")
    }

    const validRecommendations = parsed.countries
      .map((c: CountryRecommendation) => ({
        name: normalizeCountryName(c.name),
        reason: c.reason,
      }))
      .filter((c: CountryRecommendation) => getCountryImage(c.name) !== null)

    if (validRecommendations.length < 6) {
      throw new Error("Not enough valid countries in response")
    }

    if (isPreferredAffordable) {
      const preferredIndex = validRecommendations.findIndex(
        (r: CountryRecommendation) => r.name === preferredDestination,
      )
      if (preferredIndex > 0) {
        const [preferred] = validRecommendations.splice(preferredIndex, 1)
        validRecommendations.unshift(preferred)
      }
    }

    return validRecommendations.slice(0, 12)
  } catch (err) {
    console.warn("[v0] Falling back to budget-aware recommendations due to AI error:", err)

    const preferred = (profile.preferred_destination || "")
      .split(",")
      .map((s) => normalizeCountryName(s.trim()))
      .filter(Boolean)

    const picked: string[] = []

    for (const p of preferred) {
      if (affordableNames.includes(p) && getCountryImage(p)) {
        picked.push(p)
      }
    }

    for (const c of affordableNames) {
      if (picked.length >= 12) break
      if (!picked.includes(c) && getCountryImage(c)) picked.push(c)
    }

    for (const c of VALID_COUNTRIES) {
      if (picked.length >= 12) break
      if (!picked.includes(c) && getCountryImage(c)) picked.push(c)
    }

    return picked.slice(0, 12).map((name) => ({
      name,
      reason: affordableNames.includes(name)
        ? "Within your budget range and matches your profile."
        : "Matches your degree goals. Consider scholarships for this destination.",
    }))
  }
}

async function getUniversityCount(countryName: string): Promise<number> {
  const cacheKey = countryName.toLowerCase()
  const cached = unisCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) return cached.count

  return serperQueue.add(async () => {
    const serperKey = process.env.SERPER_GOOGLE_SEARCH_API
    if (!serperKey) return 0

    const year = new Date().getFullYear()

    const response = await fetchWithTimeout("https://google.serper.dev/search", {
      method: "POST",
      timeoutMs: 15000,
      cache: "no-store",
      headers: {
        "X-API-KEY": serperKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `how many universities in ${countryName} total number ${year}`,
        num: 5,
      }),
    })

    if (!response.ok) return 0

    const data = await response.json()

    const text = [
      data.answerBox?.answer || "",
      data.answerBox?.snippet || "",
      ...(data.organic || []).map((r: SerperResult) => `${r.title} ${r.snippet}`),
    ].join(" ")

    const patterns = [
      /(\d{1,4})\s*(?:\+)?\s*(?:universities|colleges|institutions|higher education)/i,
      /(?:over|more than|approximately|about|around|nearly|has|have|with|total of)\s*(\d{1,4})\s*(?:universities|colleges|institutions)/i,
      /(\d{1,4})\s*(?:accredited|public|private)?\s*(?:universities|colleges)/i,
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match) {
        const num = Number.parseInt(match[1], 10)
        if (num > 0 && num < 5000) {
          unisCache.set(cacheKey, { expires: Date.now() + UNIS_TTL_MS, count: num })
          return num
        }
      }
    }

    return 0
  })
}

async function getCountryData(countryName: string): Promise<{
  universities: number
  costOfLivingMin: number
  costOfLivingMax: number
}> {
  const [universities, costData] = await Promise.all([
    getUniversityCount(countryName),
    getCostOfLivingWithLLM(countryName),
  ])

  return {
    universities,
    costOfLivingMin: costData.costOfLivingMin,
    costOfLivingMax: costData.costOfLivingMax,
  }
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
    typeof country.costOfLivingMax === "number"
  )
}

function validateCountryDataPartial(country: CountryData): boolean {
  return (
    typeof country.name === "string" &&
    country.name.length > 0 &&
    typeof country.imageUrl === "string" &&
    country.imageUrl.length > 0 &&
    ((typeof country.universities === "number" && country.universities > 0) ||
      (typeof country.costOfLivingMin === "number" && country.costOfLivingMin > 0))
  )
}

export async function GET() {
  try {
    if (OPENROUTER_API_KEYS.length === 0) {
      return NextResponse.json(
        { success: false, error: "No OpenRouter API keys configured. Please add at least one API key." },
        { status: 500 },
      )
    }

    console.log(`[v0] Available OpenRouter API keys: ${OPENROUTER_API_KEYS.length}`)

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

    console.log(`[v0] Fetching recommendations for user: ${user.id}`)

    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("profile_type")
      .eq("user_id", user.id)
      .maybeSingle()

    const profileType = userProfile?.profile_type || "student"
    console.log(`[v0] User profile type: ${profileType}`)

    const { data: existingRecommendations, error: fetchError } = await supabase
      .from("country_recommendations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error(`[v0] Error fetching cached recommendations:`, fetchError)
    }

    if (existingRecommendations && existingRecommendations.length >= MIN_REQUIRED_COUNTRIES) {
      const countries: CountryData[] = existingRecommendations.map((rec) => ({
        name: rec.country_name,
        imageUrl: rec.image_url,
        universities: rec.universities,
        costOfLivingMin: rec.cost_of_living_min,
        costOfLivingMax: rec.cost_of_living_max,
      }))

      const completeCountries = countries.filter(validateCountryData)

      if (completeCountries.length >= MIN_REQUIRED_COUNTRIES) {
        console.log(`[v0] Found ${completeCountries.length} complete cached recommendations, returning from DB`)

        let profileData = null
        if (profileType === "student") {
          const { data: studentProfile } = await supabase
            .from("student_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle()

          if (studentProfile) {
            profileData = {
              degreeToPursue: studentProfile.degree_to_pursue,
              preferredDestination: studentProfile.preferred_destination,
              budgetRange: `$${studentProfile.budget_min} - $${studentProfile.budget_max}`,
            }
          }
        } else {
          const { data: professionalProfile } = await supabase
            .from("professional_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle()

          if (professionalProfile) {
            profileData = {
              degreeToPursue: professionalProfile.industry_field || "Professional Development",
              preferredDestination: professionalProfile.preferred_destination,
              budgetRange: `$${professionalProfile.budget_min} - $${professionalProfile.budget_max}`,
            }
          }
        }

        return NextResponse.json({
          success: true,
          countries: completeCountries,
          cached: true,
          profile: profileData,
        })
      } else {
        console.log(
          `[v0] Cache has incomplete data (${completeCountries.length}/${existingRecommendations.length} valid), clearing and regenerating`,
        )
        await supabase.from("country_recommendations").delete().eq("user_id", user.id)
      }
    }

    console.log(`[v0] No valid cached recommendations found, generating new ones from LLM`)

    let profileForRecommendations: StudentProfile | null = null

    if (profileType === "student") {
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
      profileForRecommendations = studentProfile
    } else {
      const { data: professionalProfile, error: profileError } = await supabase
        .from("professional_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      if (profileError || !professionalProfile) {
        return NextResponse.json(
          { success: false, error: "Professional profile not found. Please complete your profile first." },
          { status: 404 },
        )
      }

      profileForRecommendations = {
        id: professionalProfile.id,
        user_id: professionalProfile.user_id,
        latest_qualification: professionalProfile.highest_qualification,
        university_name: professionalProfile.company_name,
        graduation_year: new Date().getFullYear() - (professionalProfile.years_of_experience || 0),
        grade_cgpa: "N/A",
        currently_studying: false,
        degree_to_pursue: professionalProfile.industry_field || "Professional Development",
        preferred_destination: professionalProfile.preferred_destination || "",
        preferred_year_of_intake: new Date().getFullYear() + 1,
        budget_min: professionalProfile.budget_min || 0,
        budget_max: professionalProfile.budget_max || 10000,
        apply_for_scholarships: false,
      }
    }

    const profile = profileForRecommendations as StudentProfile
    console.log(`[v0] Starting recommendations for profile:`, profile.degree_to_pursue)

    const recommendations = await getAIRecommendations(profile, profileType as "student" | "professional")
    console.log(`[v0] Got ${recommendations.length} recommendations`)

    console.log("[v0] Fetching data for all recommended countries...")

    const countryPromises = recommendations.map(async (rec) => {
      const normalizedName = normalizeCountryName(rec.name)
      const imageUrl = getCountryImage(normalizedName)

      if (!imageUrl) {
        console.log(`[v0] No image for ${normalizedName}`)
        return null
      }

      try {
        const data = await getCountryData(normalizedName)
        return {
          name: normalizedName,
          imageUrl,
          universities: data.universities,
          costOfLivingMin: data.costOfLivingMin,
          costOfLivingMax: data.costOfLivingMax,
          reason: rec.reason,
        }
      } catch (error) {
        console.error(`[v0] Error fetching data for ${normalizedName}:`, error)
        return null
      }
    })

    const results = await Promise.all(countryPromises)

    const completeCountries = results.filter(
      (c): c is NonNullable<typeof c> => c !== null && validateCountryData(c as CountryData),
    )

    const partialCountries = results.filter(
      (c): c is NonNullable<typeof c> => c !== null && validateCountryDataPartial(c as CountryData),
    )

    console.log(`[v0] Complete countries: ${completeCountries.length}, Partial: ${partialCountries.length}`)

    const countries = completeCountries.length >= MIN_REQUIRED_COUNTRIES ? completeCountries : partialCountries

    if (countries.length < MIN_REQUIRED_COUNTRIES) {
      console.error(`[v0] Insufficient valid countries: ${countries.length}`)
      return NextResponse.json(
        { success: false, error: "Unable to fetch complete data. Please try again." },
        { status: 503 },
      )
    }

    console.log("[v0] Writing complete dataset to database...")

    // Delete existing recommendations
    const { error: deleteError } = await supabase.from("country_recommendations").delete().eq("user_id", user.id)

    if (deleteError) {
      console.error("[v0] Error clearing old recommendations:", deleteError)
    }

    const recommendationsToInsert = countries.map((country) => ({
      user_id: user.id,
      country_name: country.name,
      image_url: country.imageUrl,
      universities: country.universities,
      cost_of_living_min: country.costOfLivingMin,
      cost_of_living_max: country.costOfLivingMax,
      reason: country.reason || "Recommended based on your profile",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase.from("country_recommendations").insert(recommendationsToInsert)

    if (insertError) {
      console.error("[v0] Error storing recommendations:", insertError)
      return NextResponse.json(
        { success: false, error: "Failed to save recommendations. Please try again." },
        { status: 500 },
      )
    }

    const { data: verifyData, error: verifyError } = await supabase
      .from("country_recommendations")
      .select("country_name")
      .eq("user_id", user.id)

    if (verifyError || !verifyData || verifyData.length < MIN_REQUIRED_COUNTRIES) {
      console.error("[v0] Database verification failed:", verifyError)
      return NextResponse.json(
        { success: false, error: "Data storage verification failed. Please try again." },
        { status: 500 },
      )
    }

    console.log(`[v0] Successfully stored ${countries.length} validated recommendations for user ${user.id}`)

    const responseCountries: CountryData[] = countries.map((c) => ({
      name: c.name,
      imageUrl: c.imageUrl,
      universities: c.universities,
      costOfLivingMin: c.costOfLivingMin,
      costOfLivingMax: c.costOfLivingMax,
    }))

    return NextResponse.json({
      success: true,
      countries: responseCountries,
      cached: false,
      profile: {
        degreeToPursue: profile.degree_to_pursue,
        preferredDestination: profile.preferred_destination,
        budgetRange: profile.budget_min ? `$${profile.budget_min} - $${profile.budget_max}` : "N/A",
      },
    })
  } catch (error) {
    console.error("[v0] Error in recommendations API:", error)

    const msg = error instanceof Error ? error.message : String(error)
    const isRateLimit = msg.includes("429") || msg.includes("rate-limited") || msg.includes("exhausted")

    return NextResponse.json(
      {
        success: false,
        error: isRateLimit
          ? "All API keys are currently rate-limited. Please try again in a few minutes."
          : "Failed to get recommendations.",
      },
      { status: isRateLimit ? 429 : 500 },
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

    const { error: deleteError } = await supabase.from("country_recommendations").delete().eq("user_id", user.id)

    if (deleteError) {
      console.error("[v0] Error deleting recommendations:", deleteError)
      return NextResponse.json({ success: false, error: "Failed to clear recommendations" }, { status: 500 })
    }

    console.log(`[v0] Cleared recommendations for user ${user.id}`)
    return NextResponse.json({ success: true, message: "Recommendations cleared" })
  } catch (error) {
    console.error("[v0] Error in DELETE recommendations:", error)
    return NextResponse.json({ success: false, error: "Failed to clear recommendations" }, { status: 500 })
  }
}
