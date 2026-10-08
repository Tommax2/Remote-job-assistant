import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../services/api'

export default function GmailSettingsPage() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [justConnected, setJustConnected] = useState(false)
  const finalizeStarted = useRef(false)

  useEffect(() => {
    const attemptId = params.get('attempt')
    if (params.get('gmail') === 'finalize' && attemptId) {
      if (finalizeStarted.current) return
      finalizeStarted.current = true
      setWorking(true)
      window.history.replaceState({}, '', '/settings/email?gmail=connecting')
      api('/email/google/finalize', { method: 'POST', body: JSON.stringify({ attemptId }) })
        .then(() => api('/email/google/status'))
        .then((connection) => {
          setStatus(connection)
          setJustConnected(connection.connected)
          window.history.replaceState({}, '', '/settings/email?gmail=connected')
        })
        .catch((err) => { setError(err.message); setStatus({ connected: false }) })
        .finally(() => setWorking(false))
      return
    }
    api('/email/google/status').then(setStatus).catch((err) => setError(err.message))
  }, [params])

  async function refreshStatus() {
    setWorking(true)
    setError('')
    try {
      setStatus(await api('/email/google/status'))
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  async function connect() {
    setWorking(true)
    setError('')
    try {
      const result = await api('/email/google/connect')
      window.location.assign(result.url)
    } catch (err) {
      setError(err.message)
      setWorking(false)
    }
  }

  async function disconnect() {
    setWorking(true)
    setError('')
    try {
      await api('/email/google/connection', { method: 'DELETE' })
      setStatus({ connected: false })
      setJustConnected(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  return <main className="profile-page career-profile-page gmail-settings-page">
    <header className="profile-header"><p className="eyebrow">EMAIL SETTINGS</p><h1>Connect Gmail.</h1><p>ApplyLumo requests permission to send only the applications you explicitly approve.</p></header>
    <div className="resume-workspace">
      {status?.connected && (justConnected || params.get('gmail') === 'connected') && <p className="success-banner" role="status">Gmail connected successfully.</p>}
      {params.get('gmail') === 'denied' && <p className="error">Google authorization was cancelled.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <section className="review-block gmail-card">
        <div><h2>{status === null ? error ? 'Connection status unavailable' : 'Checking Gmail connection…' : status.connected ? 'Gmail is connected' : 'Gmail is not connected'}</h2><p>{status === null ? error ? 'Retry the status check to manage your Gmail connection.' : 'Please wait while we check your connection.' : status.connected ? `Connected ${new Date(status.connectedAt).toLocaleString()}.` : 'Connect Gmail before sending an approved application.'}</p></div>
        <div className="gmail-actions">{status === null ? error && <button onClick={refreshStatus} disabled={working}>Retry connection check</button> : status.connected ? <button className="outline-button" onClick={disconnect} disabled={working}>Disconnect</button> : <button onClick={connect} disabled={working}>{working ? 'Connecting…' : 'Connect Gmail'}</button>}</div>
      </section>
      <section className="review-block"><h2>Permission and privacy</h2><p className="document-copy">The app requests the Gmail send scope only. It does not request permission to read your inbox. OAuth tokens remain on the backend and are encrypted before database storage.</p></section>
    </div>
  </main>
}
