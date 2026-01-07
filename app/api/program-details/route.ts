import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

interface ProgramDetailsResponse {
  programName: string
  universityName: string
  location: string
  qualification: string
  fees: string
  duration: string
  nextIntake: string
  applicationDeadline: string
  aboutCourse: string
  entryRequirements: string[]
  applicationUrl: string
  entryScore: string
}

const PERPLEXITY_API_KEY = process.env.OPENROUTER_API_KEY_SONAR_SEARCH
const SERPER_API_KEY = process.env.SERPER_GOOGLE_SEARCH_API

async function findApplicationUrl(programName: string, universityName: string): Promise<string> {
  if (!SERPER_API_KEY) {
    return `https://www.google.com/search?q=${encodeURIComponent(`${programName} ${universityName} apply`)}`
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `${programName} ${universityName} official application admission apply`,
        num: 5,
      }),
    })

    if (!response.ok) {
      console.error("[GlobeAssist Server] Serper API error:", response.status)
      return `https://www.google.com/search?q=${encodeURIComponent(`${programName} ${universityName} apply`)}`
    }

    const data = await response.json()
    console.log("[GlobeAssist Server] Serper results for application URL:", data.organic?.length || 0)

    const universityDomain = universityName.toLowerCase().replace(/[^a-z]/g, "")
    for (const result of data.organic || []) {
      const link = result.link?.toLowerCase() || ""
      if (
        (link.includes(".edu") || link.includes(universityDomain)) &&
        (link.includes("apply") || link.includes("admission") || link.includes("program"))
      ) {
        console.log("[GlobeAssist Server] Found official application URL:", result.link)
        return result.link
      }
    }

    for (const result of data.organic || []) {
      if (result.link?.includes(".edu")) {
        return result.link
      }
    }

    if (data.organic?.[0]?.link) {
      return data.organic[0].link
    }
  } catch (error) {
    console.error("[GlobeAssist Server] Error fetching application URL:", error)
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`${programName} ${universityName} apply`)}`
}

async function getProgramFromUniversityCache(
  supabase: any,
  programName: string,
  universityName: string,
  countryName: string,
): Promise<{
  qualification: string
  duration: string
  fees: string
  nextIntake: string
  entryScore: string
} | null> {
  try {
    const { data: uniCache } = await supabase
      .from("university_details_cache")
      .select("programs")
      .eq("university_name", universityName)
      .eq("country_name", countryName)
      .maybeSingle()

    if (uniCache?.programs) {
      const programs = uniCache.programs as any[]
      const matchedProgram = programs.find((p) => p.name?.toLowerCase() === programName.toLowerCase())
      if (matchedProgram) {
        console.log("[GlobeAssist Server] Found program in university cache:", matchedProgram.name)
        return {
          qualification: matchedProgram.qualification || "Master's Degree",
          duration: matchedProgram.duration || "2 Year(s)",
          fees: matchedProgram.fees || "Contact university",
          nextIntake: matchedProgram.nextIntake || "Contact university",
          entryScore: matchedProgram.entryScore || "6.5 IELTS",
        }
      }
    }
  } catch (error) {
    console.error("[GlobeAssist Server] Error reading university cache:", error)
  }
  return null
}

async function fetchAdditionalProgramDetails(
  programName: string,
  universityName: string,
  countryName: string,
): Promise<{
  location: string
  applicationDeadline: string
  aboutCourse: string
  entryRequirements: string[]
} | null> {
  if (!PERPLEXITY_API_KEY) {
    console.error("[GlobeAssist Server] OPENROUTER_API_KEY_SONAR_SEARCH not configured")
    return null
  }

  // Minimal prompt - only get what we don't have from university cache
  const prompt = `For "${programName}" at ${universityName}, ${countryName}, provide:

{
  "location": "City, ${countryName}",
  "applicationDeadline": "Specific date or Rolling",
  "aboutCourse": "2 sentences about what students learn and career outcomes",
  "entryRequirements": [
    "Undergraduate degree requirement with GPA",
    "IELTS score (e.g., IELTS 6.5 no band below 6.0)",
    "TOEFL score if applicable",
    "Other requirements like GRE/work experience"
  ]
}

