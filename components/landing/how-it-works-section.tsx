"use client"

import { motion } from "framer-motion"
import { UserPlus, Settings, Sparkles, Rocket } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description: "Tell us about your academic background, career goals, budget, and preferred destinations.",
  },
  {
    icon: Settings,
    title: "AI Analyzes Your Data",
    description: "Our agents process your information and search global databases for matching opportunities.",
  },
  {
    icon: Sparkles,
    title: "Get Personalized Results",
    description: "Receive tailored recommendations for universities, jobs, scholarships, and accommodations.",
  },
  {
    icon: Rocket,
    title: "Launch Your Journey",
    description: "Apply directly through our platform with real-time guidance and visa support.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#1d293d]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance">How It Works</h2>
          <p className="text-white/60 max-w-2xl mx-auto text-lg text-pretty">
            Four simple steps to unlock global opportunities tailored just for you.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection Line */}

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {/* Step Number */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="relative z-10 w-16 h-16 rounded-2xl bg-[#e2e8f0] flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <step.icon className="w-8 h-8 text-[#1d293d]" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-[#1d293d] text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                </motion.div>

                <h3 className="text-xl font-bold text-white mb-3 text-center">{step.title}</h3>
                <p className="text-white/60 text-center text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
