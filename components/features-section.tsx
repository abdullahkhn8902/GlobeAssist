import { GraduationCap, Briefcase, Award, Home, ArrowUpRight } from "lucide-react"

const features = [
  {
    icon: GraduationCap,
    title: "Universities",
    description:
      "Discover top universities across 50+ countries with AI-powered recommendations tailored to your academic profile and career goals.",
    color: "bg-[#a8c5bb]",
  },
  {
    icon: Briefcase,
    title: "Jobs",
    description:
      "Find career opportunities that match your skills and aspirations in global markets with real-time job listings.",
    color: "bg-[#3d4f5f]",
    dark: true,
  },
  {
    icon: Award,
    title: "Scholarships",
    description:
      "Access thousands of scholarships and funding opportunities with direct application links to support your education.",
    color: "bg-[#a8c5bb]",
  },
  {
    icon: Home,
    title: "Accommodation",
    description:
      "Secure safe and affordable housing options near your chosen institution or workplace through Booking.com and Airbnb.",
    color: "bg-[#3d4f5f]",
    dark: true,
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#d5e0dc]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3d4f5f] mb-4 text-balance">
            Everything You Need
          </h2>
          <p className="text-[#5d6f6f] max-w-2xl mx-auto text-lg text-pretty">
            Whether you are studying, exploring, or starting your career, GlobeAssist makes your global journey smooth
            and stress-free.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`${feature.color} rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className={`w-14 h-14 rounded-xl ${feature.dark ? "bg-white/10" : "bg-[#3d4f5f]/10"} flex items-center justify-center`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.dark ? "text-white" : "text-[#3d4f5f]"}`} />
                </div>
                <ArrowUpRight
                  className={`w-6 h-6 ${feature.dark ? "text-white/50" : "text-[#3d4f5f]/50"} group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform`}
                />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${feature.dark ? "text-white" : "text-[#3d4f5f]"}`}>
                {feature.title}
              </h3>
              <p className={`leading-relaxed ${feature.dark ? "text-white/80" : "text-[#3d4f5f]/80"}`}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
