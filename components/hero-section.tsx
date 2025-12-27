import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-[#d5e0dc]">
      <div className="max-w-7xl mx-auto">
        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-[#a8c5bb] rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-[#3d4f5f]" />
            <span className="text-sm font-medium text-[#3d4f5f]">AI-Powered Global Opportunities</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#3d4f5f] mb-6 text-balance leading-tight">
            Your Gateway to
            <br />
            <span className="italic">Global Success</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#5d6f6f] max-w-2xl mx-auto mb-10 text-pretty leading-relaxed">
            Discover universities, jobs, scholarships, and accommodations worldwide. Let AI guide your journey to
            international opportunities.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="bg-[#3d4f5f] hover:bg-[#2d3f4f] text-white px-8 py-6 text-lg rounded-xl font-semibold"
            >
              <Link href="/auth/sign-up">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-[#3d4f5f] text-[#3d4f5f] hover:bg-[#3d4f5f] hover:text-white bg-transparent px-8 py-6 text-lg rounded-xl font-semibold"
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-[#3d4f5f] rounded-2xl p-6 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">500+</div>
            <div className="text-sm text-white/70">Universities</div>
          </div>
          <div className="bg-[#3d4f5f] rounded-2xl p-6 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">50+</div>
            <div className="text-sm text-white/70">Countries</div>
          </div>
          <div className="bg-[#3d4f5f] rounded-2xl p-6 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">10K+</div>
            <div className="text-sm text-white/70">Scholarships</div>
          </div>
          <div className="bg-[#3d4f5f] rounded-2xl p-6 text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">25K+</div>
            <div className="text-sm text-white/70">Jobs</div>
          </div>
        </div>
      </div>
    </section>
  )
}
