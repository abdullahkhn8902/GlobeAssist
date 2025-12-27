"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  Search,
  GraduationCap,
  Briefcase,
  FileCheck,
  Home,
  MapPin,
  Bot,
  CheckCircle2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

// AI Agent Showcase Animation
const agentTasks = [
  {
    id: 1,
    title: "Finding Best Universities",
    subtitle: "Matching your profile & budget",
    icon: GraduationCap,
    color: "#1e2a3e",
    results: ["MIT - USA", "Oxford - UK", "ETH Zurich - Switzerland"],
    monuments: ["🗽", "🎡", "🏔️"],
  },
  {
    id: 2,
    title: "Discovering Job Opportunities",
    subtitle: "Based on your skills & experience",
    icon: Briefcase,
    color: "#1e2a3e",
    results: ["Software Engineer - Google", "Data Analyst - Amazon", "Product Manager - Meta"],
    monuments: ["🌉", "🗼", "🏰"],
  },
  {
    id: 3,
    title: "Analyzing Visa Requirements",
    subtitle: "For your destination country",
    icon: FileCheck,
    color: "#1e2a3e",
    results: ["Student Visa - F1", "Work Permit - H1B", "PR Pathway Available"],
    monuments: ["🗽", "🎌", "🏛️"],
  },
  {
    id: 4,
    title: "Searching Accommodations",
    subtitle: "Within your budget range",
    icon: Home,
    color: "#1e2a3e",
    results: ["Studio Apt - $800/mo", "Shared Housing - $500/mo", "Student Dorm - $600/mo"],
    monuments: ["🏠", "🏢", "🏘️"],
  },
  {
    id: 5,
    title: "Finding Scholarships",
    subtitle: "You're eligible for",
    icon: Search,
    color: "#1e2a3e",
    results: ["Full Tuition - Merit Based", "50% Scholarship - Need Based", "Research Grant - $20K"],
    monuments: ["🎓", "📚", "🏆"],
  },
]

function AIAgentShowcase() {
  const [currentTask, setCurrentTask] = useState(0)
  const [phase, setPhase] = useState<"searching" | "results">("searching")

  useEffect(() => {
    const searchTimer = setTimeout(() => {
      setPhase("results")
    }, 2500)

    const nextTimer = setTimeout(() => {
      setPhase("searching")
      setCurrentTask((prev) => (prev + 1) % agentTasks.length)
    }, 5000)

    return () => {
      clearTimeout(searchTimer)
      clearTimeout(nextTimer)
    }
  }, [currentTask])

  const task = agentTasks[currentTask]
  const TaskIcon = task.icon

  return (
    <div className="relative w-full max-w-[500px] h-[420px] sm:h-[450px]">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-radial from-[#1e2a3e]/10 via-transparent to-transparent rounded-3xl" />

      {/* Main Card */}
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl border border-[#1e2a3e]/10 overflow-hidden h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="bg-[#1e2a3e] px-5 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">GlobeAssist AI Agent</h3>
            <p className="text-white/60 text-xs">Your one-stop career platform</p>
          </div>
          <div className="ml-auto flex gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/60 text-xs">Active</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 h-[calc(100%-72px)] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTask}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1"
            >
              {/* Task Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1e2a3e]/10 flex items-center justify-center">
                  <TaskIcon className="w-6 h-6 text-[#1e2a3e]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[#1e2a3e] text-base">{task.title}</h4>
                  <p className="text-[#1e2a3e]/60 text-sm">{task.subtitle}</p>
                </div>
              </div>

              {/* Monuments Row */}
              <div className="flex gap-2 mb-4">
                {task.monuments.map((monument, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                    className="text-2xl"
                  >
                    {monument}
                  </motion.span>
                ))}
              </div>

              {/* Search/Results Area */}
              <div className="bg-[#1e2a3e]/5 rounded-2xl p-4 min-h-[180px]">
                {phase === "searching" ? (
                  <div className="flex flex-col items-center justify-center h-full py-6">
                    {/* Animated Search */}
                    <div className="relative mb-4">
                      <motion.div
                        className="w-16 h-16 rounded-full border-4 border-[#1e2a3e]/20 border-t-[#1e2a3e]"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                      <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#1e2a3e]" />
                    </div>
                    <motion.p
                      className="text-[#1e2a3e]/70 text-sm font-medium"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                    >
                      AI Agent searching...
                    </motion.p>
                    {/* Scanning Lines */}
                    <div className="mt-4 w-full space-y-2">
                      {[0, 1, 2].map((i) => (
                        <motion.div key={i} className="h-2 bg-[#1e2a3e]/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#1e2a3e]/30 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, delay: i * 0.3 }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 text-sm font-medium">Found {task.results.length} matches!</span>
                    </div>
                    {task.results.map((result, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-[#1e2a3e]/5"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#1e2a3e]/10 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-[#1e2a3e]" />
                        </div>
                        <span className="text-[#1e2a3e] text-sm font-medium">{result}</span>
                        <motion.div
                          className="ml-auto"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.15 + 0.2, type: "spring" }}
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Task Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {agentTasks.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setPhase("searching")
                  setCurrentTask(i)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentTask ? "bg-[#1e2a3e] w-6" : "bg-[#1e2a3e]/20"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        className="absolute -top-4 -right-4 bg-white rounded-xl px-3 py-2 shadow-lg border border-[#1e2a3e]/10"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      >
        <span className="text-xs font-semibold text-[#1e2a3e]">🌍 50+ Countries</span>
      </motion.div>

      <motion.div
        className="absolute -bottom-4 -left-4 bg-white rounded-xl px-3 py-2 shadow-lg border border-[#1e2a3e]/10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, delay: 1.5 }}
      >
        <span className="text-xs font-semibold text-[#1e2a3e]">🎓 500+ Universities</span>
      </motion.div>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="pt-24 pb-12 lg:pt-32 lg:pb-20 px-4 sm:px-6 lg:px-8 bg-[#e2e8f0] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 mb-8 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#1d293d]" />
              <span className="text-sm font-medium text-[#1d293d]">AI-Powered Global Opportunities</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1d293d] mb-6 text-balance leading-tight"
            >
              One platform for global opportunities
              <br />
              
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-[#1d293d]/70 max-w-xl mx-auto lg:mx-0 mb-10 text-pretty leading-relaxed"
            >
              Our AI agents discover universities, jobs, scholarships, visas, and accommodations worldwide. Let
              intelligent automation guide your journey to international opportunities.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Button
                size="lg"
                asChild
                className="bg-[#1d293d] hover:bg-[#1d293d]/90 text-white px-8 py-6 text-lg rounded-full font-semibold group"
              >
                <Link href="/auth/sign-up">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-[#1d293d] text-[#1d293d] hover:bg-[#1d293d] hover:text-white bg-transparent px-8 py-6 text-lg rounded-full font-semibold"
              >
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-[#1d293d]/10"
            >
              {[
                { value: "500+", label: "Universities" },
                { value: "50+", label: "Countries" },
                { value: "10K+", label: "Scholarships" },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-[#1d293d]">{stat.value}</div>
                  <div className="text-sm text-[#1d293d]/60">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right - AI Agent Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center items-center"
          >
            <AIAgentShowcase />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
