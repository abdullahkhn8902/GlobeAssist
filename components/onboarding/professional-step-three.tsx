"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { ProfessionalOnboardingData } from "@/lib/types/onboarding"
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface ProfessionalStepThreeProps {
  data: ProfessionalOnboardingData
  onChange: (data: Partial<ProfessionalOnboardingData>) => void
  onPrev: () => void
  onSubmit: () => Promise<void>
}

export function ProfessionalStepThree({ data, onChange, onPrev, onSubmit }: ProfessionalStepThreeProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parseHint, setParseHint] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }, [])

  const handleFile = async (file: File) => {
    const fileNameLower = file.name.toLowerCase()
    const validExtensions = [".pdf", ".doc", ".docx", ".txt"]

    const hasValidExtension = validExtensions.some((ext) => fileNameLower.endsWith(ext))
    if (!hasValidExtension) {
      setParseError("Please upload a PDF, DOC, DOCX, or TXT file")
      setParseHint(null)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setParseError("File size must be less than 10MB")
      setParseHint(null)
      return
    }

    setFileName(file.name)
    setParseError(null)
    setParseHint(null)
    setIsParsing(true)

    try {
      // ✅ Get access token
      const supabase = createClient()
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession()
      if (sessionErr || !sessionRes.session) {
        setParseError("Session expired. Please login again.")
        setParseHint(null)
        setFileName(null)
        return
      }

      const formData = new FormData()
      formData.append("cv", file)

      const response = await fetch("/api/parse-cv", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionRes.session.access_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = "Failed to parse CV"
        let errorHint: string | null = null

        const contentType = response.headers.get("content-type") || ""
        if (contentType.includes("application/json")) {
          const result = await response.json().catch(() => null)
          if (result) {
            errorMessage = result.error || errorMessage
            errorHint = result.hint || null
          }
        } else {
          const t = await response.text()
          console.error("Non-JSON error:", t.slice(0, 200))
          errorMessage = `Server error (${response.status}). Please try again.`
        }

        setParseError(errorMessage)
        setParseHint(errorHint)
        setFileName(null)
        return
      }

      const result = await response.json()

      onChange({
        cvFileUrl: result.fileUrl || file.name,
        cvParsedData: result.parsedData,
      })
    } catch (error) {
      console.error("CV parsing error:", error)
      setParseError("Network error. Please check your connection and try again.")
      setParseHint("If the problem persists, try a different file format.")
      setFileName(null)
    } finally {
      setIsParsing(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0])
  }

  const handleRemoveFile = () => {
    setFileName(null)
    onChange({ cvFileUrl: "", cvParsedData: null })
    setParseError(null)
    setParseHint(null)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Upload CV</Label>

        {!fileName ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}
            `}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Upload CV</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, or TXT (max 10MB)</p>
                <p className="text-xs text-muted-foreground mt-0.5">For best results, use text-based PDFs</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground truncate max-w-48">{fileName}</p>
                  {isParsing ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Parsing CV...
                    </p>
                  ) : data.cvParsedData ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Parsed successfully
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                disabled={isParsing}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {parseError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {parseError}
            </p>
            {parseHint && <p className="text-xs text-muted-foreground mt-1 ml-6">{parseHint}</p>}
          </div>
        )}
      </div>

      {data.cvParsedData && (
        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Extracted Information</h3>

          {data.cvParsedData.personalInfo?.name && (
            <p className="text-sm">
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="text-foreground">{data.cvParsedData.personalInfo.name}</span>
            </p>
          )}

          {data.cvParsedData.personalInfo?.email && (
            <p className="text-sm">
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="text-foreground">{data.cvParsedData.personalInfo.email}</span>
            </p>
          )}

          {data.cvParsedData.skills && data.cvParsedData.skills.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Skills:</p>
              <div className="flex flex-wrap gap-1">
                {data.cvParsedData.skills.slice(0, 8).map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                    {skill}
                  </span>
                ))}
                {data.cvParsedData.skills.length > 8 && (
                  <span className="px-2 py-0.5 text-muted-foreground text-xs">
                    +{data.cvParsedData.skills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {data.cvParsedData.experience && data.cvParsedData.experience.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">Experience:</span>{" "}
              <span className="text-foreground">{data.cvParsedData.experience.length} position(s) found</span>
            </p>
          )}

          {data.cvParsedData.education && data.cvParsedData.education.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">Education:</span>{" "}
              <span className="text-foreground">{data.cvParsedData.education.length} entry(ies) found</span>
            </p>
          )}

          {data.cvParsedData.languages && data.cvParsedData.languages.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">Languages:</span>{" "}
              <span className="text-foreground">{data.cvParsedData.languages.join(", ")}</span>
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button
          onClick={onPrev}
          variant="outline"
          className="px-8 h-11 rounded-xl font-semibold border-border bg-transparent"
          disabled={isSubmitting || isParsing}
        >
          Prev
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isParsing}
          className="bg-[#1d293d] text-[#e2e8f0] hover:bg-[#1d293d]/90 px-8 h-11 rounded-xl font-semibold"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Completing...
            </span>
          ) : (
            "Done"
          )}
        </Button>
      </div>
    </div>
  )
}
