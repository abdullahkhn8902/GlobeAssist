import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

const PERPLEXITY_API_KEY = process.env.OPENROUTER_API_KEY_SONAR_SEARCH
const SERPER_API_KEY = process.env.SERPER_GOOGLE_SEARCH_API

const MIN_REQUIRED_JOBS = 3

interface JobData {
  id: string
  title: string
  company: string
  location: string
  salary: string
  contractType: string
  qualification: string
  postedDate: string
  description: string
  requirements: string[]
  applyUrl: string
  role: string
  airbnbUrl?: string
  source: string
  verified: boolean
}

function getCountryImage(countryName: string): string {
  const countryImages: Record<string, string> = {
    Australia: "/sydney-australia-cityscape.jpg",
    "United States": "/nyc-skyline-twilight.png",
    "United States of America": "/nyc-skyline-twilight.png",
    "United Kingdom": "/london-big-ben.png",
    Canada: "/toronto-skyline-cn-tower.jpg",
    Germany: "/berlin-brandenburg-gate.jpg",
    Japan: "/tokyo-cityscape-mount-fuji.jpg",
    Singapore: "/singapore-marina-bay.jpg",
    "South Korea": "/seoul-south-korea-cityscape.jpg",
    Netherlands: "/amsterdam-canals.png",
    Sweden: "/stockholm-cityscape.jpg",
    Switzerland: "/zurich-alps.jpg",
    Ireland: "/dublin-ireland-cityscape.jpg",
    "New Zealand": "/auckland-new-zealand.jpg",
    UAE: "/dubai-skyline-burj-khalifa.jpg",
    "United Arab Emirates": "/dubai-skyline-burj-khalifa.jpg",
    France: "/paris-eiffel-tower.png",
    Spain: "/barcelona-spain-cityscape.jpg",
    Italy: "/rome-colosseum.png",
    Turkey: "/istanbul-blue-mosque.jpg",
  }
  return (
    countryImages[countryName] ||
    `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(countryName)} cityscape`
  )
}

