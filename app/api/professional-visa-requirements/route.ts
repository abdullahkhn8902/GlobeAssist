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

  const year = new Date().getFullYear()

  const prompt = `Work visa requirements for ${nationality} professionals applying to work in ${countryName} in ${year}.

Provide accurate, up-to-date information for SKILLED WORKER / EMPLOYMENT VISA (not student visa).

Return JSON only:
{
  "visaType": "work visa type name (e.g., Skilled Worker Visa, H-1B, etc.)",
  "processingTime": "X-Y weeks (realistic processing time)",
  "visaFee": "amount in USD",
  "validity": "duration (e.g., 2-5 years)",
  "requiredDocuments": ["doc1", "doc2", "doc3", "doc4", "doc5", "doc6"],
  "financialRequirements": {
    "bankStatement": "minimum amount required",
    "sponsorshipLetter": true/false (employer sponsorship),
    "proofOfFunds": "amount needed"
  },
  "applicationSteps": [
    {"step": 1, "title": "step title", "description": "brief description"},
    {"step": 2, "title": "step title", "description": "brief description"}
  ],
  "whereToApply": [
    {"name": "Embassy/VFS name", "address": "address in Pakistan", "website": "official url", "phone": "number"}
  ],
  "importantTips": ["tip1", "tip2", "tip3", "tip4"],
  "processingCenters": ["city1", "city2", "city3"]
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
          content: "Return only valid JSON. No markdown, no explanation. Provide accurate work visa information.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    throw new Error(`Sonar API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ""

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
      visaType: "Work Visa / Employment Visa",
      processingTime: "4-12 weeks",
      visaFee: "Contact embassy for current fees",
      validity: "1-5 years (renewable)",
      requiredDocuments: [
        "Valid passport (6+ months validity)",
        "Job offer letter from employer",
        "Employment contract",
        "Educational certificates (attested)",
        "Professional experience certificates",
        "Police clearance certificate",
        "Medical examination report",
        "Passport-size photographs",
      ],
      financialRequirements: {
        bankStatement: "Last 6 months required",
        sponsorshipLetter: true,
        proofOfFunds: "Depends on country requirements",
      },
      applicationSteps: [
        { step: 1, title: "Secure Job Offer", description: "Get a valid job offer from an employer" },
        { step: 2, title: "Employer Sponsorship", description: "Employer applies for work permit/sponsorship" },
        { step: 3, title: "Gather Documents", description: "Collect all required documents with attestation" },
        { step: 4, title: "Apply Online", description: "Submit visa application online" },
        { step: 5, title: "Pay Fees", description: "Pay visa application and processing fees" },
        { step: 6, title: "Biometrics", description: "Submit biometrics at visa center" },
        { step: 7, title: "Interview", description: "Attend visa interview if required" },
        { step: 8, title: "Receive Visa", description: "Collect passport with visa stamp" },
      ],
      whereToApply: [
        {
          name: "Embassy/Consulate",
          address: "Contact for address in Pakistan",
          website: "Check official embassy website",
          phone: "Contact embassy",
        },
      ],
      importantTips: [
        "Start the process at least 3-4 months before intended travel date",
        "Ensure all documents are properly attested from HEC and MOFA",
        "Your employer must complete their part of sponsorship first",
        "Keep copies of all submitted documents",
        "Check if your profession requires additional licensing in the destination country",
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
        .from("professional_visa_requirements_cache")
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

    // Cache for 30 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await supabase.from("professional_visa_requirements_cache").upsert(
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
    console.error("[Professional Visa Requirements API] Error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch visa requirements" }, { status: 500 })
  }
}
