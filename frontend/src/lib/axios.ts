import axios from 'axios'

// In development: Vite proxies /api → http://localhost:3000
// In production:  VITE_API_URL points to the Render backend URL
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30s — image generation can take time
})

export default apiClient