Return ONLY JSON with real 2026-2027 data.`

  try {
    console.log(`[GlobeAssist Server] Calling Perplexity for additional details: ${programName}`)

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://v0.dev",
      },
      body: JSON.stringify({
        model: "perplexity/sonar-pro",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 800, // Reduced - only fetching additional details
      }),
    })

    if (!response.ok) {
      console.error(`[GlobeAssist Server] Perplexity API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) return null

    console.log("[GlobeAssist Server] Perplexity response length:", content.length)

    let cleanedContent = content.trim()
    if (cleanedContent.startsWith("```json")) cleanedContent = cleanedContent.slice(7)
    else if (cleanedContent.startsWith("```")) cleanedContent = cleanedContent.slice(3)
    if (cleanedContent.endsWith("```")) cleanedContent = cleanedContent.slice(0, -3)

    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) cleanedContent = jsonMatch[0]

    const parsed = JSON.parse(cleanedContent.trim())
    console.log("[GlobeAssist Server] Parsed additional details successfully")

    return {
      location: parsed.location || `${countryName}`,
      applicationDeadline: parsed.applicationDeadline || "Contact university",
      aboutCourse: parsed.aboutCourse || "Contact university for program details.",
      entryRequirements:
        Array.isArray(parsed.entryRequirements) && parsed.entryRequirements.length > 0
          ? parsed.entryRequirements
          : ["Contact university for requirements"],
    }
  } catch (error) {
    console.error("[GlobeAssist Server] Error parsing Perplexity response:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const programName = searchParams.get("program")
    const universityName = searchParams.get("university")
    const countryName = searchParams.get("country")
    const forceRefresh = searchParams.get("refresh") === "true"

    if (!programName || !universityName || !countryName) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    const supabase = await createServerClient()

    if (!forceRefresh) {
      const { data: cachedData } = await supabase
        .from("program_details_cache")
        .select("*")
        .eq("program_name", programName)
        .eq("university_name", universityName)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle()

      if (cachedData?.data) {
        const cached = cachedData.data as ProgramDetailsResponse
        const hasRealData =
          cached.fees &&
          !cached.fees.includes("Not specified") &&
          !cached.fees.includes("Contact university for fees") &&
          cached.aboutCourse &&
          !cached.aboutCourse.includes("Detailed information available")

        if (hasRealData) {
          console.log("[GlobeAssist Server] Using valid cached program details")
          return NextResponse.json({ success: true, data: cached, cached: true })
        }
        console.log("[GlobeAssist Server] Cache has placeholder data, fetching fresh...")
      }
    }

    console.log("[GlobeAssist Server] Fetching fresh program details")

    const universityProgramData = await getProgramFromUniversityCache(
      supabase,
      programName,
      universityName,
      countryName,
    )

    const [additionalDetails, applicationUrl] = await Promise.all([
      fetchAdditionalProgramDetails(programName, universityName, countryName),
      findApplicationUrl(programName, universityName),
    ])

    if (!additionalDetails && !universityProgramData) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch program details. Please try again." },
        { status: 500 },
      )
    }

    const programDetails: ProgramDetailsResponse = {
      programName,
      universityName,
      location: additionalDetails?.location || countryName,
      qualification: universityProgramData?.qualification || "Master's Degree",
      fees: universityProgramData?.fees || "Contact university",
      duration: universityProgramData?.duration || "2 Year(s)",
      nextIntake: universityProgramData?.nextIntake || "Contact university",
      entryScore: universityProgramData?.entryScore || "6.5 IELTS",
      applicationDeadline: additionalDetails?.applicationDeadline || "Contact university",
      aboutCourse: additionalDetails?.aboutCourse || "Contact university for program details.",
      entryRequirements: additionalDetails?.entryRequirements || ["Contact university for requirements"],
      applicationUrl,
    }

    console.log("[GlobeAssist Server] Program details merged:", {
      program: programDetails.programName,
      fees: programDetails.fees,
      duration: programDetails.duration,
      url: programDetails.applicationUrl,
    })

    // Cache the merged result
    if (programDetails.fees && !programDetails.fees.includes("Contact university for fees")) {
      await supabase.from("program_details_cache").upsert(
        {
          program_name: programName,
          university_name: universityName,
          country_name: countryName,
          data: programDetails,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "program_name,university_name" },
      )
      console.log("[GlobeAssist Server] Cached merged program details")
    }

    return NextResponse.json({ success: true, data: programDetails, cached: false })
  } catch (error) {
    console.error("[GlobeAssist Server] Error fetching program details:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
