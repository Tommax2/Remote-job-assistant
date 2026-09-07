import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const metricLabels = { newJobsToday: 'New jobs today', strongMatches: 'Strong matches', prepared: 'Applications prepared', sent: 'Applications sent' }
const statusLabels = { READY_FOR_REVIEW: 'Ready for review', APPROVED: 'Approved', APPLIED: 'Applied', PREPARING: 'Preparing', ASSESSMENT: 'Assessment', INTERVIEW: 'Interview', OFFER: 'Offer', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn' }
const typeLabels = { FULL_TIME: 'Full time', PART_TIME: 'Part time', CONTRACT: 'Contract', FREELANCE: 'Freelance', INTERNSHIP: 'Internship', OTHER: 'Other' }

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { api('/dashboard').then(setData).catch((err) => setError(err.message)) }, [])

  return <main className="dashboard-page">
    <div className="dashboard-content">
      <header className="dashboard-hero">
        <div><p className="eyebrow">Your workspace</p><h1>Welcome back, {user.name}.</h1><p>Here&apos;s what&apos;s moving in your remote job search.</p></div>
      </header>
      {error && <p className="error">{error}</p>}
      {!data ? <div className="jobs-loading"><div className="loader" /></div> : <>
        <section className="metric-grid">{Object.entries(metricLabels).map(([key, label]) => <Link to={key === 'newJobsToday' || key === 'strongMatches' ? '/jobs' : '/applications'} className={`metric-card metric-${key}`} key={key}><strong>{data.metrics[key]}</strong><span>{label}</span></Link>)}</section>
        <section className="top-markets">
          <div className="top-markets-heading"><div><p className="eyebrow">By relevance and demand</p><h2>Top job markets</h2></div><Link to="/jobs">View all jobs</Link></div>
          {data.topMatches.length ? <div className="market-list">{data.topMatches.map((match) => <Link className="market-row" to={`/jobs/${match.job._id}`} key={match.job._id}>
            <div className="market-role"><span>{match.job.company}</span><strong>{match.job.title}</strong></div>
            <div className="market-location"><span>{match.job.location}</span><strong>{typeLabels[match.job.employmentType] || match.job.employmentType?.replaceAll('_', ' ')}</strong></div>
            <span className="market-posted">{relativeDate(match.job.publishedAt)}</span>
            <div className={`market-score score-${scoreBand(match.overallScore)}`}><span className="market-score-ring" aria-hidden="true" /><strong>{match.overallScore}% matched</strong></div>
          </Link>)}</div> : <Empty message="Browse jobs to generate your first match scores." link="/jobs" label="Browse jobs" />}
        </section>
        <div className="dashboard-columns single-column">
          <section className="dashboard-panel">
            <div className="panel-title"><div><p className="eyebrow">Latest activity</p><h2>Recent applications</h2></div><Link to="/applications">View tracker</Link></div>
            {data.recentApplications.length ? <div className="dashboard-list">{data.recentApplications.map((application) => <Link to={`/applications/${application._id}`} key={application._id}><div><p>{application.company}</p><h3>{application.position}</h3></div><span className="dashboard-status">{statusLabels[application.status] || application.status}</span></Link>)}</div> : <Empty message="Prepared applications will appear here." link="/jobs" label="Prepare an application" />}
          </section>
        </div>
      </>}
    </div>
  </main>
}

function Empty({ message, link, label }) { return <div className="dashboard-empty"><p>{message}</p><Link to={link}>{label} →</Link></div> }

function scoreBand(score) { return score >= 80 ? 'strong' : score >= 50 ? 'fair' : 'low' }
function relativeDate(value) {
  const elapsed = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'Recently posted'
  const hours = Math.floor(elapsed / 3600000)
  if (hours < 1) return 'Posted less than 1h ago'
  if (hours < 24) return `Posted ${hours}h ago`
  return `Posted ${Math.floor(hours / 24)}d ago`
}
