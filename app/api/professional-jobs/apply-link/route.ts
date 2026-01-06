import { NextResponse } from "next/server"

interface JobData {
  title: string
  company: string
  location: string
  description?: string
  country?: string
}

const SERPER_API_KEY = process.env.SERPER_GOOGLE_SEARCH_API
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY_SONAR_SEARCH 

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { job } = body as { job: JobData }

    if (!job || !job.title || !job.company) {
      return NextResponse.json({ error: "Invalid job data" }, { status: 400 })
    }

    console.log(`[GlobeAssist Server] Fetching apply link on-demand for: ${job.title} at ${job.company}`)

    if (!SERPER_API_KEY || !OPENROUTER_API_KEY) {
      console.log("[GlobeAssist Server] Missing required API keys for link fetching")
      return NextResponse.json({
        link: `https://www.google.com/search?q=${encodeURIComponent(
          `${job.title} ${job.company} apply now careers ${job.location} job posting`,
        )}`,
      })
    }

    // Find the best apply link using Serper + LLM
    const resultLink = await findBestJobApplicationLink(job, SERPER_API_KEY, OPENROUTER_API_KEY)

    if (resultLink && resultLink !== "NOT_FOUND") {
      console.log(`[GlobeAssist Server] ✓ Found apply link: ${resultLink}`)
      return NextResponse.json({ link: resultLink })
    }

    // Fallback to enhanced Google search
    const fallbackLink = `https://www.google.com/search?q=${encodeURIComponent(
      `"${job.company}" "${job.title}" job apply careers submit 2025 ${job.location || job.country}`,
    )}`
    console.log(`[GlobeAssist Server] Using fallback Google search for ${job.company}`)
    return NextResponse.json({ link: fallbackLink })
  } catch (error) {
    console.error("[GlobeAssist Server] Error fetching job apply link:", error)
    return NextResponse.json({ error: "Failed to fetch application link" }, { status: 500 })
  }
}

async function findBestJobApplicationLink(job: JobData, serperApiKey: string, llmApiKey: string): Promise<string> {
  try {
    // Use the user's preferred query plus a couple of supporting variants
    const searchQueries = [
      `Job Post of "${job.title}" at "${job.company}" in ${job.location || job.country}`,
      `"${job.company}" "${job.title}" job apply careers ${job.location || job.country}`,
      `${job.company} careers ${job.title} ${job.location || job.country} apply`,
    ]

    let allResults: any[] = []

    for (const query of searchQueries) {
      console.log(`[GlobeAssist Server] Searching Serper for: ${query}`)
      try {
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": serperApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            num: 15,
            gl: "us",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const results = data.organic || []
          allResults = [...allResults, ...results]
          console.log(`[GlobeAssist Server] Got ${results.length} results from Serper for query`)
        } else {
          console.log(`[GlobeAssist Server] Serper request failed with status: ${response.status}`)
        }
      } catch (fetchError) {
        console.error(`[GlobeAssist Server] Serper fetch error for query "${query}":`, fetchError)
      }

      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    if (allResults.length === 0) {
      console.log(`[GlobeAssist Server] No search results found for ${job.company} ${job.title}`)
      return "NOT_FOUND"
    }

    // Dedupe by link and limit to top 20
    const uniqueResults = Array.from(new Map(allResults.map((item) => [item.link, item])).values()).slice(0, 20)

    console.log(`[GlobeAssist Server] Got ${uniqueResults.length} unique results, sending to LLM for best-link selection`)

    const resultsText = uniqueResults
      .map((r, idx) => `${idx + 1}. URL: ${r.link}\n   Title: ${r.title}\n   Snippet: ${r.snippet ?? ""}`)
      .join("\n\n")

    // Strong prompt instructing the LLM to return only the best URL (or NOT_FOUND)
    const prompt = `You are an expert at finding an EXACT job posting page. Given the search results below, pick the SINGLE BEST URL that is the actual job posting/application page for the position "${job.title}" at "${job.company}".  

SEARCH RESULTS:
${resultsText}

RULES:
1) Return ONLY the single best URL (plain text) and nothing else. The URL must start with http:// or https://.
2) The link should be the direct job posting or application page (company career posting or job board posting).
3) If no single result is a direct job posting, return exactly: NOT_FOUND
4) Do not include commentary, numbering, or explanation — only the URL or NOT_FOUND.

OUTPUT:`


    const llmResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llmApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 250,
        temperature: 0.0,
      }),
    })

    if (!llmResponse.ok) {
      if (llmResponse.status === 401) {
        console.error(`[GlobeAssist Server] LLM API unauthorized (401). Check OPENROUTER API key.`)
      } else {
        console.error(`[GlobeAssist Server] LLM API error: ${llmResponse.status}`)
      }
      return "NOT_FOUND"
    }

    const llmData = await llmResponse.json()
    const rawText = llmData.choices?.[0]?.message?.content?.trim?.() ?? ""
    console.log(`[GlobeAssist Server] LLM raw response: ${rawText}`)

    if (!rawText) return "NOT_FOUND"
    if (rawText === "NOT_FOUND") return "NOT_FOUND"

    // Extract the first http(s) URL from the LLM response (if it gave extra text)
    const urlMatch = rawText.match(/https?:\/\/[^\s<>\"]+/i)
    if (urlMatch) {
      let cleanUrl = urlMatch[0].replace(/[.,;!?)]+$/, "")
      return cleanUrl
    }

    // If the LLM didn't return a URL, treat as NOT_FOUND
    return "NOT_FOUND"
  } catch (error) {
    console.error(`[GlobeAssist Server] Error in findBestJobApplicationLink:`, error)
    return "NOT_FOUND"
  }
}
