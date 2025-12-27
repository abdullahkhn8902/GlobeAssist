"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { QUALIFICATIONS, INDUSTRIES } from "@/lib/types/onboarding"
import type { ProfessionalOnboardingData } from "@/lib/types/onboarding"
import { Briefcase, Building2, Calendar } from "lucide-react"

interface ProfessionalStepOneProps {
  data: ProfessionalOnboardingData
  onChange: (data: Partial<ProfessionalOnboardingData>) => void
  onNext: () => void
}

export function ProfessionalStepOne({ data, onChange, onNext }: ProfessionalStepOneProps) {
  const experienceYears = Array.from({ length: 31 }, (_, i) => i)

  const isValid =
    data.currentJobTitle && data.yearsOfExperience !== null && data.highestQualification && data.industryField

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Current Job Title</Label>
        <div className="relative">
          <Input
            placeholder="e.g., Software Engineer"
            value={data.currentJobTitle}
            onChange={(e) => onChange({ currentJobTitle: e.target.value })}
            className="bg-muted/50 border-border  pl-11 text-foreground placeholder:text-muted-foreground"
          />
          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Company Name (Optional)</Label>
        <div className="relative">
          <Input
            placeholder="e.g., Google"
            value={data.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            className="bg-muted/50 border-border  pl-11 text-foreground placeholder:text-muted-foreground"
          />
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Years of Experience</Label>
        <Select
          value={data.yearsOfExperience?.toString() || ""}
          onValueChange={(value) => onChange({ yearsOfExperience: Number.parseInt(value) })}
        >
          <SelectTrigger className="bg-muted/50 border-border h-12 w-full text-foreground">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Select years" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            {experienceYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year === 0 ? "Less than 1 year" : year === 1 ? "1 year" : `${year} years`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Highest Qualification</Label>
        <Select value={data.highestQualification} onValueChange={(value) => onChange({ highestQualification: value })}>
          <SelectTrigger className="bg-muted/50 border-border h-12 w-full text-foreground">
            <SelectValue placeholder="Select qualification" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            {QUALIFICATIONS.map((qual) => (
              <SelectItem key={qual} value={qual}>
                {qual}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Industry/Field</Label>
        <Select value={data.industryField} onValueChange={(value) => onChange({ industryField: value })}>
          <SelectTrigger className="bg-muted/50 border-border h-12 w-full text-foreground">
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            {INDUSTRIES.map((industry) => (
              <SelectItem key={industry} value={industry}>
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="bg-[#1d293d] text-[#e2e8f0] hover:bg-[#1d293d]/90 px-8 h-11 rounded-xl font-semibold"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
