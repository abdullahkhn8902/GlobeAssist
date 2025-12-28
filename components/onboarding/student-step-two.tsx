"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { COUNTRIES, DEGREES } from "@/lib/types/onboarding"
import type { StudentOnboardingData } from "@/lib/types/onboarding"
import {
  STUDENT_BUDGET_BRACKETS,
  isBudgetSufficientForCountry,
  getBudgetWarningMessage,
  getRecommendedCountriesForBudget,
  COUNTRY_BUDGET_DATA,
  getMinimumBudget,
  normalizeCountryNameForBudget,
} from "@/lib/budget-data"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

interface StudentStepTwoProps {
  data: StudentOnboardingData
  onChange: (data: Partial<StudentOnboardingData>) => void
  onNext: () => void
  onPrev: () => void
}

export function StudentStepTwo({ data, onChange, onNext, onPrev }: StudentStepTwoProps) {
  const currentYear = new Date().getFullYear()
  const intakeYears = Array.from({ length: 5 }, (_, i) => currentYear + i)
  const profileType = "student"

  const budgetValidation = data.preferredDestination
    ? isBudgetSufficientForCountry(data.preferredDestination, data.budgetMax, profileType)
    : null

  const budgetWarning = data.preferredDestination
    ? getBudgetWarningMessage(data.preferredDestination, data.budgetMax, profileType)
    : null

  const affordableCountries = getRecommendedCountriesForBudget(data.budgetMax, profileType)

  const minimumBudget = getMinimumBudget(profileType)
  const isBelowMinimum = data.budgetMax > 0 && data.budgetMax < minimumBudget

  const getCountryBudgetInfo = (countryName: string) => {
    const normalizedCountryName = normalizeCountryNameForBudget(countryName);
    const countryData = COUNTRY_BUDGET_DATA.find(
      (c) => c.country.toLowerCase() === normalizedCountryName.toLowerCase()
    )
    if (!countryData) return null
    return {
      min: countryData.studentUsdMin,
      max: countryData.studentUsdMax,
      tier: countryData.tier,
    }
  }

  const isValid = data.degreeToPursue && data.preferredDestination && data.preferredYearOfIntake && !isBelowMinimum

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Which degree are you planning to pursue?</Label>
        <Select value={data.degreeToPursue} onValueChange={(value) => onChange({ degreeToPursue: value })}>
          <SelectTrigger className="bg-muted/50 border-border h-12 w-full text-foreground">
            <SelectValue placeholder="Select degree type" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            {DEGREES.map((degree) => (
              <SelectItem key={degree} value={degree}>
                {degree}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium text-card-foreground">Select your total education budget (USD)</Label>
        <Select
          value={data.budgetMax > 0 ? `${data.budgetMax}` : ""}
          onValueChange={(value) => {
            const bracket = STUDENT_BUDGET_BRACKETS.find((b) => b.max.toString() === value)
            if (bracket) {
              onChange({ budgetMin: bracket.min, budgetMax: bracket.max })
            }
          }}
        >
          <SelectTrigger className="bg-muted/50 border-border h-12 w-full text-foreground">
            <SelectValue placeholder="Select your budget range" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            {STUDENT_BUDGET_BRACKETS.map((bracket) => (
              <SelectItem key={bracket.max} value={bracket.max.toString()}>
                {bracket.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {data.budgetMax > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>
              Selected: ${data.budgetMin.toLocaleString()} - ${data.budgetMax.toLocaleString()}
            </span>
          </div>
        )}

        {isBelowMinimum && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Budget too low</p>
              <p>
                The minimum budget for any country is ${minimumBudget.toLocaleString()}. Please select a higher budget
                range.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Preferred Study Destination</Label>
        <Select value={data.preferredDestination} onValueChange={(value) => onChange({ preferredDestination: value })}>
          <SelectTrigger className="bg-muted/50 border-border h-12 w-full text-foreground">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            {COUNTRIES.map((country) => {
              const budgetInfo = getCountryBudgetInfo(country)
              const isAffordable = budgetInfo && data.budgetMax >= budgetInfo.min
              
              return (
                <SelectItem 
                  key={country} 
                  value={country}
                  disabled={data.budgetMax > 0 && !isAffordable}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <span className={data.budgetMax > 0 && !isAffordable ? "text-muted-foreground opacity-50" : ""}>
                      {country}
                    </span>
                    {budgetInfo && data.budgetMax > 0 && (
                      <span className={`text-xs ${isAffordable ? "text-green-600" : "text-red-500"}`}>
                        {isAffordable ? "✓ Affordable" : `Min: $${(budgetInfo.min / 1000).toFixed(0)}k`}
                      </span>
                    )}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>

        {data.preferredDestination && budgetValidation && (
          <>
            {budgetValidation.sufficient ? (
              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">Budget compatible with {data.preferredDestination}</p>
                  <p>
                    Typical range: ${budgetValidation.minRequired.toLocaleString()} - $
                    {budgetValidation.maxRecommended.toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              budgetWarning && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">Budget may be insufficient</p>
                    <p>{budgetWarning}</p>
                    {affordableCountries.length > 0 && (
                      <p className="mt-1">
                        <strong>Suggested alternatives:</strong> {affordableCountries.slice(0, 4).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-card-foreground">Preferred Year of Intake</Label>
        <Select
          value={data.preferredYearOfIntake?.toString() || ""}
          onValueChange={(value) => onChange({ preferredYearOfIntake: Number.parseInt(value) })}
        >
          <SelectTrigger className="bg-muted/50 border-border h-12 w-full text-foreground">
            <SelectValue placeholder="Select intake year" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg">
            {intakeYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Label className="text-sm font-medium text-card-foreground">Do you plan to apply for scholarships?</Label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={data.applyForScholarships === true}
              onCheckedChange={() => onChange({ applyForScholarships: true })}
              className="border-border data-[state=checked]:bg-primary"
            />
            <span className="text-sm text-foreground">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={data.applyForScholarships === false}
              onCheckedChange={() => onChange({ applyForScholarships: false })}
              className="border-border data-[state=checked]:bg-primary"
            />
            <span className="text-sm text-foreground">No</span>
          </label>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          onClick={onPrev}
          variant="outline"
          className="px-8 h-11 rounded-xl font-semibold border-border bg-transparent"
        >
          Prev
        </Button>
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