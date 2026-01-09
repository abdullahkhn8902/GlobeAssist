import { NextResponse } from "next/server"

interface JobData {
  title: string
  company: string
  location?: string
  description?: string
  country?: string
}

const SERPER_API_KEY = process.env.SERPER_GOOGLE_SEARCH_API
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY_SONAR_SEARCH

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { job } = body as { job: JobData }

    if (!job?.title || !job?.company) {
      return NextResponse.json({ error: "Invalid job data" }, { status: 400 })
    }

    console.log(`[GlobeAssist] Fetching apply link for ${job.title} @ ${job.company}`)

    if (!SERPER_API_KEY || !OPENROUTER_API_KEY) {
      return NextResponse.json({
        link: googleFallback(job),
      })
    }

    const link = await findBestJobApplicationLink(job)

    return NextResponse.json({
      link: link !== "NOT_FOUND" ? link : googleFallback(job),
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

/* ======================= CORE LOGIC ======================= */

async function findBestJobApplicationLink(job: JobData): Promise<string> {
  const queries = [
    `"${job.title}" "${job.company}" site:careers`,
    `"${job.company}" "${job.title}" apply`,
    `${job.company} careers ${job.title}`,
  ]

  let allResults: any[] = []

  for (const q of queries) {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q, num: 10, gl: "us" }),
    })

    if (!res.ok) continue

    const data = await res.json()
    const results = data.organic || []


    allResults.push(...results)
    await new Promise(r => setTimeout(r, 200))
  }

  if (!allResults.length) return "NOT_FOUND"

  return pickWithLLM(job, allResults.slice(0, 12))
}

/* ======================= LLM SELECTION ======================= */

async function pickWithLLM(job: JobData, results: any[]): Promise<string> {
  const list = results
    .map(
      (r, i) =>
        `${i + 1}. ${r.link}\nTitle: ${r.title}\nSnippet: ${r.snippet ?? ""}`,
    )
    .join("\n\n")

  const prompt = `
Pick the BEST job application link this link must redirect us to exact Job POST of this:
Job Title: ${job.title}
Company: ${job.company}

Rules:
- Prefer official company career pages
- Job boards (LinkedIn, Indeed, Greenhouse, Lever) are OK
- Return ONLY the URL
- If none apply, return NOT_FOUND

Results:
${list}
`

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 150,
    }),
  })

  if (!res.ok) return "NOT_FOUND"

  const json = await res.json()
  const text = json.choices?.[0]?.message?.content?.trim() || ""

  if (text === "NOT_FOUND") return "NOT_FOUND"

  const match = text.match(/https?:\/\/[^\s<>"]+/)
  return match ? match[0] : "NOT_FOUND"
}

/* ======================= HELPERS ======================= */

function isValidJobUrl(url: string, company: string): boolean {
  if (!url) return false

  const lower = url.toLowerCase()

  const allowed = [
    "careers",
    "jobs",
    "greenhouse.io",
    "lever.co",
    "linkedin.com/jobs",
    "indeed.com",
  ]

  return (
    lower.includes(company.toLowerCase()) &&
    allowed.some(k => lower.includes(k))
  )
}

function googleFallback(job: JobData) {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${job.title} ${job.company} careers apply`,
  )}`
}
