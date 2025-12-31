"use client"

import React from "react"
import { AgentLoader } from "./agent-loader"

export function AccommodationsAgentLoader() {
  const steps = [
    { message: "Gathering dormitory listings" },
    { message: "Checking availability across halls" },
    { message: "Fetching up-to-date pricing" },
    { message: "Compiling application links and steps" },
  ]

  return <AgentLoader steps={steps} title="Loading accommodations" variant="light" />
}

export default AccommodationsAgentLoader
