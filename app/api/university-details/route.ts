import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

interface Program {
  name: string
  qualification: string
  duration: string
  fees: string
  nextIntake: string
  entryScore: string
}

interface UniversityDetails {
  universityName: string
  countryName: string
  universityImageUrl: string
  description: string
  worldRanking: string
  applicationFee: string
  applicationRequirements: string[]
  programs: Program[]
}

const PERPLEXITY_API_KEY = process.env.OPENROUTER_API_KEY_SONAR_SEARCH
const SERPER_API_KEY = process.env.SERPER_GOOGLE_SEARCH_API

const MIN_REQUIRED_PROGRAMS = 3

function validateProgram(program: Program): boolean {
  return (
    typeof program.name === "string" &&
    program.name.length > 3 &&
    typeof program.qualification === "string" &&
    program.qualification.length > 0 &&
    typeof program.duration === "string" &&
    program.duration.length > 0
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

async function fetchUniversityImage(universityName: string): Promise<string> {
  if (!SERPER_API_KEY) {
    return `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(universityName + " campus")}`
  }

  try {
    const response = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `${universityName} main building campus`,
        num: 1,
      }),
    })

    if (!response.ok) return `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(universityName)}`

    const data = await response.json()
    if (data.images?.[0]?.imageUrl) {
      return data.images[0].imageUrl
    }
  } catch (error) {
    console.error(`[v0] Error fetching university image:`, error)
  }

  return `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(universityName + " campus")}`
}

