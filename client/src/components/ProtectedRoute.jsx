import { Navigate, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AppNavigation from './AppNavigation'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'light')
  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('app-theme', next)
  }
  if (loading) return <main className="center"><div className="loader" aria-label="Loading" /></main>
  return user ? <div className={`protected-shell app-theme-${theme}`}><AppNavigation theme={theme} onToggleTheme={toggleTheme} /><Outlet /></div> : <Navigate to="/login" replace />
}
