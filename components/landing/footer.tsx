"use client"

import Link from "next/link"
import { Globe, Twitter, Youtube, Linkedin, Mail } from "lucide-react"
import { motion } from "framer-motion"

export function Footer() {
  return (
    <footer className="bg-[#1d293d] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
              >
                <Globe className="w-6 h-6 text-[#1d293d]" />
              </motion.div>
              <span className="text-xl font-bold text-white">GlobeAssist</span>
            </Link>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              AI-powered platform connecting students and professionals with global opportunities.
            </p>
            <div className="flex gap-3">
              {[Twitter, Youtube, Linkedin, Mail].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ y: -3 }}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* For Students */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Students</h4>
            <ul className="space-y-3">
              {["Universities", "Scholarships", "Accommodation", "Visa Guide"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-white group-hover:w-3 transition-all" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Professionals */}
          <div>
            <h4 className="font-semibold text-white mb-4">For Professionals</h4>
            <ul className="space-y-3">
              {["Job Search", "Career Markets", "Work Visas", "Relocation"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-white group-hover:w-3 transition-all" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {[
                { name: "About Us", href: "/about" },
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms of Service", href: "/terms" },
                { name: "Contact", href: "#" },
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 h-px bg-white group-hover:w-3 transition-all" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">© 2025 GlobeAssist. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-white/40 hover:text-white text-sm transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-white/40 hover:text-white text-sm transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-white/40 hover:text-white text-sm transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
