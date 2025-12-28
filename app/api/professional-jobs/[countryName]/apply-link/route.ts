import { NextResponse } from "next/server"

interface JobData {
  title: string
  company: string
  location: string
  description: string
}

const SERPER_API_KEY = process.env.SERPER_GOOGLE_SEARCH_API
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

export async function POST(request: Request, { params }: { params: Promise<{ countryName: string }> }) {
  try {
    const body = await request.json()
    const { job } = body as { job: JobData }

    if (!job || !job.title || !job.company) {
      return NextResponse.json({ error: "Invalid job data" }, { status: 400 })
    }

    console.log(`[v0] Fetching apply link on-demand for: ${job.title} at ${job.company}`)

    if (!SERPER_API_KEY || !OPENROUTER_API_KEY) {
      console.log("[v0] Missing required API keys for link fetching")
      return NextResponse.json({
        link: `https://www.google.com/search?q=${encodeURIComponent(
          `${job.title} ${job.company} apply now careers ${job.location} job posting`,
        )}`,
      })
    }

    // Find the best apply link using Serper + LLM (Perplexity)
    const validLink = await findBestJobApplicationLink(job, SERPER_API_KEY, OPENROUTER_API_KEY)

    if (validLink && validLink !== "NOT_FOUND") {
      console.log(`[v0] ✓ Found valid apply link for ${job.company} ${job.title}: ${validLink}`)
      return NextResponse.json({ link: validLink })
    }

    // Fallback to enhanced Google search
    const fallbackLink = `https://www.google.com/search?q=${encodeURIComponent(
      `"${job.company}" "${job.title}" job apply careers submit 2025 ${job.location}`,
    )}`
    console.log(`[v0] Using fallback Google search for ${job.company}`)
    return NextResponse.json({ link: fallbackLink })
  } catch (error) {
    console.error("[v0] Error fetching job apply link:", error)
    return NextResponse.json({ error: "Failed to fetch apply link" }, { status: 500 })
  }
}

async function findBestJobApplicationLink(job: JobData, serperApiKey: string, llmApiKey: string): Promise<string> {
  try {
    // Optimized search queries for finding actual job postings
    const searchQueries = [
      `"${job.company}" "${job.title}" job apply careers`,
      `${job.company} careers ${job.title} ${job.location} apply`,
      `site:indeed.com OR site:linkedin.com OR site:glassdoor.com "${job.company}" "${job.title}"`,
    ]

    let allResults: any[] = []

    for (const query of searchQueries) {
      console.log(`[v0] Searching Serper for: ${query}`)

      try {
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": serperApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            num: 10,
            gl: "us",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const results = data.organic || []
          allResults = [...allResults, ...results]
          console.log(`[v0] Got ${results.length} results from Serper for query`)
        } else {
          console.log(`[v0] Serper request failed with status: ${response.status}`)
        }
      } catch (fetchError) {
        console.error(`[v0] Serper fetch error for query "${query}":`, fetchError)
      }

      // Delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    if (allResults.length === 0) {
      console.log(`[v0] No search results found for ${job.company} ${job.title}`)
      return "NOT_FOUND"
    }

    // Remove duplicates based on URL
    const uniqueResults = Array.from(new Map(allResults.map((item) => [item.link, item])).values()).slice(0, 15)

    console.log(`[v0] Got ${uniqueResults.length} unique results, sending to Perplexity for analysis`)

    // Use Perplexity to analyze results and pick the best job posting link
    const resultsText = uniqueResults
      .map((r, idx) => `${idx + 1}. URL: ${r.link}\n   Title: ${r.title}\n   Snippet: ${r.snippet}`)
      .join("\n\n")

    const prompt = `You are an expert at finding official job posting pages. Analyze these search results and find the BEST official job posting/application page for the "${job.title}" position at "${job.company}".

SEARCH RESULTS:
${resultsText}

REQUIREMENTS FOR THE BEST LINK:
1. Must be a REAL job posting page from Indeed, LinkedIn, Glassdoor, or the company's official careers site
2. Must be a direct job posting/application page (not just a company info page)
3. Should contain the job title "${job.title}" or similar
4. Should mention "${job.company}" as the employer
5. Must have words like: apply, job, position, vacancy, opening, careers
6. Avoid: Generic job listing sites, news articles, blog posts
7. Avoid: Company contact pages or general career pages without the specific job

INSTRUCTIONS:
- Analyze ALL search results
- Return ONLY the single best URL that meets ALL requirements above
- Return just the URL as plain text, nothing else
- The URL MUST start with http:// or https://
- If NO result is a real job posting page, return exactly: NOT_FOUND

YOUR RESPONSE (URL only):`

    const llmResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llmApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "perplexity/sonar-pro-search",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
      }),
    })

    if (!llmResponse.ok) {
      console.error(`[v0] LLM API error: ${llmResponse.status}`)
      return "NOT_FOUND"
    }

    const llmData = await llmResponse.json()
    const selectedUrl = llmData.choices?.[0]?.message?.content?.trim() || ""

    console.log(`[v0] Perplexity selected URL for ${job.company}: ${selectedUrl}`)

    // Validate the URL
    if (selectedUrl === "NOT_FOUND" || !selectedUrl) {
      return "NOT_FOUND"
    }

    // Extract URL if LLM added any explanation
    const urlMatch = selectedUrl.match(/https?:\/\/[^\s<>"]+/)
    if (urlMatch) {
      const cleanUrl = urlMatch[0].replace(/[.,;!?)]+$/, "")

      // Final validation
      if (isValidJobApplicationUrl(cleanUrl)) {
        console.log(`[v0] ✓ Valid job application URL confirmed: ${cleanUrl}`)
        return cleanUrl
      }
    }

    return "NOT_FOUND"
  } catch (error) {
    console.error(`[v0] Error in findBestJobApplicationLink:`, error)
    return "NOT_FOUND"
  }
}

function isValidJobApplicationUrl(url: string): boolean {
  if (!url || url.length < 10) return false

  // Must be a valid URL
  try {
    new URL(url)
  } catch {
    return false
  }

  // Must be from job posting sites or company careers pages
  const validDomains = [
    "indeed.com",
    "linkedin.com",
    "glassdoor.com",
    "monster.com",
    "ziprecruiter.com",
    "careerbuilder.com",
    "dice.com",
    "simplyhired.com",
    "jobstreet.com",
    "seek.com",
    "reed.co.uk",
    "totaljobs.com",
    "stepstone.de",
    "xing.com",
    "naukri.com",
    "bayt.com",
    "jobkorea.co.kr",
    "saramin.co.kr",
    "wanted.co.kr",
  ]

  // Also accept company career pages (domains ending in .com, .co.uk, etc with /careers, /jobs, /apply)
  const urlLower = url.toLowerCase()

  const isFromJobSite = validDomains.some((domain) => urlLower.includes(domain))
  const isFromCareersPage =
    (urlLower.includes("/careers") ||
      urlLower.includes("/jobs") ||
      urlLower.includes("/apply") ||
      urlLower.includes("/job-opportunities") ||
      urlLower.includes("/hiring")) &&
    !urlLower.includes("google.com/search") &&
    !urlLower.includes("indeed.com/find") &&
    !urlLower.includes("linkedin.com/feed")

  return isFromJobSite || isFromCareersPage
}
