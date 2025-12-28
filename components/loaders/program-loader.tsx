"use client"

import { AgentLoader } from "./agent-loader"

interface ProgramLoaderProps {
  programName?: string
}

export function ProgramLoader({ programName = "this program" }: ProgramLoaderProps) {
  const steps = [
    { message: `Loading ${programName}`, subMessage: "Fetching program details" },
    { message: "Checking course curriculum", subMessage: "Modules & specializations" },
    { message: "Finding entry requirements", subMessage: "Academic & language scores" },
    { message: "Calculating total fees", subMessage: "Tuition & additional costs" },
    { message: "Checking application deadlines", subMessage: "Intake dates & windows" },
    { message: "Finding career outcomes", subMessage: "Graduate employment data" },
    { message: "Preparing complete overview", subMessage: "All details ready" },
  ]

  return <AgentLoader steps={steps} title="Loading Program Details" />
}
