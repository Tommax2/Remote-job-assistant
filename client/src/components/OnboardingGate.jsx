import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../services/api'

export function OnboardingRouter() {
  const [status, setStatus] = useState(null); const [error, setError] = useState('')
  useEffect(() => { api('/onboarding/status').then(setStatus).catch((err) => setError(err.message)) }, [])
  if (error) return <main className="center"><div className="empty-state"><h2>Onboarding check failed</h2><p>{error}</p></div></main>
  return status ? <Navigate to={status.nextPath} replace /> : <main className="center"><div className="loader" /></main>
}

export function DashboardGate({ children }) {
  const [status, setStatus] = useState(null); const [error, setError] = useState('')
  useEffect(() => { api('/onboarding/status').then(setStatus).catch((err) => setError(err.message)) }, [])
  if (error) return <main className="center"><div className="empty-state"><h2>Setup check failed</h2><p>{error}</p></div></main>
  if (!status) return <main className="center"><div className="loader" /></main>
  return status.completed ? children : <Navigate to={status.nextPath} replace />
}
