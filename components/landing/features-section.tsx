"use client"

import { GraduationCap, Briefcase, Award, Home, Globe, FileCheck, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: GraduationCap,
    title: "Universities",
    description:
      "AI discovers top universities across 50+ countries, matching your academic profile and career aspirations.",
    stats: "500+ Universities",
  },
  {
    icon: Briefcase,
    title: "Jobs",
    description: "Real-time job listings from LinkedIn and Indeed, tailored to your skills and experience level.",
    stats: "25K+ Jobs",
  },
  {
    icon: Award,
    title: "Scholarships",
    description: "Access Fulbright, Chevening, DAAD, and thousands more with direct application links and deadlines.",
    stats: "10K+ Scholarships",
  },
  {
    icon: FileCheck,
    title: "Visa Guide",
    description: "Complete visa requirements, processing times, and step-by-step application guides for any country.",
    stats: "50+ Countries",
  },
  {
    icon: Home,
    title: "Accommodation",
    description: "Find housing through Booking.com and Airbnb integrations, with budget-friendly recommendations.",
    stats: "Instant Booking",
  },
  {
    icon: Globe,
    title: "Country Matching",
    description: "AI analyzes your profile and budget to suggest the best countries for your global journey.",
    stats: "Smart AI Matching",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#1d293d]/5 text-[#1d293d] text-sm font-medium mb-4">
            Powerful Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1d293d] mb-4">
            Everything You Need to Go Global
          </h2>
          <p className="text-[#1d293d]/60 max-w-2xl mx-auto text-lg">
            Our AI agents work 24/7 to find the best opportunities for students and professionals seeking international
            success.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            const isLight = index % 2 === 0

            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl p-8 cursor-pointer ${
                  isLight ? "bg-[#e2e8f0]" : "bg-[#1d293d]"
                }`}
              >
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        isLight ? "bg-[#1d293d]/10" : "bg-white/10"
                      }`}
                    >
                      <feature.icon
                        className={`w-7 h-7 ${isLight ? "text-[#1d293d]" : "text-white"}`}
                      />
                    </motion.div>

                    <ArrowUpRight
                      className={`w-5 h-5 opacity-0 transition-all group-hover:opacity-100 ${
                        isLight ? "text-[#1d293d]" : "text-white"
                      }`}
                    />
                  </div>

                  <h3 className={`text-xl font-bold mb-2 ${isLight ? "text-[#1d293d]" : "text-white"}`}>
                    {feature.title}
                  </h3>

                  <p
                    className={`text-sm leading-relaxed mb-4 ${
                      isLight ? "text-[#1d293d]/70" : "text-white/70"
                    }`}
                  >
                    {feature.description}
                  </p>

                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      isLight
                        ? "bg-[#1d293d]/10 text-[#1d293d]"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {feature.stats}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
