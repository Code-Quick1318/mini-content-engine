import { useState, FormEvent } from 'react'
import type { GenerateRequest } from '../types'

interface ProductFormProps {
  onSubmit:     (payload: GenerateRequest) => Promise<void>
  isSubmitting: boolean
  error:        string | null
  lastJobId:    string | null
}

export default function ProductForm({
  onSubmit,
  isSubmitting,
  error,
  lastJobId,
}: ProductFormProps) {
  const [productName,    setProductName]    = useState('')
  const [description,    setDescription]    = useState('')
  const [referenceImage, setReferenceImage] = useState('')
  const [localError,     setLocalError]     = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLocalError(null)

    if (!productName.trim())    { setLocalError('Product name is required.');        return }
    if (!description.trim())    { setLocalError('Description is required.');          return }
    if (!referenceImage.trim()) { setLocalError('Reference image URL is required.'); return }

    await onSubmit({
      productName:    productName.trim(),
      description:    description.trim(),
      referenceImage: referenceImage.trim(),
    })
  }

  const displayError = localError ?? error

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900">Product Details</h2>
        <p className="mt-0.5 text-xs text-gray-400">
          All fields are required to generate an image.
        </p>
      </div>

      <form
        key={lastJobId ?? 'empty'}
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5"
      >
        {/* Product Name */}
        <div>
          <label htmlFor="productName" className="label">Product Name</label>
          <input
            id="productName"
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. Wireless Headphones"
            className="input"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            placeholder="e.g. Over-ear noise-cancelling headphones in matte black"
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* Reference Image URL */}
        <div>
          <label htmlFor="referenceImage" className="label">Reference Image URL</label>
          <input
            id="referenceImage"
            type="url"
            value={referenceImage}
            onChange={(e) => setReferenceImage(e.target.value)}
            disabled={isSubmitting}
            placeholder="https://example.com/product.jpg"
            className="input"
          />
        </div>

        {/* Error message */}
        {displayError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <p role="alert" className="text-sm text-red-700">{displayError}</p>
          </div>
        )}

        {/* Success confirmation */}
        {lastJobId && !displayError && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <div>
              <p role="status" className="text-sm font-medium text-emerald-700">
                Job created successfully
              </p>
              <p className="mt-0.5 font-mono text-xs text-emerald-600 break-all">
                {lastJobId}
              </p>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? (
            <>
              {/* Spinner */}
              <svg className="h-4 w-4 animate-spin text-white/80" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Generating…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generate Image
            </>
          )}
        </button>
      </form>
    </div>
  )
}
