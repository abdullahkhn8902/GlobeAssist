"use client"

import { AgentLoader } from "./agent-loader"

interface UniversityShimmerProps {
  universityName?: string
}

export function UniversityShimmer({ universityName = "this university" }: UniversityShimmerProps) {
  const steps = [
    { message: `Loading ${universityName}`, subMessage: "Fetching institution details" },
    { message: "Retrieving available programs", subMessage: "Courses & qualifications" },
    { message: "Checking entry requirements", subMessage: "Academic & language scores" },
    { message: "Analyzing fee structure", subMessage: "Tuition & application costs" },
    { message: "Finding intake dates", subMessage: "Upcoming admission windows" },
    { message: "Searching accommodations", subMessage: "Student housing options" },
    { message: "Finalizing information", subMessage: "Preparing complete overview" },
  ]

  return <AgentLoader steps={steps} title="Loading University Details" />
}
