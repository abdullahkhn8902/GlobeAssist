"use client"

import { AgentLoader } from "./agent-loader"

interface JobDetailLoaderProps {
  jobTitle?: string
}

export function JobDetailLoader({ jobTitle = "position" }: JobDetailLoaderProps) {
  const steps = [
    { message: `Loading ${jobTitle}`, subMessage: "Fetching job details" },
    { message: "Checking requirements", subMessage: "Skills & qualifications needed" },
    { message: "Finding salary information", subMessage: "Compensation & benefits" },
    { message: "Analyzing company profile", subMessage: "About the employer" },
    { message: "Checking visa sponsorship", subMessage: "Work permit availability" },
    { message: "Finding housing options", subMessage: "Accommodation near workplace" },
    { message: "Preparing job overview", subMessage: "All details ready" },
  ]

  return <AgentLoader steps={steps} title="Job Details" />
}
