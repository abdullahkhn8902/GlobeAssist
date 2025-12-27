import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 60

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
  latest_qualification: string
  degree_to_pursue: string
  preferred_destination: string
  fields_of_interest: string[]
  apply_for_scholarships: boolean
}

const MIN_REQUIRED_SCHOLARSHIPS = 5

function validateScholarship(scholarship: Scholarship): boolean {
  return (
    typeof scholarship.id === "string" &&
    scholarship.id.length > 0 &&
    typeof scholarship.name === "string" &&
    scholarship.name.length > 3 &&
    typeof scholarship.university === "string" &&
    scholarship.university.length > 0 &&
    typeof scholarship.location === "string" &&
    scholarship.location.length > 0 &&
    typeof scholarship.qualification === "string" &&
    scholarship.qualification.length > 0
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceRefresh = searchParams.get("refresh") === "true"
  const locationFilters = searchParams.get("locations")?.split(",").filter(Boolean) || []
  const qualificationFilters = searchParams.get("qualifications")?.split(",").filter(Boolean) || []
  const keyword = searchParams.get("keyword") || ""

  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userProfile: UserProfile | null = null
    if (user) {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select(
          "latest_qualification, degree_to_pursue, preferred_destination, fields_of_interest, apply_for_scholarships",
        )
        .eq("user_id", user.id)
        .single()
      userProfile = profile
    }

    const destinations =
      locationFilters.length > 0
        ? locationFilters.join(", ")
        : userProfile?.preferred_destination || "USA, UK, Canada, Germany, Australia"

    const qualification =
      qualificationFilters.length > 0 ? qualificationFilters.join(", ") : userProfile?.degree_to_pursue || "Masters"

    const fields = keyword || userProfile?.fields_of_interest?.join(", ") || "Computer Science, Engineering, Business"

    const cacheKey = `scholarships_${destinations}_${qualification}_${fields}`
      .toLowerCase()
      .replace(/[,\s]+/g, "_")
      .substring(0, 200)

    if (!forceRefresh && !keyword) {
      const { data: cached, error: cacheError } = await supabase
        .from("scholarships_cache")
        .select("scholarships, expires_at")
        .eq("cache_key", cacheKey)
        .maybeSingle()

      if (!cacheError && cached && cached.scholarships && new Date(cached.expires_at) > new Date()) {
        const validScholarships = (cached.scholarships as Scholarship[]).filter(validateScholarship)

        if (validScholarships.length >= MIN_REQUIRED_SCHOLARSHIPS) {
          console.log("[v0] Returning validated cached scholarships for:", cacheKey)
          return NextResponse.json({
            scholarships: validScholarships,
            cached: true,
            userProfile: userProfile
              ? {
                  qualification: userProfile.degree_to_pursue,
                  destinations: userProfile.preferred_destination,
                  fields: userProfile.fields_of_interest,
                }
              : null,
            appliedFilters: { locations: locationFilters, qualifications: qualificationFilters },
          })
        } else {
          console.log("[v0] Cache has incomplete scholarship data, clearing and regenerating")
          await supabase.from("scholarships_cache").delete().eq("cache_key", cacheKey)
        }
      }
    }

    if (keyword) {
      console.log("[v0] Performing keyword search for:", keyword)
    } else {
      console.log("[v0] Fetching fresh scholarships from Sonar Pro for:", destinations, qualification)
    }

    const scholarships = await fetchScholarshipsFromSonar(destinations, qualification, fields, "Pakistani")

    const validScholarships = scholarships.filter(validateScholarship)

    if (validScholarships.length < MIN_REQUIRED_SCHOLARSHIPS) {
      return NextResponse.json({
        scholarships: [],
        cached: false,
        error: "Unable to fetch complete scholarship data. Please try again.",
        userProfile: userProfile
          ? {
              qualification: userProfile.degree_to_pursue,
              destinations: userProfile.preferred_destination,
              fields: userProfile.fields_of_interest,
            }
          : null,
        appliedFilters: { locations: locationFilters, qualifications: qualificationFilters },
      })
    }

    console.log("[v0] Returning scholarships without pre-fetched links (will fetch on-demand)")

    if (!keyword && validScholarships.length >= MIN_REQUIRED_SCHOLARSHIPS) {
      const { error: upsertError } = await supabase.from("scholarships_cache").upsert(
        {
          cache_key: cacheKey,
          scholarships: validScholarships,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "cache_key" },
      )

      if (upsertError) {
        console.error("[v0] Error caching scholarships:", upsertError)
      } else {
        const { data: verifyData } = await supabase
          .from("scholarships_cache")
          .select("cache_key")
          .eq("cache_key", cacheKey)
          .maybeSingle()

        if (verifyData) {
          console.log("[v0] Successfully cached scholarships")
        }
      }
    }

    return NextResponse.json({
      scholarships: validScholarships,
      cached: false,
      userProfile: userProfile
        ? {
            qualification: userProfile.degree_to_pursue,
            destinations: userProfile.preferred_destination,
            fields: userProfile.fields_of_interest,
          }
        : null,
      appliedFilters: { locations: locationFilters, qualifications: qualificationFilters },
    })
  } catch (error) {
    console.error("[v0] Error fetching scholarships:", error)
    return NextResponse.json({ error: "Failed to fetch scholarships. Please try again." }, { status: 500 })
  }
}

