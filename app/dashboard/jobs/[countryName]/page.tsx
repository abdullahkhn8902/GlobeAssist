import { JobsPageClient } from "./jobs-page-client"

export default async function CountryJobsPage({ params }: { params: Promise<{ countryName: string }> }) {
  const { countryName } = await params
  const decodedCountryName = decodeURIComponent(countryName)

  return <JobsPageClient countryName={decodedCountryName} />
}
