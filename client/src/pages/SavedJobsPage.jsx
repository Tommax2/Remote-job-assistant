import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  useEffect(() => { api('/jobs/saved').then((result) => setJobs(result.jobs)).catch((err) => setError(err.message)).finally(() => setLoading(false)) }, [])
  async function remove(jobId) { setError(''); try { await api(`/jobs/${jobId}/save`, { method: 'DELETE' }); setJobs((current) => current.filter((job) => job._id !== jobId)) } catch (err) { setError(err.message) } }
  return <main className="jobs-page"><nav className="app-nav"><Link className="brand-link" to="/jobs">← All jobs</Link><Link to="/applications">Application tracker</Link></nav><header className="jobs-header"><div><p className="eyebrow">SAVED JOBS</p><h1>Your shortlist.</h1><p>Keep promising roles here and prepare an application when you are ready.</p></div></header><section className="jobs-content">{error && <p className="error">{error}</p>}{loading ? <div className="jobs-loading"><div className="loader" /></div> : jobs.length ? <div className="job-grid">{jobs.map((job) => <article className="job-card" key={job._id}><div className="job-card-top"><span>{job.company[0]}</span>{job.match && <span className={`score-badge score-${scoreBand(job.match.overallScore)}`}>{job.match.overallScore}% match</span>}</div><div><p className="company-name">{job.company}</p><h2>{job.title}</h2></div><div className="job-meta"><span>{job.location}</span><span>{job.employmentType.replaceAll('_', ' ')}</span></div><p className="job-excerpt">{job.description.slice(0, 180)}{job.description.length > 180 ? '…' : ''}</p><div className="job-card-footer"><button className="text-button danger-text" onClick={() => remove(job._id)}>Remove</button><Link to={`/jobs/${job._id}`}>View job →</Link></div></article>)}</div> : <div className="empty-state"><h2>No saved jobs</h2><p>Save promising jobs from the job details page.</p><Link className="primary-link" to="/jobs">Browse jobs</Link></div>}</section></main>
}

function scoreBand(score) { return score >= 80 ? 'strong' : score >= 65 ? 'good' : score >= 45 ? 'possible' : 'low' }
