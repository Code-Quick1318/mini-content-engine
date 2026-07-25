import { useState } from 'react'
import ProductForm from '../components/ProductForm'
import JobList from '../components/JobList'
import { useGenerateJob } from '../hooks/useGenerateJob'
import type { GenerateRequest } from '../types'

export default function Home() {
  const [jobIds,    setJobIds]    = useState<string[]>([])
  const [lastJobId, setLastJobId] = useState<string | null>(null)
  const { isSubmitting, error, submit } = useGenerateJob()

  const handleSubmit = async (payload: GenerateRequest): Promise<void> => {
    setLastJobId(null)
    const jobId = await submit(payload)
    if (jobId) {
      setLastJobId(jobId)
      setJobIds((prev) => [jobId, ...prev])
    }
  }

  return (
    /* ── Page shell ─────────────────────────────────────────────────── */
    <div className="min-h-screen bg-gray-50">

      {/* ── Top nav bar ──────────────────────────────────────────────── */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-6">
          {/* Logo mark */}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">
            Mini Content Engine
          </span>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-6 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Generate Product Images
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your product details. We'll craft an AI prompt and generate a professional image.
          </p>
        </div>

        {/* Two-column layout on large screens, stacked on mobile */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">

          {/* Left — form */}
          <div>
            <ProductForm
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={error}
              lastJobId={lastJobId}
            />
          </div>

          {/* Right — job list */}
          <div>
            {jobIds.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5M4.5 3h15A1.5 1.5 0 0121 4.5v13.5" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">No jobs yet</p>
                <p className="mt-1 text-xs text-gray-400">Submit the form to start generating</p>
              </div>
            ) : (
              <JobList jobIds={jobIds} />
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
