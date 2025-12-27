"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { QUALIFICATIONS } from "@/lib/types/onboarding"
import type { StudentOnboardingData } from "@/lib/types/onboarding"

interface StudentStepOneProps {
  data: StudentOnboardingData
  onChange: (data: Partial<StudentOnboardingData>) => void
  onNext: () => void
}

export function StudentStepOne({ data, onChange, onNext }: StudentStepOneProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i)

  const isValid = data.latestQualification && data.universityName && data.graduationYear

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Latest Qualification</Label>
        <Select value={data.latestQualification} onValueChange={(value) => onChange({ latestQualification: value })}>
          <SelectTrigger className="bg-muted/50 border-border h-12 text-foreground w-full">
            <SelectValue placeholder="Select your qualification" />
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
        <Label className="text-sm font-medium text-card-foreground">University Name</Label>
        <Input
          placeholder="Enter your university name"
          value={data.universityName}
          onChange={(e) => onChange({ universityName: e.target.value })}
          className="bg-muted/50 border-border  text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Graduation Year</Label>
        <Select
          value={data.graduationYear?.toString() || ""}
          onValueChange={(value) => onChange({ graduationYear: Number.parseInt(value) })}
        >
          <SelectTrigger className="bg-muted/50 border-border text-foreground w-full">
            <SelectValue placeholder="Select graduation year" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Grade/Percentage or CGPA</Label>
        <Input
          placeholder="e.g., 3.8 GPA or 85%"
          value={data.gradeCgpa}
          onChange={(e) => onChange({ gradeCgpa: e.target.value })}
          className="bg-muted/50 border-border  text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Label className="text-sm font-medium text-card-foreground">Are you currently studying?</Label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={data.currentlyStudying === true}
              onCheckedChange={() => onChange({ currentlyStudying: true })}
              className="border-border data-[state=checked]:bg-primary"
            />
            <span className="text-sm text-foreground">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={data.currentlyStudying === false}
              onCheckedChange={() => onChange({ currentlyStudying: false })}
              className="border-border data-[state=checked]:bg-primary"
            />
            <span className="text-sm text-foreground">No</span>
          </label>
        </div>
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
