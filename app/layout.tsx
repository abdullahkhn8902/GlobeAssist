import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GlobeAssist - AI-Powered Global Opportunities Platform",
  description:
    "Find and apply to universities, jobs, scholarships, housing, and visas across 21 countries with AI-driven recommendations.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/Favicon.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/Favicon.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/Favicon.png",
        type: "image/svg+xml",
      },
    ],
    apple: "/Favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
