"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Send, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  profileType: "student" | "professional"
  fullName: string
  // Student fields
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
  // Professional fields
  currentJobTitle?: string
  companyName?: string
  yearsOfExperience?: number
  highestQualification?: string
  industryField?: string
  cvParsedData?: Record<string, unknown>
}

interface StoredMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

const studentSuggestions = [
  "Can you help me find scholarships abroad?",
  "Which universities match my profile?",
  "How can I get an internship in the UK?",
]

const professionalSuggestions = [
  "What are the best countries for tech jobs?",
  "What are the visa options for working in Australia?",
  "How can I get a job in the UK?",
]

const CHAT_TTL_MS = 60 * 60 * 1000

export default function ChatPage() {
  const [input, setInput] = useState("")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [initialMessages, setInitialMessages] = useState<
    Array<{ id: string; role: "user" | "assistant"; content: string }>
  >([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastSavedMessageCountRef = useRef(0)

  const chatOptions: any = {
    transport: (new DefaultChatTransport({ api: "/api/chat" }) as unknown) as any,
    body: {
      userProfile,
      userId,
    },
    initialMessages: initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: "text" as const, text: m.content }],
    })),
  }

  const { messages, sendMessage, status, setMessages } = useChat(chatOptions)

  // Simple markdown -> HTML renderer (safe-ish): escape HTML then convert basic markdown
  function escapeHtml(unsafe: string) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }

  function renderMarkdownToHtml(md: string) {
    if (!md) return ""
    let out = escapeHtml(md)
    // Code blocks ```
    out = out.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${escapeHtml(code)}</code></pre>`)
    // Inline code
    out = out.replace(/`([^`]+)`/g, (_m, code) => `<code>${escapeHtml(code)}</code>`)
    // Bold **text**
    out = out.replace(/\*\*([^*]+)\*\*/g, (_m, t) => `<strong>${t}</strong>`)
    // Italic *text*
    out = out.replace(/\*([^*]+)\*/g, (_m, t) => `<em>${t}</em>`)
    // Links [text](url)
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
      const safeUrl = escapeHtml(url)
      return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${text}</a>`
    })
    // Convert line breaks
    out = out.replace(/\n{2,}/g, "</p><p>")
    out = `<p>${out.replace(/\n/g, "<br />")}</p>`
    return out
  }

  const loadStoredMessages = useCallback(async (uid: string) => {
    const supabase = createClient()
    const oneHourAgo = new Date(Date.now() - CHAT_TTL_MS).toISOString()

    await supabase.from("chat_messages").delete().lt("created_at", oneHourAgo)

    const { data: storedMessages } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", uid)
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: true })

    if (storedMessages && storedMessages.length > 0) {
      const formattedMessages = storedMessages.map((m: StoredMessage) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
      setInitialMessages(formattedMessages)
      lastSavedMessageCountRef.current = formattedMessages.length
    }
    setIsLoadingMessages(false)
  }, [])

  const saveMessageToDb = useCallback(async (uid: string, role: "user" | "assistant", content: string) => {
    const supabase = createClient()
    await supabase.from("chat_messages").insert({
      user_id: uid,
      role,
      content,
    })
  }, [])

  useEffect(() => {
    async function fetchUserProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoadingProfile(false)
        setIsLoadingMessages(false)
        return
      }

      setUserId(user.id)
      loadStoredMessages(user.id)

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("profile_type, full_name")
        .eq("user_id", user.id)
        .single()

      if (!profile) {
        setIsLoadingProfile(false)
        return
      }

      const profileType = profile.profile_type as "student" | "professional"

      if (profileType === "student") {
        const { data: studentProfile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (studentProfile) {
          setUserProfile({
            profileType: "student",
            fullName: profile.full_name || "User",
            latestQualification: studentProfile.latest_qualification,
            universityName: studentProfile.university_name,
            graduationYear: studentProfile.graduation_year,
            gradeCgpa: studentProfile.grade_cgpa,
            currentlyStudying: studentProfile.currently_studying,
            degreeToPursue: studentProfile.degree_to_pursue,
            preferredDestination: studentProfile.preferred_destination,
            preferredYearOfIntake: studentProfile.preferred_year_of_intake,
            budgetMin: studentProfile.budget_min,
            budgetMax: studentProfile.budget_max,
            applyForScholarships: studentProfile.apply_for_scholarships,
            fieldsOfInterest: studentProfile.fields_of_interest,
            whyThisField: studentProfile.why_this_field,
          })
        }
      } else {
        const { data: professionalProfile } = await supabase
          .from("professional_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (professionalProfile) {
          setUserProfile({
            profileType: "professional",
            fullName: profile.full_name || "User",
            currentJobTitle: professionalProfile.current_job_title,
            companyName: professionalProfile.company_name,
            yearsOfExperience: professionalProfile.years_of_experience,
            highestQualification: professionalProfile.highest_qualification,
            industryField: professionalProfile.industry_field,
            preferredDestination: professionalProfile.preferred_destination,
            budgetMin: professionalProfile.budget_min,
            budgetMax: professionalProfile.budget_max,
            cvParsedData: professionalProfile.cv_parsed_data,
          })
        }
      }

      setIsLoadingProfile(false)
    }

    fetchUserProfile()
  }, [loadStoredMessages])

  useEffect(() => {
    if (!userId || messages.length === 0) return

    const newMessages = messages.slice(lastSavedMessageCountRef.current)

    newMessages.forEach((message) => {
      const content = message.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("")

      if (content && message.role !== "system") {
        saveMessageToDb(userId, message.role as "user" | "assistant", content)
      }
    })

    lastSavedMessageCountRef.current = messages.length
  }, [messages, userId, saveMessageToDb])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = (text: string) => {
    if (!text.trim() || status !== "ready") return
    sendMessage({ text })
    setInput("")
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const suggestions = userProfile?.profileType === "professional" ? professionalSuggestions : studentSuggestions

  if (isLoadingProfile || isLoadingMessages) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-200">
        <div className="w-8 h-8 border-2 border-slate-600/30 border-t-slate-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-200">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-2xl font-bold text-slate-800 mb-8">How can we help ?</h1>

            {/* Suggestion Pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-8 max-w-2xl">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-300 rounded-full hover:bg-slate-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Area for Empty State */}
            <div className="w-full max-w-xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage(input)
                }}
                className="relative"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything"
                  className="w-full px-4 py-3 pr-12 text-slate-700 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                  disabled={status !== "ready"}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || status !== "ready"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4 pb-32">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-slate-800 text-white"
                      : "bg-white text-slate-800 border border-slate-200"
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <div
                          key={index}
                          className="whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(part.text) }}
                        />
                      )
                    }
                    return null
                  })}
                </div>
              </div>
            ))}
            {status === "streaming" && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-800 border border-slate-200 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Area (when there are messages) */}
      {messages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-[60px] p-4 bg-slate-200">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage(input)
              }}
              className="relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything"
                className="w-full px-4 py-3 pr-12 text-slate-700 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                disabled={status !== "ready"}
              />
              <button
                type="submit"
                disabled={!input.trim() || status !== "ready"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
              {status === "streaming" && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  <span className="text-sm text-slate-600">Thinking…</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
