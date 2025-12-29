import { NextResponse } from "next/server"
import { OpenRouter } from "@openrouter/sdk"

export const maxDuration = 30

// Create OpenRouter client
const openrouter = new OpenRouter({
  apiKey: process.env.OpenRouter_GPT_LLM || process.env.OpenRouter_GPT_LLM || "",
})

// Simple system prompt that works with free model
const SYSTEM_PROMPT = `You are GlobeAssist AI, a helpful assistant for a platform that helps people find global opportunities. 
You provide general advice about studying abroad, working internationally, scholarships, visas, and accommodations.
Be friendly, informative, and supportive. Keep your responses concise but helpful.

IMPORTANT RULES:
1. NEVER claim to have user profile data or specific personal information
2. Provide general advice based on common knowledge
3. If asked about specific user data, politely explain you can only provide general information
4. Focus on factual information about countries, education systems, visa processes, etc.
5. Keep responses under 300 words
6. Format responses with clear paragraphs and bullet points when appropriate`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Convert messages to OpenRouter format
    const openrouterMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((msg: any) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content || msg.parts?.[0]?.text || "",
      })),
    ]

    // Get the last user message
    const lastUserMessage = messages
      .slice()
      .reverse()
      .find((msg: any) => msg.role === "user")
    const query = lastUserMessage?.content || lastUserMessage?.parts?.[0]?.text || ""

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call OpenRouter API with streaming
          const openrouterStream = await openrouter.chat.send({
            model: "openai/gpt-oss-120b:free",
            messages: openrouterMessages,
            stream: true,
            streamOptions: {
              includeUsage: true,
            },
          })

          // Stream the response
          for await (const chunk of openrouterStream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`))
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        } catch (error) {
          console.error("[GlobeAssist Server] Chat error:", error)
          
          // Fallback response if OpenRouter fails
          const fallbackResponse = `I'm here to help you with GlobeAssist! You can ask me about:
- Study abroad opportunities in various countries
- Visa requirements for different destinations
- General information about universities and programs
- Tips for preparing your applications
- Budget planning for international education/work

What would you like to know about today?`
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: fallbackResponse })}\n\n`))
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("[GlobeAssist Server] Chat API error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}