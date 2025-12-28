"use client"

import { AgentLoader } from "./agent-loader"

interface ScholarshipDetailLoaderProps {
  scholarshipName?: string
}

export function ScholarshipDetailLoader({ scholarshipName = "scholarship" }: ScholarshipDetailLoaderProps) {
  const steps = [
    { message: `Loading ${scholarshipName}`, subMessage: "Fetching scholarship details" },
    { message: "Checking eligibility criteria", subMessage: "Who can apply" },
    { message: "Finding award coverage", subMessage: "What's included in funding" },
    { message: "Analyzing application process", subMessage: "Steps to apply" },
    { message: "Checking deadlines", subMessage: "Important dates" },
    { message: "Finding success tips", subMessage: "How to strengthen your application" },
    { message: "Preparing complete details", subMessage: "Ready to view" },
  ]

  return <AgentLoader steps={steps} title="Scholarship Details" />
}