async function fetchScholarshipsFromSonar(
  destinations: string,
  qualification: string,
  fields: string,
  nationality: string,
): Promise<Scholarship[]> {
  const apiKey = process.env.OPENROUTER_API_KEY_SONAR_SEARCH

  if (!apiKey) {
    console.error("[v0] Sonar API key not found")
    throw new Error("Search API not configured")
  }

  const prompt = `Find 15 REAL scholarships for ${nationality} students how have ${qualification} find scholarship for further studies in ${destinations}, fields: ${fields}.

REQUIREMENTS:
- Deadlines MUST be in 2026 or Rolling (no past dates)
- Real scholarships only (Fulbright, Chevening, DAAD, Commonwealth, Erasmus, etc.)
- Include scholarship name, university, country, degree level, award value, deadline, funding type

Return ONLY a valid JSON array without any markdown formatting or explanatory text. Each scholarship must be a complete valid JSON object.

Format:
[{"name":"exact scholarship name","university":"exact university name","location":"country name","qualification":"Undergraduate/Masters/PhD","valueMin":1000,"valueMax":2000,"currency":"USD","deadline":"DD Mon 2026","fundingType":"Fully Funded","description":"brief description","eligibility":["requirement 1","requirement 2"],"subjects":["field 1"],"nationality":"eligible nationalities","howToApply":"application steps"}]`

  try {
    let lastError: Error | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "perplexity/sonar-pro-search",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4000,
            temperature: 0.1,
          }),
        })

        if (!response.ok) {
          if (response.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)))
            continue
          }
          const errorText = await response.text()
          console.error("[v0] Sonar API error:", response.status, errorText)
          throw new Error(`Sonar API error: ${response.status}`)
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ""

        console.log("[v0] Sonar response received, length:", content.length)

        let jsonString = ""
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim()
        } else {
          const jsonMatch = content.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            jsonString = jsonMatch[0]
          }
        }

        if (!jsonString) {
          console.error("[v0] Could not find JSON array in Sonar response")
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            continue
          }
          return []
        }

        jsonString = jsonString.replace(/[\x00-\x1F\x7F-\x9F]/g, "")
        jsonString = jsonString.replace(/,(\s*[}\]])/g, "$1")
        jsonString = jsonString.replace(/}\s*{/g, "},{")

        if (!jsonString.trim().endsWith("]")) {
          const lastCompleteObject = jsonString.lastIndexOf("}]")
          if (lastCompleteObject > 0) {
            jsonString = jsonString.substring(0, lastCompleteObject + 2)
          } else if (jsonString.trim().endsWith("}")) {
            jsonString = jsonString.trim() + "]"
          }
        }

        try {
          const scholarships = JSON.parse(jsonString)

          if (!Array.isArray(scholarships)) {
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 2000))
              continue
            }
            return []
          }

          const validScholarships = scholarships.filter((s: any) => {
            return s.name && s.university && s.location && s.qualification
          })

          console.log("[v0] Successfully parsed", validScholarships.length, "scholarships from Sonar")

          return validScholarships.map((s: Scholarship, i: number) => ({
            ...s,
            id: `sch_${i}_${Date.now()}`,
            applyLink: "",
            eligibility: Array.isArray(s.eligibility) ? s.eligibility : [],
            subjects: Array.isArray(s.subjects) ? s.subjects : [],
          }))
        } catch (parseError: any) {
          console.error("[v0] JSON parse error:", parseError.message)

          // Try to salvage scholarships from malformed JSON
          const validScholarships: Scholarship[] = []
          let braceCount = 0
          let startIdx = -1

          for (let i = 0; i < jsonString.length; i++) {
            if (jsonString[i] === "{") {
              if (braceCount === 0) startIdx = i
              braceCount++
            } else if (jsonString[i] === "}") {
              braceCount--
              if (braceCount === 0 && startIdx >= 0) {
                const objStr = jsonString.substring(startIdx, i + 1)
                try {
                  const cleaned = objStr.replace(/,(\s*})/g, "$1")
                  const scholarship = JSON.parse(cleaned)
                  if (scholarship.name && scholarship.university) {
                    validScholarships.push(scholarship)
                  }
                } catch {
                  // Skip invalid objects
                }
                startIdx = -1
              }
            }
          }

          if (validScholarships.length > 0) {
            console.log("[v0] Recovered", validScholarships.length, "scholarships from malformed JSON")
            return validScholarships.map((s: Scholarship, i: number) => ({
              ...s,
              id: `sch_${i}_${Date.now()}`,
              applyLink: "",
              eligibility: Array.isArray(s.eligibility) ? s.eligibility : [],
              subjects: Array.isArray(s.subjects) ? s.subjects : [],
            }))
          }

          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
            continue
          }
          throw parseError
        }
      } catch (error) {
        lastError = error as Error
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
        }
      }
    }

    throw lastError || new Error("Failed to fetch scholarships after retries")
  } catch (error: any) {
    console.error("[v0] Sonar fetch error:", error.message)
    throw error
  }
}

async function enrichWithSerperLinks(scholarships: Scholarship[]): Promise<Scholarship[]> {
  return scholarships
}

async function findBestApplicationLinkWithLLM(
  scholarship: Scholarship,
  serperApiKey: string,
  llmApiKey: string,
): Promise<string> {
  return ""
}

function isValidApplicationUrl(url: string): boolean {
  if (!url || url.length < 10) return false

  try {
    new URL(url)
  } catch {
    return false
  }

  const blacklist = [
    "scholarshipportal.com",
    "scholarships.com",
    "findscholarship",
    "opportunit",
    "studyabroad.com",
    "scholars4dev",
    "afterschoolafrica",
    "scholarshipsads",
    "opportunitydesk",
  ]

  const urlLower = url.toLowerCase()
  for (const blocked of blacklist) {
    if (urlLower.includes(blocked)) {
      return false
    }
  }

  if (urlLower.includes("google.com/search")) {
    return false
  }

  return true
}
