import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { user, authenticate, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/onboarding" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await authenticate(mode, form)
      navigate('/onboarding')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setError('')
    try {
      await loginWithGoogle()
      navigate('/onboarding')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <div className="brand-panel-copy">
          <p className="auth-kicker">Your remote career workspace</p>
          <h1>Make your next career move count.</h1>
          <p className="intro">Discover better-fit remote roles, tailor every application, and manage your job search from one focused workspace.</p>
        </div>
      </section>
      <section className="form-panel">
        <div className="form-card">
          <p className="auth-welcome">{isRegister ? 'Create your account' : 'Welcome back'}</p>
          <h2>{isRegister ? 'Sign up' : 'Sign in'}</h2>
          <form onSubmit={handleSubmit}>
            {isRegister && <label>Full name<input required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" placeholder="Ada Lovelace" /></label>}
            <label>Email address<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" placeholder="you@example.com" /></label>
            <label>Password<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></label>
            {error && <p className="error" role="alert">{error}</p>}
            <button disabled={submitting}>{submitting ? 'Please wait…' : isRegister ? 'Sign up' : 'Sign in'}</button>
          </form>
          <button className="google-button" type="button" onClick={handleGoogle}><svg className="google-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.93A6 6 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.55l3.35-2.62Z"/><path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"/></svg><span>Continue with Google</span></button>
          <p className="switch">{isRegister ? 'Already have an account?' : 'New here?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Sign up'}</Link></p>
        </div>
      </section>
    </main>
  )
}
