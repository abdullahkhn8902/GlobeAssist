import { AccommodationClient } from "./accommodation-client"
import { Suspense } from "react"

export const metadata = {
  title: "Find Accommodations - GlobeAssist",
  description: "Find nearby housing and accommodations for your job location",
}

export default async function AccommodationPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; city?: string }>
}) {
  const params = await searchParams
  const country = params.country || ""
  const city = params.city || ""

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccommodationClient country={country} city={city} />
    </Suspense>
  )
}
