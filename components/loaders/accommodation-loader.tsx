"use client"

import { AgentLoader } from "./agent-loader"

interface AccommodationLoaderProps {
  city?: string
}

export function AccommodationLoader({ city = "your destination" }: AccommodationLoaderProps) {
  const steps = [
    { message: `Searching accommodations in ${city}`, subMessage: "Connecting to property databases" },
    { message: "Finding hotels nearby", subMessage: "From Booking.com" },
    { message: "Discovering unique stays", subMessage: "From Airbnb" },
    { message: "Comparing prices", subMessage: "Best value options" },
    { message: "Checking availability", subMessage: "Real-time room status" },
    { message: "Analyzing reviews", subMessage: "Guest ratings & feedback" },
    { message: "Preparing recommendations", subMessage: "Top picks for you" },
  ]

  return <AgentLoader steps={steps} title="Finding Nearby Housing" />
}
