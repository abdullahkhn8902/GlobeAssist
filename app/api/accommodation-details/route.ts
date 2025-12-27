import { type NextRequest, NextResponse } from "next/server"

interface AccommodationData {
  dormInfo: {
    available: boolean
    types: string[]
    costRange: string
    costRangePKR: string
    facilities: string[]
    applicationDeadline: string
    images: string[]
  }
  privateHousing: {
    avgRent: string
    avgRentPKR: string
    popularAreas: string[]
    resources: Array<{
      name: string
      url: string
    }>
  }
  applicationProcess: {
    steps: string[]
    requiredDocuments: string[]
    timeline: string
    whereToApply: string
    applicationUrl: string
  }
  pakistaniStudentInfo: {
    tips: string[]
    supportResources: Array<{
      name: string
      contact: string
    }>
  }
}

// Efficient API call using Sonar Pro - optimized prompt to reduce tokens
async function fetchAccommodationData(universityName: string, countryName: string): Promise<AccommodationData | null> {
  try {
    console.log(`[GlobeAssist Server] Fetching accommodation data for ${universityName}, ${countryName}`)

    // Optimized prompt - concise to save tokens
    const prompt = `${universityName} in ${countryName} accommodation for international students. Return JSON only:
{
  "dormInfo": {"available": bool, "types": ["type"], "costRange": "USD X-Y/month", "costRangePKR": "PKR", "facilities": ["facility"], "applicationDeadline": "date", "images": []},
  "privateHousing": {"avgRent": "USD/month", "avgRentPKR": "PKR", "popularAreas": ["area"], "resources": [{"name": "name", "url": "url"}]},
  "applicationProcess": {"steps": ["step"], "requiredDocuments": ["doc"], "timeline": "timeline", "whereToApply": "location", "applicationUrl": "url"},
  "pakistaniStudentInfo": {"tips": ["tip"], "supportResources": [{"name": "name", "contact": "email/phone"}]}
}`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY_SONAR_SEARCH}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "perplexity/sonar-pro-search",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000, // Limited tokens to reduce cost
      }),
    })

    if (!response.ok) {
      console.error(`[GlobeAssist Server] Sonar API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error("[GlobeAssist Server] No content in Sonar response")
      return null
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error("[GlobeAssist Server] Could not extract JSON from response")
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])
    console.log("[GlobeAssist Server] Successfully parsed accommodation data")

    return parsed
  } catch (error) {
    console.error("[GlobeAssist Server] Error fetching accommodation data:", error)
    return null
  }
}

// Efficient Google search for accommodation images - only if needed
async function fetchAccommodationImages(universityName: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://serpapi.com/search?engine=google_images&q=${encodeURIComponent(
        `${universityName} student dormitory accommodation`,
      )}&num=4&api_key=${process.env.SERPER_GOOGLE_SEARCH_API}`,
    )

    if (!response.ok) return []

    const data = await response.json()
    const images = data.images_results?.slice(0, 4).map((img: any) => img.thumbnail) || []

    return images
  } catch (error) {
    console.error("[GlobeAssist Server] Error fetching images:", error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const universityName = searchParams.get("university")
    const countryName = searchParams.get("country")

    if (!universityName || !countryName) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 })
    }

    console.log(`[GlobeAssist Server] Accommodation request for: ${universityName}, ${countryName}`)

    // Check cache first to avoid unnecessary API calls
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()

    const { data: cached } = await supabase
      .from("accommodation_cache")
      .select("*")
      .eq("university_name", universityName)
      .eq("country_name", countryName)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (cached) {
      console.log("[GlobeAssist Server] Returning cached accommodation data")
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
      })
    }

    // Fetch fresh data efficiently
    console.log("[GlobeAssist Server] Fetching fresh accommodation data")
    const accommodationData = await fetchAccommodationData(universityName, countryName)

    if (!accommodationData) {
      return NextResponse.json({ success: false, error: "Failed to fetch accommodation data" }, { status: 500 })
    }

    // Fetch images only if dorm data doesn't have them
    if (!accommodationData.dormInfo.images || accommodationData.dormInfo.images.length === 0) {
      const images = await fetchAccommodationImages(universityName)
      accommodationData.dormInfo.images = images
    }

    // Cache the result (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await supabase.from("accommodation_cache").upsert(
      {
        university_name: universityName,
        country_name: countryName,
        data: accommodationData,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "university_name,country_name" },
    )

    console.log("[GlobeAssist Server] Successfully cached accommodation data")

    return NextResponse.json({
      success: true,
      data: accommodationData,
      cached: false,
    })
  } catch (error) {
    console.error("[GlobeAssist Server] Error in accommodation-details route:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
