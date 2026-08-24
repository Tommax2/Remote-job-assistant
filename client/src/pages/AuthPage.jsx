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
        <div className="logo">R</div>
        <p className="eyebrow">REMOTE JOB ASSISTANT</p>
        <h1>Turn your experience into your next opportunity.</h1>
        <p className="intro">One focused workspace to discover roles, tailor applications, and keep your search moving.</p>
        <div className="feature"><span>01</span><p><b>Build your profile</b><br />Keep your experience ready for every application.</p></div>
        <div className="feature"><span>02</span><p><b>Find better matches</b><br />Focus on remote roles that fit your strengths.</p></div>
        <div className="feature"><span>03</span><p><b>Apply with confidence</b><br />Tailor, review, and track everything in one place.</p></div>
      </section>
      <section className="form-panel">
        <div className="form-card">
          <p className="eyebrow">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</p>
          <h2>{isRegister ? 'Create your account' : 'Sign in to your workspace'}</h2>
          <p className="muted">{isRegister ? 'Your next remote role starts here.' : 'Continue building your career momentum.'}</p>
          <button className="google-button" type="button" onClick={handleGoogle}><span className="google-g">G</span> Continue with Google</button>
          <div className="divider"><span>or continue with email</span></div>
          <form onSubmit={handleSubmit}>
            {isRegister && <label>Full name<input required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" placeholder="Ada Lovelace" /></label>}
            <label>Email address<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" placeholder="you@example.com" /></label>
            <label>Password<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></label>
            {error && <p className="error" role="alert">{error}</p>}
            <button disabled={submitting}>{submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
          </form>
          <p className="switch">{isRegister ? 'Already have an account?' : 'New here?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
        </div>
      </section>
    </main>
  )
}
