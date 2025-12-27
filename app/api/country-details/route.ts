import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCountryImage } from "@/lib/country-images"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

interface University {
  name: string
  imageUrl: string
  tuitionFeeMin: number
  tuitionFeeMax: number
  numberOfCourses: number
  scholarshipsAvailable: number
}

interface Scholarship {
  name: string
  link: string
}

interface CountryDetails {
  countryName: string
  description: string
  countryImageUrl: string
  visaProcessingTime: string
  language: string
  intakes: string
  popularScholarships: Scholarship[]
  universities: University[]
}

const PERPLEXITY_API_KEY = process.env.OPENROUTER_API_KEY_SONAR_SEARCH
const SERPER_API_KEY = process.env.SERPER_GOOGLE_SEARCH_API

const MIN_REQUIRED_UNIVERSITIES = 8

function validateUniversity(university: University): boolean {
  return (
    typeof university.name === "string" &&
    university.name.length > 3 &&
    typeof university.imageUrl === "string" &&
    typeof university.tuitionFeeMin === "number" &&
    typeof university.tuitionFeeMax === "number"
  )
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      if (response.ok) return response
      if (response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)))
        continue
      }
      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
      }
    }
  }
  throw lastError || new Error("Max retries exceeded")
}

async function fetchCountryDataFromPerplexity(countryName: string): Promise<{
  description: string
  language: string
  intakes: string
  visaProcessingTime: string
  universities: Array<{
    name: string
    tuitionFeeMin: number
    tuitionFeeMax: number
    numberOfCourses: number
    scholarshipsAvailable: number
  }>
  scholarshipNames: string[]
} | null> {
  if (!PERPLEXITY_API_KEY) {
    console.error("[v0] OPENROUTER_API_KEY_SONAR_SEARCH not configured")
    return null
  }

  const prompt = `Provide study abroad information for ${countryName}. Return ONLY valid JSON, no markdown:

{
  "description": "One sentence about studying in ${countryName} (max 100 chars)",
  "language": "Primary teaching language",
  "intakes": "Main intake periods (e.g. September & February)",
  "visaProcessingTime": "Student visa processing time Not Days or Weeks Just (Fast ,  Slow ) ",
  "universities": [
    {"name": "University Name", "tuitionFeeMin": 10000, "tuitionFeeMax": 25000, "numberOfCourses": 200, "scholarshipsAvailable": 20}
  ],
  "scholarshipNames": ["Scholarship 1", "Scholarship 2", "Scholarship 3"]
}

REQUIREMENTS:
- List exactly 20 REAL universities in ${countryName} ranked by international student popularity
- Tuition fees in USD per year for international students
- numberOfCourses: realistic count (100-500)
- scholarshipsAvailable: realistic count (5-50)
- List 3-4 real scholarship program names available for ${countryName}
- Return ONLY the JSON object, nothing else`

  try {
    console.log(`[v0] Calling Perplexity Sonar Pro for ${countryName}`)

    const response = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
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
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] Perplexity API error: ${response.status} - ${errorText}`)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error("[v0] No content in Perplexity response")
      return null
    }

    let cleanedContent = content.trim()

    if (cleanedContent.startsWith("```json")) cleanedContent = cleanedContent.slice(7)
    else if (cleanedContent.startsWith("```")) cleanedContent = cleanedContent.slice(3)
    if (cleanedContent.endsWith("```")) cleanedContent = cleanedContent.slice(0, -3)

    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedContent = jsonMatch[0]
    }

    const parsed = JSON.parse(cleanedContent.trim())
    console.log(`[v0] Successfully parsed Perplexity response for ${countryName}`)

    return {
      description: parsed.description || `World-class education opportunities in ${countryName}.`,
      language: parsed.language || "English",
      intakes: parsed.intakes || "September & January",
      visaProcessingTime: parsed.visaProcessingTime || "4-8 weeks",
      universities: Array.isArray(parsed.universities) ? parsed.universities : [],
      scholarshipNames: Array.isArray(parsed.scholarshipNames) ? parsed.scholarshipNames : [],
    }
  } catch (error) {
    console.error("[v0] Error calling Perplexity:", error)
    return null
  }
}

async function fetchUniversityImage(universityName: string, countryName: string): Promise<string> {
  if (!SERPER_API_KEY) {
    return `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(universityName + " campus")}`
  }

  try {
    const response = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `${universityName} ${countryName} university campus building`,
        num: 1,
      }),
    })

    if (!response.ok) {
      return `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(universityName + " campus")}`
    }

    const data = await response.json()
    if (data.images && data.images.length > 0) {
      return data.images[0].imageUrl
    }
  } catch (error) {
    console.error(`[v0] Error fetching image for ${universityName}:`, error)
  }

  return `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(universityName + " campus")}`
}

async function fetchScholarshipLink(scholarshipName: string, countryName: string): Promise<string> {
  if (!SERPER_API_KEY) {
    return `https://www.google.com/search?q=${encodeURIComponent(scholarshipName + " official application")}`
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `${scholarshipName} ${countryName} official application website`,
        num: 3,
      }),
    })

    if (!response.ok) {
      return `https://www.google.com/search?q=${encodeURIComponent(scholarshipName + " official application")}`
    }

    const data = await response.json()
    const results = data.organic || []

    const priorityDomains = [".gov", ".edu", ".org", "scholarship", "daad.de", "chevening.org", "fulbright", "studyin"]

    for (const result of results) {
      const url = result.link?.toLowerCase() || ""
      if (priorityDomains.some((domain) => url.includes(domain))) {
        return result.link
      }
    }

    if (results.length > 0) {
      return results[0].link
    }
  } catch (error) {
    console.error(`[v0] Error fetching link for ${scholarshipName}:`, error)
  }

  return `https://www.google.com/search?q=${encodeURIComponent(scholarshipName + " official application")}`
}

