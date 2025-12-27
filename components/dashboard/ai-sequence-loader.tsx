"use client"

import { useEffect, useState } from "react"

interface AISequenceLoaderProps {
  type: "professional" | "student"
}

interface LoadingStep {
  message: string
  icon: string
  duration: number
}

export function AISequenceLoader({ type }: AISequenceLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const professionalSteps: LoadingStep[] = [
    { message: "Analyzing your professional profile...", icon: "👤", duration: 2000 },
    { message: "Searching global job markets...", icon: "🌍", duration: 2500 },
    { message: "Finding opportunities in your industry...", icon: "💼", duration: 2500 },
    { message: "Evaluating cost of living data...", icon: "💰", duration: 2000 },
    { message: "Matching skills with job requirements...", icon: "🎯", duration: 2500 },
    { message: "Filtering based on your budget...", icon: "💵", duration: 2000 },
    { message: "Finalizing personalized recommendations...", icon: "✨", duration: 2000 },
  ]

  const studentSteps: LoadingStep[] = [
    { message: "Analyzing your academic profile...", icon: "🎓", duration: 2000 },
    { message: "Searching universities worldwide...", icon: "🌏", duration: 2500 },
    { message: "Evaluating program compatibility...", icon: "📚", duration: 2500 },
    { message: "Calculating living expenses...", icon: "💰", duration: 2000 },
    { message: "Finding scholarship opportunities...", icon: "🏆", duration: 2500 },
    { message: "Filtering by your budget constraints...", icon: "💵", duration: 2000 },
    { message: "Preparing your recommendations...", icon: "✨", duration: 2000 },
  ]

  const steps = type === "professional" ? professionalSteps : studentSteps
  const totalSteps = steps.length

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < totalSteps - 1 ? prev + 1 : prev))
    }, steps[currentStep]?.duration || 2500)

    return () => clearInterval(stepInterval)
  }, [currentStep, totalSteps, steps])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment = 100 / (totalSteps * 20)
        return prev >= 100 ? 100 : prev + increment
      })
    }, 50)

    return () => clearInterval(progressInterval)
  }, [totalSteps])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      

      {/* Shimmer Cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-slate-100 rounded-lg overflow-hidden shadow-sm animate-pulse"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: "1.5s",
            }}
          >
            {/* Image shimmer */}
            <div className="h-40 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 animate-shimmer" />

            {/* Content shimmer */}
            <div className="p-4 space-y-3">
              <div className="h-6 bg-slate-200 rounded animate-shimmer" style={{ width: "70%" }} />
              <div className="h-4 bg-slate-200 rounded animate-shimmer" style={{ width: "90%" }} />
              <div className="h-4 bg-slate-200 rounded animate-shimmer" style={{ width: "60%" }} />
              <div className="flex gap-2 mt-4">
                <div className="h-8 bg-slate-200 rounded animate-shimmer flex-1" />
                <div className="h-8 bg-slate-200 rounded animate-shimmer flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Text */}
      <p className="text-slate-400 text-xs md:text-sm mt-6 max-w-lg text-center">
        Our AI agent is analyzing real-time data from multiple sources to provide you with the most accurate and
        personalized recommendations.
      </p>
    </div>
  )
}
