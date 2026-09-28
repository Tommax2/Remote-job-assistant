import { auth } from '../config/firebase'
import { withinDeadline } from './requestDeadline'

function normalizeApiUrl(value) {
  const configuredUrl = value?.trim().replace(/\/$/, '')
  if (!configuredUrl) return 'http://localhost:5000/api'

  const absoluteUrl = /^https?:\/\//i.test(configuredUrl) ? configuredUrl : `https://${configuredUrl}`
  return absoluteUrl.endsWith('/api') ? absoluteUrl : `${absoluteUrl}/api`
}

const API_URL = normalizeApiUrl(import.meta.env.VITE_API_URL)

export async function api(path, options = {}) {
  const signal = options.signal || (path.startsWith('/email/') ? AbortSignal.timeout(40000) : undefined)
  return withinDeadline(async () => {
  const token = await auth.currentUser?.getIdToken()
  signal?.throwIfAborted()
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    signal,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  signal?.throwIfAborted()
  if (!response.ok) throw new Error(data.message || 'Something went wrong')
  return data
  }, signal)
}

export async function downloadApi(path, filename) {
  const token = await auth.currentUser?.getIdToken()
  const response = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.message || 'Download failed') }
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url)
}
