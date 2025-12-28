"use client"

import { AgentLoader } from "./agent-loader"

export function ScholarshipsShimmer() {
  const steps = [
    { message: "Searching scholarship databases", subMessage: "Global funding opportunities" },
    { message: "Matching your profile", subMessage: "Qualification & field of study" },
    { message: "Checking eligibility criteria", subMessage: "Nationality & academic requirements" },
    { message: "Finding fully funded options", subMessage: "Tuition + living expenses" },
    { message: "Analyzing application deadlines", subMessage: "Upcoming opportunities" },
    { message: "Calculating award values", subMessage: "Financial coverage details" },
    { message: "Ranking best matches", subMessage: "Personalized recommendations" },
  ]

  return <AgentLoader steps={steps} title="Finding Scholarship Opportunities" />
}
