import axios from 'axios'

// Build-time env var injected by Vite.
// In development: falls back to /api (proxied by Vite to localhost:3000)
// In production:  set VITE_API_URL=https://mini-content-engine-g13r.onrender.com in Vercel
const backendUrl = import.meta.env['VITE_API_URL'] as string | undefined
const baseURL = backendUrl ? `${backendUrl}/api` : '/api'

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export default apiClient