function validateJob(job: JobData): boolean {
  if (!job) return false

  const hasValidTitle = job.title && job.title.length > 2
  const hasValidCompany = job.company && job.company.length > 1
  const hasDescription = job.description && job.description.length > 20
  
  return hasValidTitle && hasValidCompany && hasDescription
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

async function findAirbnbHousingLink(location: string, countryName: string): Promise<string> {
  const cityName = location.split(",")[0].trim()
  return `https://www.airbnb.com/s/${encodeURIComponent(cityName + ", " + countryName)}/homes?tab_id=home_tab`
}

async function fetchJobsFromPerplexity(
  countryName: string,
  jobTitle: string,
  industry: string,
  skills: string[],
  yearsOfExperience: number,
  qualification: string
): Promise<JobData[] | null> {
  if (!PERPLEXITY_API_KEY) {
    console.error("[GlobeAssist Server] OPENROUTER_API_KEY_SONAR_SEARCH not configured")
    return null
  }

  const prompt = `Find REAL, CURRENT job openings for ${jobTitle} positions in ${countryName}. 

Return ONLY valid JSON array with exactly 8 job objects:

[
  {
    "id": "unique_id_1",
    "title": "Exact job title",
    "company": "Real company name (not generic)",
    "location": "City, State/Province, Country",
    "salary": "Salary range with currency (e.g., '$70,000 - $95,000 annually')",
    "contractType": "Full-time/Part-time/Contract/Temporary",
    "qualification": "Required education/qualification",
    "postedDate": "Date posted (e.g., '2 days ago', '1 week ago', '2024-01-15')",
    "description": "Detailed job description (min 100 characters)",
    "requirements": ["Specific requirement 1", "Specific requirement 2", "Specific requirement 3", "Specific requirement 4"],
    "applyUrl": "Actual application URL or company career page",
    "source": "Job portal or company website name"
  }
]

CRITICAL REQUIREMENTS:
1. Each job MUST be real and currently open in ${countryName}
2. Company names must be specific (e.g., "Amazon", "Google", "Local Company Inc." not "A company" or "Confidential")
3. Locations must be specific cities in ${countryName}
4. Salaries must be realistic for ${countryName} (research typical ${jobTitle} salaries in ${countryName})
5. Requirements must be specific to ${jobTitle} role
6. Apply URLs should be real job posting links
7. Include jobs from major companies and local employers
8. Jobs should require ${yearsOfExperience}+ years experience and ${qualification} qualification when relevant
9. Focus on ${industry} industry opportunities

DO NOT include any explanations, only return the JSON array.`

  try {
    console.log(`[GlobeAssist Server] Calling Perplexity Sonar Pro for ${jobTitle} jobs in ${countryName}`)

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
      console.error(`[GlobeAssist Server] Perplexity API error: ${response.status}`)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error(`[GlobeAssist Server] No content in Perplexity response for ${countryName}`)
      return null
    }

    let cleanedContent = content.trim()

    if (cleanedContent.startsWith("```json")) cleanedContent = cleanedContent.slice(7)
    else if (cleanedContent.startsWith("```")) cleanedContent = cleanedContent.slice(3)
    if (cleanedContent.endsWith("```")) cleanedContent = cleanedContent.slice(0, -3)

    cleanedContent = cleanedContent.trim()

    const jsonStartIndex = cleanedContent.indexOf("[")
    const jsonEndIndex = cleanedContent.lastIndexOf("]")

    if (jsonStartIndex === -1 || jsonEndIndex === -1 || jsonStartIndex >= jsonEndIndex) {
      console.error(`[GlobeAssist Server] No valid JSON array found in Perplexity response for ${countryName}`)
      return null
    }

    const jsonString = cleanedContent.substring(jsonStartIndex, jsonEndIndex + 1)

    let parsed
    try {
      parsed = JSON.parse(jsonString)
    } catch (parseError) {
      console.error(`[GlobeAssist Server] Failed to parse JSON for ${countryName}`)
      return null
    }

    console.log(`[GlobeAssist Server] Successfully parsed Perplexity response for ${countryName}, found ${parsed.length} jobs`)

    const jobs: JobData[] = parsed.map((job: any, index: number) => ({
      id: job.id || `job_${index}_${Date.now()}`,
      title: job.title || jobTitle,
      company: job.company || "Company not specified",
      location: job.location || countryName,
      salary: job.salary || "Competitive salary",
      contractType: job.contractType || "Full-time",
      qualification: job.qualification || qualification,
      postedDate: job.postedDate || "Recently posted",
      description: job.description || `Join ${job.company || "a leading company"} as a ${job.title || jobTitle} in ${job.location || countryName}.`,
      requirements: Array.isArray(job.requirements) ? job.requirements : ["See job description for requirements"],
      applyUrl: job.applyUrl || "#",
      role: "Permanent",
      source: job.source || "Perplexity Search",
      verified: true
    }))

    return jobs.filter(validateJob)

  } catch (error) {
    console.error(`[GlobeAssist Server] Error calling Perplexity for jobs: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function getCountryInfo(
  countryName: string,
  industry: string,
): {
  description: string
  whyWork: string[]
  visaProcessingTime: string
  language: string
  jobMarketStrength: string
} {
  const countryInfo: Record<
    string,
    { 
      description: string; 
      whyWork: string[]; 
      visaProcessingTime: string; 
      language: string;
      jobMarketStrength: string;
    }
  > = {
    "United States": {
      description: `The United States offers unparalleled ${industry} opportunities with the world's largest economy and highest salaries for skilled professionals.`,
      whyWork: [
        "World's largest economy with diverse job opportunities",
        "Highest average salaries in many professional fields",
        "Leading innovation hubs like Silicon Valley and New York",
        "Strong demand for skilled international professionals"
      ],
      visaProcessingTime: "2-6 months for H-1B, 1-3 months for L-1",
      language: "English",
      jobMarketStrength: "Very Strong"
    },
    "United Kingdom": {
      description: `The UK's thriving ${industry} sector offers excellent career prospects with global companies and competitive compensation.`,
      whyWork: [
        "Global financial and business hub in London",
        "Strong legal protections for workers",
        "Access to European markets",
        "Rich cultural experience and diverse workforce"
      ],
      visaProcessingTime: "3-8 weeks for Skilled Worker Visa",
      language: "English",
      jobMarketStrength: "Strong"
    },
    "Canada": {
      description: `Canada welcomes ${industry} professionals with straightforward immigration and excellent quality of life in growing tech hubs.`,
      whyWork: [
        "One of the easiest immigration pathways for skilled workers",
        "Growing tech ecosystems in Toronto, Vancouver, and Montreal",
        "Excellent healthcare and social benefits",
        "High quality of life and safety"
      ],
      visaProcessingTime: "4-12 weeks for Express Entry",
      language: "English, French",
      jobMarketStrength: "Strong"
    },
    "Australia": {
      description: `Australia offers ${industry} professionals competitive salaries, high quality of life, and strong demand in key sectors.`,
      whyWork: [
        "High demand for skilled professionals across sectors",
        "Competitive salaries with strong work-life balance",
        "Pathway to permanent residency for qualified workers",
        "Excellent climate and quality of life"
      ],
      visaProcessingTime: "6-10 weeks for skilled visas",
      language: "English",
      jobMarketStrength: "Strong"
    },
    "Germany": {
      description: `Germany, Europe's largest economy, offers outstanding ${industry} opportunities with engineering excellence and innovation.`,
      whyWork: [
        "Europe's largest economy with low unemployment",
        "Strong manufacturing and engineering sectors",
        "EU Blue Card provides straightforward immigration",
        "Excellent work-life balance with generous benefits"
      ],
      visaProcessingTime: "4-8 weeks for EU Blue Card",
      language: "German",
      jobMarketStrength: "Strong"
    }
  }

  const defaultInfo = {
    description: `Discover growing ${industry} opportunities in ${countryName} with competitive positions for skilled professionals.`,
    whyWork: [
      "Growing job market for international professionals",
      "Competitive career opportunities",
      "Quality of life advantages"
    ],
    visaProcessingTime: "4-12 weeks",
    language: "English",
    jobMarketStrength: "Moderate"
  }

  return countryInfo[countryName] || defaultInfo
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ countryName: string }> }) {
  try {
    const resolvedParams = await params
    const { countryName } = resolvedParams
    const decodedCountryName = decodeURIComponent(countryName)

    console.log("[GlobeAssist Server] GET /api/professional-jobs/" + decodedCountryName)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Check cache first (similar to university API pattern)
    console.log(`[GlobeAssist Server] Checking cache for ${decodedCountryName}`)
    const { data: cached } = await supabase
      .from("professional_jobs_cache")
      .select("*")
      .eq("user_id", user.id)
      .eq("country_name", decodedCountryName)
      .maybeSingle()

    if (cached?.jobs && Array.isArray(cached.jobs) && cached.jobs.length >= MIN_REQUIRED_JOBS) {
      const validJobs = cached.jobs.filter(validateJob)
      if (validJobs.length >= MIN_REQUIRED_JOBS) {
        console.log(`[GlobeAssist Server] Returning cached data for ${decodedCountryName}`)
        return NextResponse.json({
          success: true,
          country: cached.country_info,
          jobs: validJobs,
          cached: true,
          dataQuality: "cached"
        })
      }
    }

    // Get professional profile
    const { data: profile } = await supabase.from("professional_profiles").select("*").eq("user_id", user.id).single()

    const jobTitle = profile?.current_job_title || "Software Engineer"
    const industry = profile?.industry_field || "Technology"
    const skills = profile?.cv_parsed_data?.skills || ["JavaScript", "Python", "SQL"]
    const yearsOfExperience = profile?.years_of_experience || 3
    const qualification = profile?.highest_qualification || "Bachelor's Degree"

    console.log(`[GlobeAssist Server] Fetching jobs for ${jobTitle} in ${decodedCountryName}`)

    // Fetch jobs from Perplexity (similar to university API)
    const jobs = await fetchJobsFromPerplexity(
      decodedCountryName,
      jobTitle,
      industry,
      skills,
      yearsOfExperience,
      qualification
    )

    if (!jobs || jobs.length === 0) {
      console.log(`[GlobeAssist Server] No jobs found for ${decodedCountryName}`)
      return NextResponse.json({
        success: false,
        error: "No jobs found. Please try again or adjust your search criteria.",
        jobs: [],
        country: null,
      }, { status: 404 })
    }

    // Add housing information
    console.log(`[GlobeAssist Server] Adding housing information to ${jobs.length} jobs`)
    const jobsWithHousing = await Promise.all(
      jobs.map(async (job) => {
        try {
          const airbnbUrl = await findAirbnbHousingLink(job.location, decodedCountryName)
          return { ...job, airbnbUrl }
        } catch (error) {
          return job
        }
      })
    )

    const validJobsWithHousing = jobsWithHousing.filter(validateJob)
    console.log(`[GlobeAssist Server] Valid jobs with housing: ${validJobsWithHousing.length}`)

    // Get country info
    const countryInfo = getCountryInfo(decodedCountryName, industry)
    const countryData = {
      name: decodedCountryName,
      image: getCountryImage(decodedCountryName),
      imageUrl: getCountryImage(decodedCountryName),
      ...countryInfo,
    }

    // Cache the results (similar to university API)
    console.log(`[GlobeAssist Server] Caching data for ${decodedCountryName}`)
    await supabase
      .from("professional_jobs_cache")
      .delete()
      .eq("user_id", user.id)
      .eq("country_name", decodedCountryName)

    const { error: insertError } = await supabase.from("professional_jobs_cache").insert({
      user_id: user.id,
      country_name: decodedCountryName,
      jobs: validJobsWithHousing,
      country_info: countryData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("[GlobeAssist Server] Error caching job data:", insertError)
    }

    return NextResponse.json({
      success: true,
      country: countryData,
      jobs: validJobsWithHousing,
      cached: false,
      dataQuality: "real_time"
    })

  } catch (error) {
    console.error("[GlobeAssist Server] Error in professional-jobs API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again later.",
        jobs: [],
        country: null,
      },
      { status: 500 }
    )
  }
}
