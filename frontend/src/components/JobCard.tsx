import type { Job, JobStatus } from '../types'

interface JobCardProps {
  job: Job
}

// ── Status badge config ────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; classes: string; dot: string }
> = {
  pending: {
    label:   'Pending',
    classes: 'bg-gray-100 text-gray-600',
    dot:     'bg-gray-400',
  },
  processing: {
    label:   'Processing',
    classes: 'bg-amber-50 text-amber-700',
    dot:     'bg-amber-400 animate-pulse',
  },
  completed: {
    label:   'Completed',
    classes: 'bg-emerald-50 text-emerald-700',
    dot:     'bg-emerald-500',
  },
  failed: {
    label:   'Failed',
    classes: 'bg-red-50 text-red-700',
    dot:     'bg-red-500',
  },
}

// ── Inline spinner ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-amber-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}
      aria-live="polite"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function JobCard({ job }: JobCardProps) {
  const isActive = job.status === 'pending' || job.status === 'processing'

  return (
    <article className="card overflow-hidden" data-job-id={job.id}>

      {/* Card header — product name + status badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {job.productName}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-gray-400 truncate">
            {job.id}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Created time */}
      <p className="mt-3 text-xs text-gray-400">
        Created {new Date(job.createdAt).toLocaleString()}
      </p>

      {/* In-progress state — spinner + copy */}
      {isActive && (
        <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-gray-50 px-3 py-2.5">
          <Spinner />
          <p className="text-xs text-gray-500">
            {job.status === 'pending'
              ? 'Waiting to start…'
              : 'Generating your image…'}
          </p>
        </div>
      )}

      {/* Completed state — image preview */}
      {job.status === 'completed' && job.resultImage && (
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-100">
          <img
            src={job.resultImage}
            alt={`Generated product image for ${job.productName}`}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Failed state */}
      {job.status === 'failed' && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <p role="alert" className="text-xs text-red-700">
            Generation failed. Please try submitting again.
          </p>
        </div>
      )}

    </article>
  )
}
