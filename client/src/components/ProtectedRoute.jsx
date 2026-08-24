import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppNavigation from './AppNavigation'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <main className="center"><div className="loader" aria-label="Loading" /></main>
  return user ? <div className="protected-shell"><AppNavigation /><Outlet /></div> : <Navigate to="/login" replace />
}