async function fetchUniversityDataFromPerplexity(
  universityName: string,
  countryName: string,
): Promise<{
  description: string
  worldRanking: string
  applicationFee: string
  applicationRequirements: string[]
  programs: Program[]
} | null> {
  if (!PERPLEXITY_API_KEY) {
    console.error("[v0] OPENROUTER_API_KEY_SONAR_SEARCH not configured")
    return null
  }

  const prompt = `Provide study abroad information for ${universityName} in ${countryName}. Return ONLY valid JSON:

{
  "description": "Brief university description (max 150 chars)",
  "worldRanking": "THE World Ranking position (e.g., '39' or 'Top 100')",
  "applicationFee": "Application fee with currency (e.g., '$150 AUD' or 'Free')",
  "applicationRequirements": ["Requirement 1", "Requirement 2", "Requirement 3", "Requirement 4"],
  "programs": [
    {
      "name": "Program Name",
      "qualification": "Masters Degree",
      "duration": "1.5 Year(s)",
      "fees": "AUD 58976",
      "nextIntake": "24 July 2025",
      "entryScore": "6.5 IELTS"
    }
  ]
}

REQUIREMENTS:
- List 9 popular international student programs
- Use real program names and accurate fees
- Application requirements should be realistic (typically 4 items)
- Include academic requirements, English requirements, documents needed
- Return ONLY JSON`

  try {
    console.log(`[v0] Calling Perplexity Sonar Pro for ${universityName}`)

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
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      console.error(`[v0] Perplexity API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error(`[v0] No content in Perplexity response for ${universityName}`)
      return null
    }

    let cleanedContent = content.trim()

    if (cleanedContent.startsWith("```json")) cleanedContent = cleanedContent.slice(7)
    else if (cleanedContent.startsWith("```")) cleanedContent = cleanedContent.slice(3)
    if (cleanedContent.endsWith("```")) cleanedContent = cleanedContent.slice(0, -3)

    cleanedContent = cleanedContent.trim()

    const jsonStartIndex = cleanedContent.indexOf("{")
    const jsonEndIndex = cleanedContent.lastIndexOf("}")

    if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonStartIndex >= jsonEndIndex) {
      console.error(`[v0] No valid JSON found in Perplexity response for ${universityName}`)
      return null
    }

    const jsonString = cleanedContent.substring(jsonStartIndex, jsonEndIndex + 1)

    let parsed
    try {
      parsed = JSON.parse(jsonString)
    } catch (parseError) {
      console.error(`[v0] Failed to parse JSON for ${universityName}`)
      return null
    }

    console.log(`[v0] Successfully parsed Perplexity response for ${universityName}`)

    return {
      description: parsed.description || `World-class education at ${universityName}.`,
      worldRanking: parsed.worldRanking || "Top 500",
      applicationFee: parsed.applicationFee || "$100 USD",
      applicationRequirements: Array.isArray(parsed.applicationRequirements)
        ? parsed.applicationRequirements
        : ["Meet academic requirements", "Submit required documents"],
      programs: Array.isArray(parsed.programs) ? parsed.programs : [],
    }
  } catch (error) {
    console.error(`[v0] Error calling Perplexity: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

async function fetchUniversityDetails(universityName: string, countryName: string): Promise<UniversityDetails | null> {
  const [perplexityData, universityImageUrl] = await Promise.all([
    fetchUniversityDataFromPerplexity(universityName, countryName),
    fetchUniversityImage(universityName),
  ])

  if (!perplexityData) {
    console.error(`[v0] Failed to get Perplexity data for ${universityName}`)
    return null
  }

  const validPrograms = perplexityData.programs.filter(validateProgram)

  if (validPrograms.length < MIN_REQUIRED_PROGRAMS) {
    console.error(`[v0] Insufficient valid programs: ${validPrograms.length}`)
    return null
  }

  return {
    universityName,
    countryName,
    universityImageUrl,
    description: perplexityData.description,
    worldRanking: perplexityData.worldRanking,
    applicationFee: perplexityData.applicationFee,
    applicationRequirements: perplexityData.applicationRequirements,
    programs: validPrograms,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const universityName = searchParams.get("university")
    const countryName = searchParams.get("country")

    if (!universityName || !countryName) {
      return NextResponse.json({ success: false, error: "University and country names are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[v0] Checking cache for ${universityName}`)

    const { data: cachedDetails } = await supabase
      .from("university_details_cache")
      .select("*")
      .eq("university_name", universityName)
      .eq("country_name", countryName)
      .maybeSingle()

    if (cachedDetails && cachedDetails.programs) {
      const cachedPrograms = cachedDetails.programs as Program[]
      const validCachedPrograms = cachedPrograms.filter(validateProgram)

      if (validCachedPrograms.length >= MIN_REQUIRED_PROGRAMS) {
        console.log(`[v0] Returning validated cached data for ${universityName}`)
        return NextResponse.json({
          success: true,
          cached: true,
          data: {
            universityName: cachedDetails.university_name,
            countryName: cachedDetails.country_name,
            universityImageUrl: cachedDetails.university_image_url,
            description: cachedDetails.description,
            worldRanking: cachedDetails.world_ranking,
            applicationFee: cachedDetails.application_fee,
            applicationRequirements: cachedDetails.application_requirements,
            programs: validCachedPrograms,
          },
        })
      } else {
        console.log(`[v0] Cache has incomplete program data (${validCachedPrograms.length}), regenerating`)
        await supabase
          .from("university_details_cache")
          .delete()
          .eq("university_name", universityName)
          .eq("country_name", countryName)
      }
    }

    console.log(`[v0] Fetching fresh data for ${universityName}`)
    const universityDetails = await fetchUniversityDetails(universityName, countryName)

    if (!universityDetails) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch university details. Please try again.",
        },
        { status: 503 },
      )
    }

    console.log(`[v0] Caching complete data for ${universityName}`)

    // Delete existing cache entry
    await supabase
      .from("university_details_cache")
      .delete()
      .eq("university_name", universityName)
      .eq("country_name", countryName)

    // Insert new data
    const { error: insertError } = await supabase.from("university_details_cache").insert({
      university_name: universityName,
      country_name: countryName,
      university_image_url: universityDetails.universityImageUrl,
      description: universityDetails.description,
      world_ranking: universityDetails.worldRanking,
      application_fee: universityDetails.applicationFee,
      application_requirements: universityDetails.applicationRequirements,
      programs: universityDetails.programs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("[v0] Error caching university details:", insertError)
    } else {
      const { data: verifyData } = await supabase
        .from("university_details_cache")
        .select("university_name")
        .eq("university_name", universityName)
        .eq("country_name", countryName)
        .maybeSingle()

      if (verifyData) {
        console.log("[v0] Successfully cached university details")
      }
    }

    return NextResponse.json({
      success: true,
      cached: false,
      data: universityDetails,
    })
  } catch (error) {
    console.error("[v0] Error in university details API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again later.",
      },
      { status: 500 },
    )
  }
}
