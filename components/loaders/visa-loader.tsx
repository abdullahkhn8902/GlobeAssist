"use client"

import { AgentLoader } from "./agent-loader"

interface VisaLoaderProps {
  countryName?: string
  type?: "student" | "work"
}

export function VisaLoader({ countryName = "destination", type = "student" }: VisaLoaderProps) {
  const visaType = type === "work" ? "work visa" : "student visa"

  const steps = [
    { message: `Fetching ${countryName} ${visaType} info`, subMessage: "Connecting to embassy resources" },
    { message: "Checking visa requirements", subMessage: "Documents & eligibility criteria" },
    { message: "Calculating processing time", subMessage: "Average wait periods" },
    { message: "Finding visa fees", subMessage: "Application & processing costs" },
    { message: "Locating application centers", subMessage: "Nearest embassy/consulate" },
    { message: "Gathering financial requirements", subMessage: "Bank statements & proof of funds" },
    { message: "Compiling important tips", subMessage: "Expert advice for approval" },
  ]

  return <AgentLoader steps={steps} title={`${type === "work" ? "Work" : "Student"} Visa Information`} />
}
