"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Globe, Menu, X } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#e2e8f0]/90 backdrop-blur-xl border-b border-[#1d293d]/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 rounded-full bg-[#1d293d] flex items-center justify-center"
            >
              <Globe className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold text-[#1d293d]">GlobeAssist</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {["Home", "Features", "How It Works", "About"].map((item) => (
              <Link
                key={item}
                href={item === "Home" ? "/" : `#${item.toLowerCase().replace(/\s/g, "-")}`}
                className="text-[#1d293d]/70 hover:text-[#1d293d] transition-colors font-medium relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#1d293d] transition-all group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              asChild
              className="border-[#1d293d] text-[#1d293d] hover:bg-[#1d293d] hover:text-white bg-transparent rounded-full px-6"
            >
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
            <Button asChild className="bg-[#1d293d] text-white hover:bg-[#1d293d]/90 rounded-full px-6">
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-[#1d293d]" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#e2e8f0] border-t border-[#1d293d]/10"
          >
            <div className="px-4 py-4 space-y-4">
              {["Home", "Features", "How It Works", "About"].map((item) => (
                <Link
                  key={item}
                  href={item === "Home" ? "/" : `#${item.toLowerCase().replace(/\s/g, "-")}`}
                  className="block text-[#1d293d]/70 hover:text-[#1d293d] font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" asChild className="flex-1 border-[#1d293d] text-[#1d293d] bg-transparent">
                  <Link href="/auth/sign-up">Sign up</Link>
                </Button>
                <Button asChild className="flex-1 bg-[#1d293d] text-white">
                  <Link href="/auth/login">Login</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
