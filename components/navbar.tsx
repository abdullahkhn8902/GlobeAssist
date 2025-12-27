"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#d5e0dc]/95 backdrop-blur-md border-b border-[#c5d3ce]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#3d4f5f] flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-[#3d4f5f] hover:text-[#2d3f4f] transition-colors font-medium">
              Home
            </Link>
            <Link href="/about" className="text-[#3d4f5f] hover:text-[#2d3f4f] transition-colors font-medium">
              About
            </Link>
            <Link href="/privacy" className="text-[#3d4f5f] hover:text-[#2d3f4f] transition-colors font-medium">
              Privacy
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              asChild
              className="border-[#3d4f5f] text-[#3d4f5f] hover:bg-[#3d4f5f] hover:text-white bg-transparent rounded-md"
            >
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
            <Button asChild className="bg-[#3d4f5f] text-white hover:bg-[#2d3f4f] rounded-md">
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
