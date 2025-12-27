"use client"

import { motion } from "framer-motion"
import { Search, Filter, Database, Zap, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"

const agentSteps = [
  { icon: Search, text: "Scanning global databases...", color: "#1d293d" },
  { icon: Filter, text: "Filtering by your preferences...", color: "#1d293d" },
  { icon: Database, text: "Analyzing 500+ universities...", color: "#1d293d" },
  { icon: Zap, text: "Matching with your profile...", color: "#1d293d" },
  { icon: CheckCircle2, text: "Found 12 perfect matches!", color: "#22c55e" },
]

function AgentAnimation() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev === agentSteps.length - 1) {
          setTimeout(() => {
            setCurrentStep(0)
          }, 2000)
          return prev
        }
        return prev + 1
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      {/* Terminal Window */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-[#1d293d] rounded-2xl p-6 shadow-2xl"
      >
        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-4 text-white/50 text-sm">GlobeAssist AI Agent</span>
        </div>

        {/* Processing Steps */}
        <div className="space-y-4">
          {agentSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: index <= currentStep ? 1 : 0.3,
                x: index <= currentStep ? 0 : -20,
              }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{
                  scale: index === currentStep ? [1, 1.2, 1] : 1,
                }}
                transition={{ repeat: index === currentStep ? Number.POSITIVE_INFINITY : 0, duration: 1 }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  index < currentStep ? "bg-green-500/20" : index === currentStep ? "bg-white/20" : "bg-white/5"
                }`}
              >
                <step.icon
                  className={`w-4 h-4 ${
                    index < currentStep ? "text-green-400" : index === currentStep ? "text-white" : "text-white/30"
                  }`}
                />
              </motion.div>
              <span
                className={`text-sm font-mono ${
                  index < currentStep ? "text-green-400" : index === currentStep ? "text-white" : "text-white/30"
                }`}
              >
                {step.text}
              </span>
              {index === currentStep && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.5 }}
                  className="text-white"
                >
                  |
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Results Preview */}
        {currentStep === agentSteps.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4"
          >
            {["🇬🇧 UK", "🇨🇦 Canada", "🇦🇺 Australia"].map((country, i) => (
              <motion.div
                key={country}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 rounded-lg p-3 text-center"
              >
                <div className="text-lg mb-1">{country.split(" ")[0]}</div>
                <div className="text-white text-sm font-medium">{country.split(" ")[1]}</div>
                <div className="text-white/50 text-xs mt-1">{4 - i} matches</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Floating Data Points */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3 }}
        className="absolute -top-4 -right-4 bg-white rounded-xl px-4 py-2 shadow-lg"
      >
        <span className="text-sm font-semibold text-[#1d293d]">Real-time Data</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 4 }}
        className="absolute -bottom-4 -left-4 bg-white rounded-xl px-4 py-2 shadow-lg"
      >
        <span className="text-sm font-semibold text-[#1d293d]">AI Powered</span>
      </motion.div>
    </div>
  )
}

export function AgentShowcase() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#e2e8f0]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#1d293d]/10 text-[#1d293d] text-sm font-medium mb-4">
              Intelligent Automation
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1d293d] mb-6 text-balance leading-tight">
              Watch Our AI Agents
              <br />
              <span className="italic">Work for You</span>
            </h2>
            <p className="text-[#1d293d]/70 text-lg mb-8 leading-relaxed">
              Our intelligent agents search through millions of data points in real-time, analyzing universities, job
              markets, scholarship databases, and visa requirements to find opportunities that perfectly match your
              profile.
            </p>

            <div className="space-y-4">
              {[
                "Searches LinkedIn, Indeed, and global job boards",
                "Analyzes Fulbright, Chevening, DAAD scholarships",
                "Compares visa requirements across 50+ countries",
                "Matches universities to your academic profile",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1d293d] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#1d293d]/80">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Agent Animation */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <AgentAnimation />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
