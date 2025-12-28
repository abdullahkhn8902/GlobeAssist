import { consumeStream, convertToModelMessages, streamText, type UIMessage, type LanguageModel } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"

export const maxDuration = 30

interface UserProfile {
  profileType: "student" | "professional"
  fullName: string
  latestQualification?: string
  universityName?: string
  graduationYear?: number
  gradeCgpa?: string
  currentlyStudying?: boolean
  degreeToPursue?: string
  preferredDestination?: string
  preferredYearOfIntake?: number
  budgetMin?: number
  budgetMax?: number
  applyForScholarships?: boolean
  fieldsOfInterest?: string[]
  whyThisField?: string
  currentJobTitle?: string
  companyName?: string
  yearsOfExperience?: number
  highestQualification?: string
  industryField?: string
  cvParsedData?: Record<string, unknown>
}

function buildSystemPrompt(userProfile: UserProfile | null): string {
  const basePrompt = `You are a helpful AI assistant for GlobeAssist, a platform that helps people find global opportunities. 
You provide personalized advice and information about studying abroad, working internationally, scholarships, visas, and accommodations.
Be friendly, informative, and supportive. Keep your responses concise but helpful.`

  if (!userProfile) {
    return basePrompt
  }

  if (userProfile.profileType === "student") {
    return `${basePrompt}

You are currently helping a student named ${userProfile.fullName}. Here is their profile information to personalize your responses:

- Latest Qualification: ${userProfile.latestQualification || "Not specified"}
- University/Institution: ${userProfile.universityName || "Not specified"}
- Graduation Year: ${userProfile.graduationYear || "Not specified"}
- Grade/CGPA: ${userProfile.gradeCgpa || "Not specified"}
- Currently Studying: ${userProfile.currentlyStudying ? "Yes" : "No"}
- Degree to Pursue: ${userProfile.degreeToPursue || "Not specified"}
- Preferred Destination Country: ${userProfile.preferredDestination || "Not specified"}
- Preferred Year of Intake: ${userProfile.preferredYearOfIntake || "Not specified"}
- Budget Range: $${userProfile.budgetMin || 0} - $${userProfile.budgetMax || 10000}
- Interested in Scholarships: ${userProfile.applyForScholarships ? "Yes" : "No"}
- Fields of Interest: ${userProfile.fieldsOfInterest?.join(", ") || "Not specified"}
- Why This Field: ${userProfile.whyThisField || "Not specified"}

Use this information to provide personalized recommendations for universities, programs, scholarships, and study abroad opportunities. 
Focus on opportunities that match their qualifications, budget, and preferred destination.`
  } else {
    return `${basePrompt}

You are currently helping a professional named ${userProfile.fullName}. Here is their profile information to personalize your responses:

- Current Job Title: ${userProfile.currentJobTitle || "Not specified"}
- Company: ${userProfile.companyName || "Not specified"}
- Years of Experience: ${userProfile.yearsOfExperience || "Not specified"}
- Highest Qualification: ${userProfile.highestQualification || "Not specified"}
- Industry/Field: ${userProfile.industryField || "Not specified"}
- Preferred Destination Country: ${userProfile.preferredDestination || "Not specified"}
- Budget Range: $${userProfile.budgetMin || 0} - $${userProfile.budgetMax || 10000}
${userProfile.cvParsedData ? `- CV Data Available: Yes (has detailed resume information)` : ""}

Use this information to provide personalized recommendations for job opportunities, visa options, work permits, and relocation guidance.
Focus on opportunities that match their experience level, industry, and preferred destination.`
  }
}

export async function POST(req: Request) {
  const { messages, userProfile }: { messages: UIMessage[]; userProfile: UserProfile | null } = await req.json()

  const openrouter = createOpenRouter({
    apiKey: process.env.OpenRouter_GPT_LLM || process.env.OPENROUTER_API_KEY,
  })

  const systemPrompt = buildSystemPrompt(userProfile)
  const prompt = convertToModelMessages(messages)

  const model = openrouter("openai/gpt-4o-mini") as unknown as LanguageModel

  const result = streamText({
    model,
    system: systemPrompt,
    messages: prompt,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log("[v0] Chat stream aborted")
      }
    },
    consumeSseStream: consumeStream,
  })
}