async function fetchCountryDetails(countryName: string): Promise<CountryDetails | null> {
  const countryImageUrl =
    getCountryImage(countryName) ||
    `/placeholder.svg?height=300&width=500&query=${encodeURIComponent(countryName)} landmark`

  const perplexityData = await fetchCountryDataFromPerplexity(countryName)

  if (!perplexityData) {
    console.error(`[v0] Failed to get Perplexity data for ${countryName}`)
    return null
  }

  console.log("[v0] Fetching images for all universities...")
  const universities: University[] = []
  const batchSize = 5

  for (let i = 0; i < perplexityData.universities.length; i += batchSize) {
    const batch = perplexityData.universities.slice(i, i + batchSize)
    const imagePromises = batch.map((uni) => fetchUniversityImage(uni.name, countryName))
    const images = await Promise.all(imagePromises)

    for (let j = 0; j < batch.length; j++) {
      universities.push({
        name: batch[j].name,
        imageUrl: images[j],
        tuitionFeeMin: batch[j].tuitionFeeMin || 10000,
        tuitionFeeMax: batch[j].tuitionFeeMax || 30000,
        numberOfCourses: batch[j].numberOfCourses || 150,
        scholarshipsAvailable: batch[j].scholarshipsAvailable || 10,
      })
    }
  }

  const validUniversities = universities.filter(validateUniversity)

  if (validUniversities.length < MIN_REQUIRED_UNIVERSITIES) {
    console.error(`[v0] Insufficient valid universities: ${validUniversities.length}`)
    return null
  }

  console.log("[v0] Fetching scholarship links...")
  const scholarshipPromises = perplexityData.scholarshipNames.map((name) =>
    fetchScholarshipLink(name, countryName).then((link) => ({ name, link })),
  )
  const scholarships = await Promise.all(scholarshipPromises)

  return {
    countryName,
    description: perplexityData.description,
    countryImageUrl,
    visaProcessingTime: perplexityData.visaProcessingTime,
    language: perplexityData.language,
    intakes: perplexityData.intakes,
    popularScholarships: scholarships,
    universities: validUniversities,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryName = searchParams.get("country")

    if (!countryName) {
      return NextResponse.json({ success: false, error: "Country name is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[v0] Checking cache for ${countryName}`)

    const { data: cachedDetails, error: cacheError } = await supabase
      .from("country_details_cache")
      .select("*")
      .eq("country_name", countryName)
      .maybeSingle()

    if (cacheError) {
      console.error(`[v0] Cache lookup error for ${countryName}:`, cacheError)
    }

    if (cachedDetails && cachedDetails.universities) {
      const cachedUniversities = cachedDetails.universities as University[]
      const validCachedUniversities = cachedUniversities.filter(validateUniversity)

      if (validCachedUniversities.length >= MIN_REQUIRED_UNIVERSITIES) {
        console.log(`[v0] Returning validated cached data for ${countryName}`)
        return NextResponse.json({
          success: true,
          cached: true,
          data: {
            countryName: cachedDetails.country_name,
            description: cachedDetails.description,
            countryImageUrl: cachedDetails.country_image_url,
            visaProcessingTime: cachedDetails.visa_processing_time,
            language: cachedDetails.language,
            intakes: cachedDetails.intakes,
            popularScholarships: cachedDetails.scholarships,
            universities: validCachedUniversities,
          },
        })
      } else {
        console.log(`[v0] Cache has incomplete university data (${validCachedUniversities.length}), regenerating`)
        await supabase.from("country_details_cache").delete().eq("country_name", countryName)
      }
    }

    console.log(`[v0] Fetching fresh data for ${countryName}`)
    const countryDetails = await fetchCountryDetails(countryName)

    if (!countryDetails) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch country details. Please try again.",
        },
        { status: 503 },
      )
    }

    console.log(`[v0] Caching complete data for ${countryName}`)

    // Delete existing cache entry
    await supabase.from("country_details_cache").delete().eq("country_name", countryName)

    // Insert new data
    const { error: insertError } = await supabase.from("country_details_cache").insert({
      country_name: countryName,
      description: countryDetails.description,
      country_image_url: countryDetails.countryImageUrl,
      visa_processing_time: countryDetails.visaProcessingTime,
      language: countryDetails.language,
      intakes: countryDetails.intakes,
      scholarships: countryDetails.popularScholarships,
      universities: countryDetails.universities,
      universities_count: countryDetails.universities.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("[v0] Failed to cache country details:", insertError)
    } else {
      const { data: verifyData } = await supabase
        .from("country_details_cache")
        .select("country_name")
        .eq("country_name", countryName)
        .maybeSingle()

      if (verifyData) {
        console.log("[v0] Successfully cached country details")
      }
    }

    return NextResponse.json({
      success: true,
      cached: false,
      data: countryDetails,
    })
  } catch (error) {
    console.error("[v0] Error in country details API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again later.",
      },
      { status: 500 },
    )
  }
}
