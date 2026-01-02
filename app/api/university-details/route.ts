import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 160

/* ===================== TYPES ===================== */

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

/* ===================== CONFIG ===================== */

const PERPLEXITY_API_KEY = process.env.OPENROUTER_API_KEY_SONAR_SEARCH
const SERPER_API_KEY = process.env.SERPER_GOOGLE_SEARCH_API
const MIN_REQUIRED_PROGRAMS = 3

/* ===================== HELPERS ===================== */

function validateProgram(program: Program): boolean {
  return (
    typeof program?.name === "string" &&
    program.name.length > 3 &&
    typeof program?.qualification === "string" &&
    typeof program?.duration === "string"
  )
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastError: Error | null = null

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 3000 * (i + 1)))
        continue
      }
      return res
    } catch (err) {
      lastError = err as Error
      await new Promise(r => setTimeout(r, 2000 * (i + 1)))
    }
  }

  throw lastError || new Error("Fetch failed")
}

async function fetchUniversityImage(universityName: string): Promise<string> {
  if (!SERPER_API_KEY) {
    return `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(universityName + " campus")}`
  }

  try {
    const res = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: `${universityName} campus`, num: 1 }),
    })

    if (!res.ok) throw new Error("Image fetch failed")
    const data = await res.json()
    return data?.images?.[0]?.imageUrl
      || `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(universityName)}`
  } catch {
    return `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(universityName)}`
  }
}

/* ===================== PERPLEXITY ===================== */

async function fetchUniversityDataFromPerplexity(
  universityName: string,
  countryName: string,
  studentInterests?: string[],
  degreeToPursue?: string,
): Promise<UniversityDetails | null> {

  if (!PERPLEXITY_API_KEY) return null

  const personalization = `
Student profile:
- Intended degree: ${degreeToPursue || "Not specified"}
- Interests: ${studentInterests?.join(", ") || "Not specified"}
`

  const prompt = `
Provide REAL, search-based information for the following university.
Return ONLY a valid JSON object. No markdown. No explanation.

University: ${universityName}
Country: ${countryName}
${personalization}

JSON FORMAT:
{
  "description": "Short factual university overview (max 150 chars)",
  "worldRanking": "Global ranking or range (e.g. 'Top 200') If you dont know Assume worldRanking of given UNI",
  "applicationFee": "Application fee with currency or 'Free' IMPORTANT",
  "applicationRequirements": ["Requirement 1", "Requirement 2","Requirement 3","Requirement 4"], //If you dont know Assume Requirements of given UNI
  "programs": [
    {
      "name": "Official program name",
      "qualification": "Degree awarded",
      "duration": "e.g. 2 Years",
      "fees": "Estimated annual tuition with currency",
      "nextIntake": "e.g. September 2025",
      "entryScore": "e.g. IELTS 6.5"
    }
  ]
}

GUIDELINES:
- Prefer official and commonly offered programs
- Fees and intakes must be 100% real accurate and uptodate
- Programs must be relevant to student interests when possible
- Each and Everything in Json Format must be returned 
`

  try {
    const response = await fetchWithRetry(
      "https://openrouter.ai/api/v1/chat/completions",
      {
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
          max_tokens: 2500,
        }),
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    let content = data?.choices?.[0]?.message?.content
    if (!content) return null

    let cleaned = content.trim()
    if (cleaned.startsWith("```")) cleaned = cleaned.replace(/```json|```/g, "")
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    return {
      universityName,
      countryName,
      universityImageUrl: "",
      description: parsed.description || `Study at ${universityName}`,
      worldRanking: parsed.worldRanking || "Not ranked",
      applicationFee: parsed.applicationFee || "Varies",
      applicationRequirements: Array.isArray(parsed.applicationRequirements)
        ? parsed.applicationRequirements
        : [],
      programs: Array.isArray(parsed.programs) ? parsed.programs : [],
    }

  } catch {
    return null
  }
}

/* ===================== MAIN HANDLER ===================== */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const universityName = searchParams.get("university")
    const countryName = searchParams.get("country")

    if (!universityName || !countryName) {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false }, { status: 401 })

    const { data: cached } = await supabase
      .from("university_details_cache")
      .select("*")
      .eq("university_name", universityName)
      .eq("country_name", countryName)
      .maybeSingle()

    if (cached?.programs?.length >= MIN_REQUIRED_PROGRAMS) {
      return NextResponse.json({ success: true, cached: true, data: cached })
    }

    const { data: profile } = await supabase
      .from("student_profiles")
      .select("fields_of_interest, degree_to_pursue")
      .eq("user_id", user.id)
      .maybeSingle()

    const perplexityData = await fetchUniversityDataFromPerplexity(
      universityName,
      countryName,
      profile?.fields_of_interest,
      profile?.degree_to_pursue,
    )

    if (!perplexityData) {
      return NextResponse.json({ success: false }, { status: 503 })
    }

    const image = await fetchUniversityImage(universityName)
    perplexityData.universityImageUrl = image
    perplexityData.programs = perplexityData.programs.filter(validateProgram)

    await supabase
      .from("university_details_cache")
      .delete()
      .eq("university_name", universityName)
      .eq("country_name", countryName)

    await supabase.from("university_details_cache").insert({
      university_name: universityName,
      country_name: countryName,
      university_image_url: image,
      description: perplexityData.description,
      world_ranking: perplexityData.worldRanking,
      application_fee: perplexityData.applicationFee,
      application_requirements: perplexityData.applicationRequirements,
      programs: perplexityData.programs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, cached: false, data: perplexityData })

  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
