import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const blank = {
  jobTitles: [], skills: [], remoteOnly: true, preferredLocations: [], workFromLocations: [],
  employmentTypes: ['FULL_TIME'], experienceLevels: [], minimumSalary: 0,
  salaryCurrency: 'USD', minimumMatchScore: 70,
}
const employmentOptions = [['FULL_TIME', 'Full-time'], ['PART_TIME', 'Part-time'], ['CONTRACT', 'Contract'], ['FREELANCE', 'Freelance'], ['INTERNSHIP', 'Internship']]
const experienceOptions = [['ENTRY', 'Entry level'], ['JUNIOR', 'Junior'], ['MID_LEVEL', 'Mid-level'], ['SENIOR', 'Senior'], ['LEAD', 'Lead'], ['EXECUTIVE', 'Executive']]

export default function PreferencesPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState(blank)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { api('/preferences').then(({ preferences: saved }) => { if (saved) setPreferences({ ...blank, ...saved }) }).catch((err) => setError(err.message)).finally(() => setLoading(false)) }, [])
  const setField = (name, value) => setPreferences((old) => ({ ...old, [name]: value }))
  function toggle(name, value) { setField(name, preferences[name].includes(value) ? preferences[name].filter((item) => item !== value) : [...preferences[name], value]) }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      const isFirstSave = !preferences._id
      const payload = Object.fromEntries(Object.entries(preferences).filter(([key]) => !['_id', 'userId', 'createdAt', 'updatedAt', '__v'].includes(key)))
      payload.minimumSalary = Number(payload.minimumSalary) || 0; payload.minimumMatchScore = Number(payload.minimumMatchScore)
      const { preferences: saved } = await api('/preferences', { method: preferences._id ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
      setPreferences({ ...blank, ...saved }); if (isFirstSave) navigate('/dashboard'); else { setNotice('Job preferences saved. Future recommendations will use these filters.'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  if (loading) return <div className="center"><div className="loader" /></div>

  return <main className="profile-page">
    <nav className="app-nav"><Link className="brand-link" to="/dashboard"><span className="logo small">R</span><b>RemoteReady</b></Link><div><Link to="/profile">Profile</Link><Link to="/resume">Master CV</Link><button className="text-button" onClick={logout}>Sign out</button></div></nav>
    <header className="profile-header"><p className="eyebrow">JOB PREFERENCES</p><h1>Define your ideal next move.</h1><p>Set focused criteria so the job discovery and matching engine knows what is relevant—and what is not.</p></header>
    <form className="profile-form" onSubmit={save}>
      {notice && <p className="success-banner">{notice}</p>}{error && <p className="error">{error}</p>}
      <PreferenceSection number="01" title="Roles and skills" help="Tell us which jobs to seek and which strengths should appear in them.">
        <TagInput label="Preferred job titles" placeholder="e.g. Frontend Developer" values={preferences.jobTitles} onChange={(values) => setField('jobTitles', values)} />
        <TagInput label="Preferred skills" placeholder="e.g. React" values={preferences.skills} onChange={(values) => setField('skills', values)} />
      </PreferenceSection>
      <PreferenceSection number="02" title="Remote and location" help="Remote does not always mean worldwide. These details prevent ineligible recommendations.">
        <label className="switch-row"><span><b>Remote jobs only</b><small>Exclude office-based and hybrid roles.</small></span><input type="checkbox" checked={preferences.remoteOnly} onChange={(e) => setField('remoteOnly', e.target.checked)} /></label>
        <TagInput label="Preferred job locations or regions" placeholder="e.g. Worldwide, Europe" values={preferences.preferredLocations} onChange={(values) => setField('preferredLocations', values)} />
        <TagInput label="Countries you can legally work from" placeholder="e.g. Nigeria" values={preferences.workFromLocations} onChange={(values) => setField('workFromLocations', values)} />
      </PreferenceSection>
      <PreferenceSection number="03" title="Employment type" help="Select every arrangement you are willing to consider."><OptionGrid options={employmentOptions} selected={preferences.employmentTypes} onToggle={(value) => toggle('employmentTypes', value)} /></PreferenceSection>
      <PreferenceSection number="04" title="Experience level" help="Choose the seniority levels that match your current search."><OptionGrid options={experienceOptions} selected={preferences.experienceLevels} onToggle={(value) => toggle('experienceLevels', value)} /></PreferenceSection>
      <PreferenceSection number="05" title="Salary and match threshold" help="Set your minimum compensation and how selective recommendations should be.">
        <div className="salary-grid"><label>Currency<select value={preferences.salaryCurrency} onChange={(e) => setField('salaryCurrency', e.target.value)}>{['USD', 'NGN', 'GBP', 'EUR'].map((currency) => <option key={currency}>{currency}</option>)}</select></label><label>Minimum annual salary<input type="number" min="0" step="1000" value={preferences.minimumSalary} onChange={(e) => setField('minimumSalary', e.target.value)} /></label></div>
        <label className="range-field"><span><b>Minimum match score</b><strong>{preferences.minimumMatchScore}%</strong></span><input type="range" min="0" max="100" step="5" value={preferences.minimumMatchScore} onChange={(e) => setField('minimumMatchScore', e.target.value)} /><small>Jobs scoring below this threshold will not appear as strong recommendations.</small></label>
      </PreferenceSection>
      <div className="save-bar"><div><b>{preferences._id ? 'Preferences configured' : 'Ready to focus your search'}</b><p>You can adjust these settings whenever your goals change.</p></div><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save job preferences'}</button></div>
    </form>
  </main>
}

function PreferenceSection({ number, title, help, children }) { return <section className="profile-section"><div className="section-heading"><span>{number}</span><div><h2>{title}</h2><p>{help}</p></div></div><div className="section-body">{children}</div></section> }
function TagInput({ label, placeholder, values, onChange }) {
  const [input, setInput] = useState('')
  function add() { const value = input.trim(); if (value && !values.some((item) => item.toLowerCase() === value.toLowerCase())) onChange([...values, value]); setInput('') }
  return <div className="tag-field"><label>{label}</label><div className="tag-entry"><input value={input} placeholder={placeholder} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} /><button type="button" onClick={add}>Add</button></div><div className="tags">{values.map((item) => <span key={item}>{item}<button type="button" aria-label={`Remove ${item}`} onClick={() => onChange(values.filter((value) => value !== item))}>×</button></span>)}</div></div>
}
function OptionGrid({ options, selected, onToggle }) { return <div className="option-grid">{options.map(([value, label]) => <label className={`option-card ${selected.includes(value) ? 'selected' : ''}`} key={value}><input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} /><span>{label}</span></label>)}</div> }
