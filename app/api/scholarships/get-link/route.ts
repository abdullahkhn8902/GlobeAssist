import { NextResponse } from "next/server"

interface Scholarship {
  id: string
  name: string
  university: string
  location: string
  qualification: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { scholarship } = body as { scholarship: Scholarship }

    if (!scholarship || !scholarship.name || !scholarship.university) {
      return NextResponse.json({ error: "Invalid scholarship data" }, { status: 400 })
    }

    console.log(`[GlobeAssist Server] Fetching application link on-demand for: ${scholarship.name}`)

    const serperApiKey = process.env.SERPER_GOOGLE_SEARCH_API
    const llmApiKey = process.env.OPENROUTER_API_KEY

    if (!serperApiKey || !llmApiKey) {
      console.log("[GlobeAssist Server] Missing required API keys for link fetching")
      return NextResponse.json({
        link: `https://www.google.com/search?q=${encodeURIComponent(
          `${scholarship.name} ${scholarship.university} official application form submit apply now 2026`,
        )}`,
      })
    }

    // Find the best application link using Serper + LLM
    const validLink = await findBestApplicationLinkWithLLM(scholarship, serperApiKey, llmApiKey)

    if (validLink && validLink !== "NOT_FOUND") {
      console.log(`[GlobeAssist Server] ✓ Found valid application link for ${scholarship.name}: ${validLink}`)
      return NextResponse.json({ link: validLink })
    }

    // Fallback to enhanced Google search
    const fallbackLink = `https://www.google.com/search?q=${encodeURIComponent(
      `${scholarship.name} ${scholarship.university} official application portal submit apply 2026`,
    )}`
    console.log(`[GlobeAssist Server] Using fallback Google search for ${scholarship.name}`)
    return NextResponse.json({ link: fallbackLink })
  } catch (error) {
    console.error("[GlobeAssist Server] Error fetching scholarship link:", error)
    return NextResponse.json({ error: "Failed to fetch application link" }, { status: 500 })
  }
}

async function findBestApplicationLinkWithLLM(
  scholarship: Scholarship,
  serperApiKey: string,
  llmApiKey: string,
): Promise<string> {
  try {
    // Search queries optimized for finding official application pages
    const searchQueries = [
      `"${scholarship.name}" "${scholarship.university}" apply online application form portal`,
      `${scholarship.university} ${scholarship.name} scholarship how to apply admission`,
      `${scholarship.name} official application ${scholarship.university} submit`,
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
            num: 10,
            gl: "us",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const results = data.organic || []
          allResults = [...allResults, ...results]
          console.log(`[GlobeAssist Server] Got ${results.length} results from Serper`)
        } else {
          console.log(`[GlobeAssist Server] Serper request failed with status: ${response.status}`)
        }
      } catch (fetchError) {
        console.error(`[GlobeAssist Server] Serper fetch error for query "${query}":`, fetchError)
      }

      // Delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    if (allResults.length === 0) {
      console.log(`[GlobeAssist Server] No search results found for ${scholarship.name}`)
      return "NOT_FOUND"
    }

    // Remove duplicates based on URL
    const uniqueResults = Array.from(new Map(allResults.map((item) => [item.link, item])).values()).slice(0, 15)

    console.log(`[GlobeAssist Server] Got ${uniqueResults.length} unique results, sending to LLM for analysis`)

    // Use LLM to analyze results and pick the best application link
    const resultsText = uniqueResults
      .map((r, idx) => `${idx + 1}. URL: ${r.link}\n   Title: ${r.title}\n   Snippet: ${r.snippet}`)
      .join("\n\n")

    const prompt = `You are an expert at finding official scholarship application pages. Analyze these search results and find the BEST official application submission page for the "${scholarship.name}" scholarship at ${scholarship.university}.

SEARCH RESULTS:
${resultsText}

REQUIREMENTS FOR THE BEST LINK:
1. Must be from the official university website (.edu, .ac.uk, etc.) or official scholarship organization
2. Must be a direct application/admission/portal page (not just information page)
3. Should contain words like: apply, application, admission, submit, portal, form
4. Should be specific to this scholarship or at least the university's scholarship program
5. Avoid: Generic scholarship listing sites (scholarshipportal.com, findscholarship, etc.)
6. Avoid: News articles, blog posts, or general information pages

INSTRUCTIONS:
- Analyze ALL the search results carefully
- Return ONLY the single best URL that meets the requirements above
- Return just the URL as plain text, nothing else
- If NO result meets the requirements (all are generic listing sites or info pages), return exactly: NOT_FOUND

YOUR RESPONSE (URL only):`

    const llmResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llmApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
  model: "openai/gpt-oss-120b:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
      }),
    })

    if (!llmResponse.ok) {
      console.error(`[GlobeAssist Server] LLM API error: ${llmResponse.status}`)
      return "NOT_FOUND"
    }

    const llmData = await llmResponse.json()
    const selectedUrl = llmData.choices?.[0]?.message?.content?.trim() || ""

    console.log(`[GlobeAssist Server] LLM selected URL for ${scholarship.name}: ${selectedUrl}`)

    // Validate the URL
    if (selectedUrl === "NOT_FOUND" || !selectedUrl) {
      return "NOT_FOUND"
    }

    // Extract URL if LLM added any explanation
    const urlMatch = selectedUrl.match(/https?:\/\/[^\s<>"]+/)
    if (urlMatch) {
      const cleanUrl = urlMatch[0].replace(/[.,;!?)]+$/, "")

      // Final validation
      if (isValidApplicationUrl(cleanUrl)) {
        console.log(`[GlobeAssist Server] ✓ Valid application URL confirmed: ${cleanUrl}`)
        return cleanUrl
      }
    }

    return "NOT_FOUND"
  } catch (error) {
    console.error(`[GlobeAssist Server] Error in findBestApplicationLinkWithLLM for ${scholarship.name}:`, error)
    return "NOT_FOUND"
  }
}

function isValidApplicationUrl(url: string): boolean {
  if (!url || url.length < 10) return false

  // Must be a valid URL
  try {
    new URL(url)
  } catch {
    return false
  }

  // Reject generic scholarship listing sites
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
      console.log(`[GlobeAssist Server] Rejected blacklisted site: ${url}`)
      return false
    }
  }

  // Must not be a Google search URL
  if (urlLower.includes("google.com/search")) {
    console.log(`[GlobeAssist Server] Rejected Google search URL: ${url}`)
    return false
  }

  return true
}
