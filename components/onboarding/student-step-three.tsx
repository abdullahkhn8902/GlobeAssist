"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FIELDS_OF_INTEREST } from "@/lib/types/onboarding"
import type { StudentOnboardingData } from "@/lib/types/onboarding"
import { Loader2, X } from "lucide-react"

interface StudentStepThreeProps {
  data: StudentOnboardingData
  onChange: (data: Partial<StudentOnboardingData>) => void
  onPrev: () => void
  onSubmit: () => Promise<void>
}

export function StudentStepThree({ data, onChange, onPrev, onSubmit }: StudentStepThreeProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddField = (field: string) => {
    if (field && !data.fieldsOfInterest.includes(field)) {
      onChange({ fieldsOfInterest: [...data.fieldsOfInterest, field] })
    }
  }

  const handleRemoveField = (field: string) => {
    onChange({ fieldsOfInterest: data.fieldsOfInterest.filter((f) => f !== field) })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">What field(s) are you interested in?</Label>
        <Select onValueChange={handleAddField} value="">
          <SelectTrigger className="bg-muted/50 border-border h-12 w-full text-foreground">
            <SelectValue placeholder="Select field(s) of interest" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            {FIELDS_OF_INTEREST.filter((field) => !data.fieldsOfInterest.includes(field)).map((field) => (
              <SelectItem key={field} value={field}>
                {field}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Selected fields tags */}
        {data.fieldsOfInterest.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.fieldsOfInterest.map((field) => (
              <span
                key={field}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
              >
                {field}
                <button
                  type="button"
                  onClick={() => handleRemoveField(field)}
                  className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Why this field? (Optional)</Label>
        <Textarea
          placeholder="Tell us why you're interested in this field..."
          value={data.whyThisField}
          onChange={(e) => onChange({ whyThisField: e.target.value })}
          className="bg-muted/50 border-border min-h-[100px] text-foreground placeholder:text-muted-foreground resize-none"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button
          onClick={onPrev}
          variant="outline"
          className="px-8 h-11 rounded-xl font-semibold border-border bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isSubmitting}
        >
          Prev
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || data.fieldsOfInterest.length === 0}
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
