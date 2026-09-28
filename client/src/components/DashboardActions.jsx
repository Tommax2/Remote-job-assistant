import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { displayDueDate, sortActions } from '../services/planner'

export default function DashboardActions() {
  const [actions, setActions] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    api('/applications/planner', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) })
      .then((result) => setActions(sortActions(result.applications.filter((item) => !item.actionCompleted)).slice(0, 3)))
      .catch((err) => { if (!controller.signal.aborted) setError(err.message) })
    return () => controller.abort()
  }, [])
  return <section className="dashboard-actions"><div className="action-heading"><div><p className="eyebrow">YOUR ACTION PLAN</p><h2>Next on your list</h2></div><Link to="/planner">View planner</Link></div>
    {error ? <p role="alert">Could not load your actions. <Link to="/planner">Open planner to retry</Link></p> : actions === null ? <p role="status">Loading your next steps…</p> : actions.length ? <div>{actions.map((item) => <Link className="dashboard-action-row" key={item._id} to={`/applications/${item._id}#plan`}><div><strong>{item.nextAction}</strong><span>{item.company} · {item.position}</span></div><time dateTime={item.actionDueDate || undefined}>{displayDueDate(item.actionDueDate)}</time></Link>)}</div> : <p>Add your first follow-up or preparation task from an <Link to="/applications">application</Link>.</p>}
  </section>
}
