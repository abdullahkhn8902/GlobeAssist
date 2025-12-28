"use client"

import { AgentLoader } from "./agent-loader"

interface JobsShimmerProps {
  countryName?: string
}

export function JobsShimmer({ countryName = "this market" }: JobsShimmerProps) {
  const steps = [
    { message: `Scanning job market in ${countryName}`, subMessage: "Connecting to job databases" },
    { message: "Finding matching positions", subMessage: "Based on your skills & experience" },
    { message: "Checking salary ranges", subMessage: "Comparing compensation packages" },
    { message: "Analyzing visa sponsorship", subMessage: "Companies offering work permits" },
    { message: "Evaluating cost of living", subMessage: "Housing & daily expenses" },
    { message: "Verifying job requirements", subMessage: "Qualifications & experience needed" },
    { message: "Preparing opportunities", subMessage: "Best matches for you" },
  ]

  return <AgentLoader steps={steps} title="Discovering Career Opportunities" />
}
