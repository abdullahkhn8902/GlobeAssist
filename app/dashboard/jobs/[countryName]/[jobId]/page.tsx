import { JobDetailClient } from "./job-detail-client"

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ countryName: string; jobId: string }>
}) {
  const { countryName, jobId } = await params
  return <JobDetailClient countryName={decodeURIComponent(countryName)} jobId={jobId} />
}
