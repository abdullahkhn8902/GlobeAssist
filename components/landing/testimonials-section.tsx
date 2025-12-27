"use client"

import { motion } from "framer-motion"
import { Quote } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Ahmed",
    role: "MS Computer Science",
    location: "Now at University of Toronto",
    quote:
      "GlobeAssist found me 8 scholarship opportunities I never knew existed. The AI matched my profile perfectly with Canadian universities.",
  },
  {
    name: "Muhammad Ali",
    role: "Software Engineer",
    location: "Now working in Germany",
    quote:
      "The job matching was incredibly accurate. Within weeks, I had multiple interviews lined up and comprehensive visa guidance.",
  },
  {
    name: "Fatima Khan",
    role: "MBA Graduate",
    location: "Now at LSE London",
    quote:
      "From university selection to visa approval, GlobeAssist was with me every step. The AI recommendations were spot-on.",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#1d293d]/5 text-[#1d293d] text-sm font-medium mb-4">
            Success Stories
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1d293d] mb-4 text-balance">
            Loved by Global Achievers
          </h2>
          <p className="text-[#1d293d]/60 max-w-2xl mx-auto text-lg">
            Join thousands of students and professionals who found their global path with GlobeAssist.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-[#e2e8f0] rounded-2xl p-8 relative"
            >
              <Quote className="w-10 h-10 text-[#1d293d]/10 absolute top-6 right-6" />
              <p className="text-[#1d293d]/80 mb-6 leading-relaxed relative z-10">"{testimonial.quote}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#1d293d] flex items-center justify-center text-white font-bold">
                  {testimonial.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="font-semibold text-[#1d293d]">{testimonial.name}</div>
                  <div className="text-sm text-[#1d293d]/60">{testimonial.role}</div>
                  <div className="text-xs text-[#1d293d]/40">{testimonial.location}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
