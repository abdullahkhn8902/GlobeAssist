import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check } from "lucide-react"

const benefits = [
  "AI-powered personalized recommendations",
  "Real-time job and scholarship listings",
  "Direct application links to official portals",
  "Budget planning and cost comparison tools",
  "Visa requirements and processing guides",
  "Secure accommodation booking integration",
]

export function DashboardPreview() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#3d4f5f]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance leading-tight">
              Track Your Progress
              <br />
              <span className="text-[#a8c5bb] italic">Effortlessly</span>
            </h2>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Keep track of your applications, deadlines, and documents all in one place with our intuitive dashboard
              designed for students and professionals.
            </p>

            <ul className="space-y-4 mb-10">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3 text-white">
                  <div className="w-6 h-6 rounded-full bg-[#a8c5bb] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-[#3d4f5f]" />
                  </div>
                  <span className="text-white/90">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              asChild
              className="bg-[#a8c5bb] hover:bg-[#98b5ab] text-[#3d4f5f] px-8 py-6 text-lg rounded-xl font-semibold"
            >
              <Link href="/auth/sign-up">Start Your Journey</Link>
            </Button>
          </div>

          {/* Right - Dashboard Preview */}
          <div className="relative">
            <div className="bg-[#2d3f4f] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <img
                src="/modern-dashboard-interface-showing-applications-tr.jpg"
                alt="GlobeAssist Dashboard Preview"
                className="w-full rounded-lg"
              />
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-[#a8c5bb] rounded-xl px-4 py-2 shadow-lg">
              <span className="text-[#3d4f5f] font-semibold text-sm">500+ Universities</span>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl px-4 py-2 shadow-lg">
              <span className="text-[#3d4f5f] font-semibold text-sm">Real-time Updates</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
