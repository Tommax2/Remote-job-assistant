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
          <button className="google-button" type="button" onClick={handleGoogle}>Continue with Google</button>
          <p className="switch">{isRegister ? 'Already have an account?' : 'New here?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Sign up'}</Link></p>
        </div>
      </section>
    </main>
  )
}
