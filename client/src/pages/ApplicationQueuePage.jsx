import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

const statusLabels = { READY_FOR_REVIEW: 'Ready for review', APPROVED: 'Approved', APPLIED: 'Applied', PREPARING: 'Preparing', ASSESSMENT: 'Assessment', INTERVIEW: 'Interview', OFFER: 'Offer', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn' }
const statCards = [['TOTAL', 'Total'], ['APPLIED', 'Applied'], ['ASSESSMENT', 'Assessments'], ['INTERVIEW', 'Interviews'], ['OFFER', 'Offers'], ['REJECTED', 'Rejected']]
const statusOrder = ['READY_FOR_REVIEW', 'PREPARING', 'APPROVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']

export default function ApplicationQueuePage() {
  const [applications, setApplications] = useState([])
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(next = filters) {
    setLoading(true)
    setError('')
    try {
      const query = new URLSearchParams(Object.fromEntries(Object.entries(next).filter(([, value]) => value)))
      const result = await api(`/applications?${query}`)
      setApplications(result.applications)
      setStats(result.stats)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { api('/applications').then((result) => { setApplications(result.applications); setStats(result.stats) }).catch((err) => setError(err.message)).finally(() => setLoading(false)) }, [])

  const groups = useMemo(() => statusOrder.map((status) => ({ status, applications: applications.filter((application) => application.status === status) })).filter((group) => group.applications.length), [applications])

  return <main className="profile-page applications-page">
    <header className="profile-header">
      <p className="eyebrow">{stats.TOTAL || applications.length} open matters</p>
      <h1>Track every opportunity.</h1>
      <p>Review prepared applications and follow each one from sending through the final outcome.</p>
    </header>
    <div className="application-queue">
      <section className="tracker-stats">{statCards.map(([key, label]) => <button key={key} className={filters.status === key || (key === 'TOTAL' && !filters.status) ? 'active' : ''} onClick={() => { const next = { ...filters, status: key === 'TOTAL' ? '' : key }; setFilters(next); load(next) }}><strong>{stats[key] || 0}</strong><span>{label}</span></button>)}</section>
      <form className="tracker-filters" onSubmit={(event) => { event.preventDefault(); load() }}>
        <input aria-label="Search applications" placeholder="Search company or job title" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
        <select aria-label="Filter by status" value={filters.status} onChange={(event) => { const next = { ...filters, status: event.target.value }; setFilters(next); load(next) }}><option value="">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button>Search</button>
      </form>
      {error && <p className="error">{error}</p>}
      {loading ? <div className="jobs-loading"><div className="loader" /></div> : groups.length ? <div className="application-groups">{groups.map((group) => <section className="application-group" key={group.status}>
        <header><h2>{statusLabels[group.status] || group.status}</h2><span>{group.applications.length}</span></header>
        {group.applications.map((application) => <article className="queue-card" key={application._id}>
          <div className="queue-identity"><h3>{application.position}</h3><p>{application.company}</p></div>
          <span className="queue-match">{application.matchScore != null ? `${application.matchScore}% match` : 'Match pending'}</span>
          <span className="queue-date">{application.appliedAt ? `Applied ${new Date(application.appliedAt).toLocaleDateString()}` : `Prepared ${new Date(application.preparedAt).toLocaleDateString()}`}</span>
          <div className="queue-actions">{application.status !== 'APPLIED' && <Link to={`/applications/${application._id}/email`}>Edit email</Link>}<Link to={`/applications/${application._id}`}>View details</Link></div>
        </article>)}
      </section>)}</div> : <div className="empty-state"><h2>No applications found</h2><p>Adjust your filters or prepare applications from the jobs page.</p><Link className="primary-link" to="/jobs">Browse jobs</Link></div>}
    </div>
  </main>
}
