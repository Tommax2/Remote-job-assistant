import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'

const checkLabels = { configuration: 'OAuth configuration', connected: 'Gmail authorization', tokenReadable: 'Encrypted token', refreshTokenAvailable: 'Refresh token', requiredScope: 'Gmail send permission', googleReachable: 'Google network access' }

export default function GmailSettingsPage() {
  const [params] = useSearchParams(); const [status, setStatus] = useState(null); const [diagnostics, setDiagnostics] = useState(null); const [working, setWorking] = useState(false); const [checking, setChecking] = useState(false); const [error, setError] = useState('')
  useEffect(() => {
    const attemptId = params.get('attempt')
    if (params.get('gmail') === 'finalize' && attemptId) {
      api('/email/google/finalize', { method: 'POST', body: JSON.stringify({ attemptId }) })
        .then(() => { setStatus({ connected: true, connectedAt: new Date().toISOString() }); window.history.replaceState({}, '', '/settings/email?gmail=connected') })
        .catch((err) => setError(err.message))
        .finally(() => setWorking(false))
      return
    }
    api('/email/google/status').then(setStatus).catch((err) => setError(err.message))
  }, [params])
  async function connect() { setWorking(true); setError(''); try { const result = await api('/email/google/connect'); window.location.assign(result.url) } catch (err) { setError(err.message); setWorking(false) } }
  async function disconnect() { setWorking(true); setError(''); try { await api('/email/google/connection', { method: 'DELETE' }); setStatus({ connected: false }); setDiagnostics(null) } catch (err) { setError(err.message) } finally { setWorking(false) } }
  async function runDiagnostics() { setChecking(true); setError(''); try { setDiagnostics(await api('/email/google/diagnostics')) } catch (err) { setError(err.message) } finally { setChecking(false) } }
  return <main className="profile-page"><nav className="app-nav"><Link className="brand-link" to="/dashboard">← Dashboard</Link><Link to="/applications">Application tracker</Link></nav><header className="profile-header"><p className="eyebrow">EMAIL SETTINGS</p><h1>Connect Gmail.</h1><p>RemoteReady requests permission to send only the applications you explicitly approve.</p></header><div className="resume-workspace">{params.get('gmail') === 'connected' && <p className="success-banner">Gmail connected successfully.</p>}{params.get('gmail') === 'denied' && <p className="error">Google authorization was cancelled.</p>}{error && <p className="error">{error}</p>}<section className="review-block gmail-card"><div><h2>{status?.connected ? 'Gmail is connected' : 'Gmail is not connected'}</h2><p>{status?.connected ? `Connected ${new Date(status.connectedAt).toLocaleString()}.` : 'Connect Gmail before sending an approved application.'}</p></div><div className="gmail-actions">{status?.connected ? <button className="outline-button" onClick={disconnect} disabled={working}>Disconnect</button> : <button onClick={connect} disabled={working || status === null}>{working ? 'Opening Google…' : 'Connect Gmail'}</button>}<button onClick={runDiagnostics} disabled={checking}>{checking ? 'Checking…' : 'Run readiness check'}</button></div></section>{diagnostics && <section className="review-block"><div className="panel-title"><div><p className="eyebrow">GMAIL READINESS</p><h2>{diagnostics.ready ? 'Ready to send' : 'Setup needs attention'}</h2></div><span className={`status-pill ${diagnostics.ready ? 'approved' : ''}`}>{diagnostics.ready ? 'All checks passed' : 'Check failed'}</span></div><div className="diagnostic-grid">{Object.entries(checkLabels).map(([key, label]) => <div key={key} className={diagnostics.checks[key] ? 'passed' : 'failed'}><span>{diagnostics.checks[key] ? '✓' : '×'}</span><b>{label}</b></div>)}</div>{!diagnostics.ready && <p className="muted">Reconnect Gmail if the token, refresh token, or permission check failed. Check the backend internet connection if Google network access failed.</p>}</section>}<section className="review-block"><h2>Permission and privacy</h2><p className="document-copy">The app requests the Gmail send scope only. It does not request permission to read your inbox. OAuth tokens remain on the backend and are encrypted before database storage.</p></section></div></main>
}
