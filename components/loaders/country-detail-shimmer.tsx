"use client"

import { AgentLoader } from "./agent-loader"

interface CountryDetailShimmerProps {
  countryName?: string
}

export function CountryDetailShimmer({ countryName = "this country" }: CountryDetailShimmerProps) {
  const steps = [
    { message: `Fetching details for ${countryName}`, subMessage: "Connecting to university databases" },
    { message: "Searching top universities", subMessage: "Finding accredited institutions" },
    { message: "Analyzing tuition fees", subMessage: "Comparing costs across programs" },
    { message: "Finding scholarship opportunities", subMessage: "Matching with your profile" },
    { message: "Checking visa requirements", subMessage: "Processing time & documents needed" },
    { message: "Calculating living expenses", subMessage: "Accommodation & daily costs" },
    { message: "Preparing your results", subMessage: "Almost ready" },
  ]

  return <AgentLoader steps={steps} title="Exploring Study Destination" />
}
