import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SONAR_API_KEY = process.env.OPENROUTER_API_KEY_SONAR_SEARCH

interface VisaRequirements {
  countryName: string
  visaType: string
  processingTime: string
  visaFee: string
  validity: string
  requiredDocuments: string[]
  financialRequirements: {
    bankStatement: string
    sponsorshipLetter: boolean
    proofOfFunds: string
  }
  applicationSteps: {
    step: number
    title: string
    description: string
  }[]
  whereToApply: {
    name: string
    address: string
    website: string
    phone?: string
  }[]
  importantTips: string[]
  processingCenters: string[]
}

async function fetchVisaRequirements(countryName: string, nationality: string): Promise<VisaRequirements> {
  if (!SONAR_API_KEY) {
    throw new Error("Sonar API key not configured")
  }

  // Efficient prompt - focused and specific
  const prompt = `Student visa requirements for ${nationality} citizens applying to study in ${countryName} in 2025.

Return JSON only:
{
  "visaType": "visa type name",
  "processingTime": "X-Y weeks",
  "visaFee": "amount in USD",
  "validity": "duration",
  "requiredDocuments": ["doc1", "doc2", "doc3", "doc4", "doc5"],
  "financialRequirements": {
    "bankStatement": "minimum amount required",
    "sponsorshipLetter": true/false,
    "proofOfFunds": "amount needed"
  },
  "applicationSteps": [
    {"step": 1, "title": "step title", "description": "brief description"},
    {"step": 2, "title": "step title", "description": "brief description"}
  ],
  "whereToApply": [
    {"name": "Embassy/VFS name", "address": "address in Pakistan", "website": "url", "phone": "number"}
  ],
  "importantTips": ["tip1", "tip2", "tip3"],
  "processingCenters": ["city1", "city2"]
}`

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SONAR_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    body: JSON.stringify({
      model: "perplexity/sonar-pro-search",
      messages: [
        {
          role: "system",
          content: "Return only valid JSON. No markdown, no explanation.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    throw new Error(`Sonar API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ""

  // Extract JSON
  let jsonStr = content
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    jsonStr = jsonMatch[0]
  }

  try {
    const parsed = JSON.parse(jsonStr)
    return {
      countryName,
      ...parsed,
    }
  } catch {
    // Return default structure if parsing fails
    return {
      countryName,
      visaType: "Student Visa",
      processingTime: "4-8 weeks",
      visaFee: "Contact embassy",
      validity: "Duration of study",
      requiredDocuments: [
        "Valid passport (6+ months validity)",
        "University acceptance letter",
        "Proof of financial support",
        "Academic transcripts",
        "English proficiency test results",
      ],
      financialRequirements: {
        bankStatement: "Last 6 months required",
        sponsorshipLetter: true,
        proofOfFunds: "Contact embassy for amount",
      },
      applicationSteps: [
        { step: 1, title: "Get Admission", description: "Receive university acceptance letter" },
        { step: 2, title: "Gather Documents", description: "Collect all required documents" },
        { step: 3, title: "Apply Online", description: "Submit visa application online" },
        { step: 4, title: "Pay Fees", description: "Pay visa application fee" },
        { step: 5, title: "Biometrics", description: "Submit biometrics at visa center" },
        { step: 6, title: "Interview", description: "Attend visa interview if required" },
      ],
      whereToApply: [
        {
          name: "Embassy/Consulate",
          address: "Contact for address",
          website: "Check official website",
          phone: "Contact embassy",
        },
      ],
      importantTips: [
        "Apply at least 3 months before course start date",
        "Ensure all documents are attested",
        "Keep copies of all submitted documents",
      ],
      processingCenters: ["Islamabad", "Karachi", "Lahore"],
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get("country")
    const nationality = searchParams.get("nationality") || "Pakistani"
    const forceRefresh = searchParams.get("refresh") === "true"

    if (!country) {
      return NextResponse.json({ success: false, error: "Country is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("visa_requirements_cache")
        .select("*")
        .eq("country_name", country)
        .eq("nationality", nationality)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle()

      if (cached?.data) {
        return NextResponse.json({ success: true, data: cached.data, cached: true })
      }
    }

    // Fetch fresh data
    const visaData = await fetchVisaRequirements(country, nationality)

    // Cache for 30 days (visa requirements don't change often)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await supabase.from("visa_requirements_cache").upsert(
      {
        country_name: country,
        nationality: nationality,
        data: visaData,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "country_name,nationality" },
    )

    return NextResponse.json({ success: true, data: visaData, cached: false })
  } catch (error) {
    console.error("[Visa Requirements API] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch visa requirements" }, { status: 500 })
  }
}
