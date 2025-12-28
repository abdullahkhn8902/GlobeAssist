"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface AISequenceLoaderProps {
  type: "professional" | "student"
}

interface LoadingStep {
  message: string
  subMessage?: string
}

export function AISequenceLoader({ type }: AISequenceLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [dots, setDots] = useState("")

  const professionalSteps: LoadingStep[] = [
    { message: "Analyzing your professional profile", subMessage: "Skills & experience" },
    { message: "Searching global job markets", subMessage: "Opportunities worldwide" },
    { message: "Finding positions in your industry", subMessage: "Based on your expertise" },
    { message: "Evaluating cost of living", subMessage: "Salary vs expenses" },
    { message: "Matching skills with requirements", subMessage: "Best fit opportunities" },
    { message: "Filtering by your budget", subMessage: "Realistic options" },
    { message: "Finalizing recommendations", subMessage: "Almost ready" },
  ]

  const studentSteps: LoadingStep[] = [
    { message: "Analyzing your academic profile", subMessage: "Grades & qualifications" },
    { message: "Searching universities worldwide", subMessage: "Top institutions" },
    { message: "Evaluating program compatibility", subMessage: "Course matching" },
    { message: "Calculating living expenses", subMessage: "Cost of living data" },
    { message: "Finding scholarship opportunities", subMessage: "Funding options" },
    { message: "Filtering by budget constraints", subMessage: "Affordable options" },
    { message: "Preparing recommendations", subMessage: "Best matches for you" },
  ]

  const steps = type === "professional" ? professionalSteps : studentSteps

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [steps.length])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Animated Orb */}
      <div className="relative w-20 h-20 mb-8">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-teal-500/30"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-teal-400/50"
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.3, 0.7] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.div
          className="absolute inset-4 rounded-full bg-teal-600 shadow-lg shadow-teal-500/50"
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 10px 25px -5px rgba(20, 184, 166, 0.5)",
              "0 20px 40px -5px rgba(20, 184, 166, 0.7)",
              "0 10px 25px -5px rgba(20, 184, 166, 0.5)",
            ],
          }}
          transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-400" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-400/60" />
        </motion.div>
      </div>

      {/* Message Container */}
      <div className="h-16 relative overflow-hidden max-w-md w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <p className="text-base md:text-lg font-medium text-slate-800">
              {steps[currentStep].message}
              <span className="inline-block w-6 text-left">{dots}</span>
            </p>
            {steps[currentStep].subMessage && (
              <p className="text-sm text-slate-500 mt-1">{steps[currentStep].subMessage}</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center gap-1.5 mt-6">
        {steps.map((_, index) => (
          <motion.div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentStep
                ? "w-6 bg-teal-600"
                : index < currentStep
                  ? "w-1.5 bg-teal-400/60"
                  : "w-1.5 bg-slate-300"
            }`}
          />
        ))}
      </div>

      {/* Shimmer Cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6 mt-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-slate-200 rounded-lg overflow-hidden shadow-sm"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: "1.5s",
            }}
          >
            <div className="h-40 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-6 bg-slate-300 rounded animate-pulse" style={{ width: "70%" }} />
              <div className="h-4 bg-slate-300 rounded animate-pulse" style={{ width: "90%" }} />
              <div className="h-4 bg-slate-300 rounded animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Info Text */}
      <p className="text-slate-400 text-xs md:text-sm mt-6 max-w-lg text-center">
        AI is analyzing real-time data to provide personalized recommendations
      </p>
    </div>
  )
}
