import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoadingState from '../components/LoadingState'
import { api } from '../services/api'

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20000)])
    api('/jobs/saved', { signal })
      .then((result) => { if (!controller.signal.aborted) setJobs(result.jobs) })
      .catch((err) => { if (!controller.signal.aborted) setLoadError(err.name === 'TimeoutError' ? 'This is taking longer than expected. Please try again.' : err.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt])
  function retry() { setLoadError(''); setLoading(true); setAttempt((value) => value + 1) }
  async function remove(jobId) { setError(''); try { await api(`/jobs/${jobId}/save`, { method: 'DELETE' }); setJobs((current) => current.filter((job) => job._id !== jobId)) } catch (err) { setError(err.message) } }
  return <main className="jobs-page saved-jobs-page"><nav className="app-nav"><Link className="brand-link" to="/jobs">All jobs</Link><Link to="/applications">Application tracker</Link></nav><header className="jobs-header"><div><p className="eyebrow">SAVED JOBS</p><h1>Your shortlist.</h1><p>Keep promising roles here and prepare an application when you are ready.</p></div></header><section className="jobs-content">{error && <p className="error" role="alert">{error}</p>}{loading ? <LoadingState label="Loading saved jobs?" /> : loadError ? <div className="empty-state" role="alert"><h2>Could not load saved jobs</h2><p>{loadError}</p><button className="primary-link" onClick={retry}>Try again</button></div> : jobs.length ? <div className="job-grid">{jobs.map((job) => <article className="job-card" key={job._id}><div className="job-card-top"><span>{job.company}</span>{job.match && <span className={`score-badge score-${scoreBand(job.match.overallScore)}`}>{job.match.overallScore}% match</span>}</div><div><p className="company-name">{job.company}</p><h2>{job.title}</h2></div><div className="job-meta"><span>{job.location}</span><span>{job.employmentType.replaceAll('_', ' ')}</span></div><p className="job-excerpt">{job.description.slice(0, 180)}{job.description.length > 180 ? '…' : ''}</p><div className="job-card-footer"><button className="text-button danger-text" onClick={() => remove(job._id)}>Remove</button><Link to={`/jobs/${job._id}`}>View job</Link></div></article>)}</div> : <div className="empty-state"><h2>No saved jobs</h2><p>Save promising jobs from the job details page.</p><Link className="primary-link" to="/jobs">Browse jobs</Link></div>}</section></main>
}

function scoreBand(score) { return score >= 80 ? 'strong' : score >= 65 ? 'good' : score >= 45 ? 'possible' : 'low' }
