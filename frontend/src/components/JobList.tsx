import JobCard from './JobCard'
import { useJobPolling } from '../hooks/useJobPolling'

interface JobListProps {
  jobIds: string[]
}

// ── Skeleton card shown while first poll resolves ──────────────────────────
function SkeletonCard() {
  return (
    <li className="card animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="h-3.5 w-2/3 rounded bg-gray-100" />
          <div className="h-2.5 w-1/2 rounded bg-gray-100" />
        </div>
        <div className="h-5 w-20 rounded-full bg-gray-100" />
      </div>
      <div className="mt-3 h-2.5 w-1/3 rounded bg-gray-100" />
    </li>
  )
}

// ── One item = one isolated polling lifecycle ──────────────────────────────
function JobListItem({ jobId }: { jobId: string }) {
  const { job, error } = useJobPolling(jobId)

  if (error) {
    return (
      <li className="card">
        <div className="flex items-start gap-2">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p role="alert" className="text-xs text-red-700">
            Failed to load job <span className="font-mono">{jobId}</span>: {error}
          </p>
        </div>
      </li>
    )
  }

  if (!job) {
    return <SkeletonCard />
  }

  return (
    <li>
      <JobCard job={job} />
    </li>
  )
}

// ── List ───────────────────────────────────────────────────────────────────
export default function JobList({ jobIds }: JobListProps) {
  if (jobIds.length === 0) return null

  return (
    <section aria-label="Generation jobs">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Jobs</h2>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {jobIds.length}
        </span>
      </div>

      <ul className="space-y-4">
        {jobIds.map((id) => (
          <JobListItem key={id} jobId={id} />
        ))}
      </ul>
    </section>
  )
}
