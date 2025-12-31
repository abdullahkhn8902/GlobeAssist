"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import GLobeImage from "@/public/Favicon.png"

interface LoadingStep {
  message: string
  subMessage?: string
}

interface AgentLoaderProps {
  steps: LoadingStep[]
  title?: string
  variant?: "default" | "dark" | "light"
  bg?: string
}

export function AgentLoader({ steps, title, variant = "default", bg }: AgentLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [dots, setDots] = useState("")

  // Cycle through steps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [steps.length])

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 400)
    return () => clearInterval(interval)
  }, [])

  const bgClass = bg ? bg : variant === "dark" ? "bg-slate-900" : variant === "light" ? "bg-white" : "bg-slate-100"

  const textClass = variant === "dark" ? "text-white" : "text-slate-800"

  const subTextClass = variant === "dark" ? "text-slate-400" : "text-slate-500"

  const pulseColorClass = variant === "dark" ? "bg-teal-500" : "bg-teal-600"

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        {/* Animated Orb */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-teal-500/30 z-30"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          {/* Middle ring */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-teal-400/50 z-30"
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.3, 0.7] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.2 }}
          />
          {/* Subtle glow behind the favicon (no solid fill) */}
          <motion.div
            className="absolute inset-4 rounded-full bg-transparent z-10"
            animate={{
              boxShadow: [
                "0 8px 20px -8px rgba(20,184,166,0.35)",
                "0 18px 36px -8px rgba(20,184,166,0.55)",
                "0 8px 20px -8px rgba(20,184,166,0.35)",
              ],
            }}
            transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />

          {/* Favicon centered inside the rings */}
          <Image
            src={GLobeImage}
            alt="favicon"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full object-cover z-20"
            width={48}
            height={48}
            priority
          />
          {/* Spinning dots */}
          <motion.div
            className="absolute inset-0 z-25"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-400" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-400/60" />
          </motion.div>
        </div>

        {/* Title */}
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center text-lg font-semibold ${textClass} mb-6`}
          >
            {title}
          </motion.h2>
        )}

        {/* Message Container */}
        <div className="h-20 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <p className={`text-base md:text-lg font-medium ${textClass}`}>
                {steps[currentStep].message}
                <span className="inline-block w-6 text-left">{dots}</span>
              </p>
              {steps[currentStep].subMessage && (
                <p className={`text-sm ${subTextClass} mt-1`}>{steps[currentStep].subMessage}</p>
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
                  ? `w-6 ${pulseColorClass}`
                  : index < currentStep
                    ? "w-1.5 bg-teal-400/60"
                    : "w-1.5 bg-slate-300"
              }`}
              animate={index === currentStep ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY }}
            />
          ))}
        </div>

        {/* Time estimate */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`text-center text-xs ${subTextClass} mt-6`}
        >
          This may take a moment — AI is analyzing real-time data
        </motion.p>
      </div>
    </div>
  )
}
