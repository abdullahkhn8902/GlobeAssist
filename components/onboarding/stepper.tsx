"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface StepperProps {
  currentStep: number
  totalSteps: number
}

export function Stepper({ currentStep, totalSteps }: StepperProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
        <div key={step} className="flex items-center">
          {/* Step circle */}
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2",
              step < currentStep
                ? "bg-[#1d293d] border-[#1d293d] text-white" // Completed
                : step === currentStep
                  ? "bg-[#1d293d] border-[#1d293d] text-white ring-4 ring-[#1d293d]/20" // Current
                  : "bg-white border-[#cbd5e1] text-[#64748b]", // Uncompleted
            )}
          >
            {step < currentStep ? <Check className="w-5 h-5" /> : step}
          </div>

          {/* Connector line */}
          {index < totalSteps - 1 && (
            <div
              className={cn(
                "w-16 sm:w-24 h-0.5 transition-all duration-300",
                step < currentStep ? "bg-[#1d293d]" : "bg-[#cbd5e1]",
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
