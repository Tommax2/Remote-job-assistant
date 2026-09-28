import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { actionBucket, displayDueDate, localDateKey, sortActions } from '../services/planner'

const tabs = [['open', 'All open'], ['overdue', 'Overdue'], ['today', 'Today'], ['upcoming', 'Upcoming'], ['unscheduled', 'No date'], ['completed', 'Completed']]

export default function PlannerPage() {
  const [applications, setApplications] = useState([])
  const [filter, setFilter] = useState('open')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState('')
  const [error, setError] = useState('')
  const [today, setToday] = useState(localDateKey)
  useEffect(() => {
    const controller = new AbortController()
    api('/applications/planner', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) })
      .then((result) => setApplications(result.applications))
      .catch((err) => { if (!controller.signal.aborted) setError(err.name === 'TimeoutError' ? 'The planner took too long to load. Reload to try again.' : err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    const timer = window.setInterval(() => setToday(localDateKey()), 60000)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [])
  async function toggle(application) {
    setWorking(application._id); setError('')
    try {
      const result = await api(`/applications/${application._id}/plan`, { method: 'PATCH', body: JSON.stringify({ actionCompleted: !application.actionCompleted }), signal: AbortSignal.timeout(20000) })
      setApplications((current) => current.map((item) => item._id === application._id ? result.application : item))
    } catch (err) { setError(err.message) }
    finally { setWorking('') }
  }
  const matchesTab = (item, key) => key === 'open' ? !item.actionCompleted : actionBucket(item, today) === key
  const visible = sortActions(applications).filter((item) => matchesTab(item, filter) && `${item.company} ${item.position} ${item.nextAction}`.toLowerCase().includes(search.toLowerCase()))
  return <main className="planner-page">
    <header className="planner-heading"><p className="eyebrow">A LITTLE PROGRESS, EVERY DAY</p><h1>Make your next move.</h1><p>Follow-ups, interview preparation, and deadlines, all in one place.</p><Link to="/applications">Plan an action from your applications</Link></header>
    <section className="planner-tools" aria-label="Filter actions"><div className="planner-tabs">{tabs.map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}<span>{applications.filter((item) => matchesTab(item, key)).length}</span></button>)}</div><input type="search" aria-label="Search your actions" placeholder="Search actions, companies, or roles" value={search} onChange={(event) => setSearch(event.target.value)} /></section>
    {error && <p role="alert" className="error">{error}</p>}
    {loading ? <p role="status" className="planner-empty">Loading your action plan…</p> : visible.length ? <div className="planner-list">{visible.map((item) => <article className={`planner-item ${item.actionCompleted ? 'is-complete' : ''}`} key={item._id}>
      <div className="planner-item-main"><div className="planner-tags"><span className={`due-${actionBucket(item, today)}`}>{actionBucket(item, today) === 'overdue' ? 'Overdue · ' : actionBucket(item, today) === 'today' ? 'Today · ' : ''}{displayDueDate(item.actionDueDate)}</span>{item.priority === 'HIGH' && <span className="priority-high">High priority</span>}</div><h2>{item.nextAction}</h2><p>{item.company} · {item.position}</p></div>
      <div className="planner-item-actions"><Link to={`/applications/${item._id}#plan`}>Edit plan and notes</Link><button disabled={Boolean(working)} onClick={() => toggle(item)}>{working === item._id ? 'Saving…' : item.actionCompleted ? 'Reopen' : 'Mark complete'}</button></div>
    </article>)}</div> : <div className="planner-empty"><h2>{applications.length ? 'No actions in this view' : 'Give your job search a next step'}</h2><p>{applications.length ? 'Try another filter or search term.' : 'Open an application to add a follow-up, a due date, or an interview preparation task.'}</p><Link to="/applications">Open application tracker</Link></div>}
  </main>
}
