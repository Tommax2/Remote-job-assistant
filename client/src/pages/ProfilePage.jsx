import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const templates = {
  experience: { jobTitle: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' },
  education: { school: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' },
  projects: { name: '', description: '', technologies: [], url: '' },
}

const blankProfile = (user) => ({
  fullName: user?.name || '', phone: '', email: user?.email || '', location: '',
  professionalTitle: '', professionalSummary: '', yearsOfExperience: 0, skills: [],
  experience: [], education: [], projects: [],
  portfolio: { linkedin: '', github: '', website: '' },
})

function Field({ label, ...props }) { return <label>{label}<input {...props} /></label> }
function Section({ number, title, help, children }) {
  return <section className="profile-section"><div className="section-heading"><span>{number}</span><div><h2>{title}</h2><p>{help}</p></div></div><div className="section-body">{children}</div></section>
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(() => blankProfile(user))
  const [skill, setSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api('/profile').then(({ profile: saved }) => {
      if (saved) setProfile({ ...blankProfile(user), ...saved, portfolio: { ...blankProfile(user).portfolio, ...saved.portfolio } })
    }).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }, [user])

  const setField = (name, value) => setProfile((old) => ({ ...old, [name]: value }))
  const addItem = (section) => setProfile((old) => ({ ...old, [section]: [...old[section], { ...templates[section] }] }))
  const removeItem = (section, index) => setProfile((old) => ({ ...old, [section]: old[section].filter((_, i) => i !== index) }))
  const updateItem = (section, index, name, value) => setProfile((old) => ({ ...old, [section]: old[section].map((item, i) => i === index ? { ...item, [name]: value } : item) }))
  function addSkill() {
    const value = skill.trim()
    if (value && !profile.skills.some((item) => item.toLowerCase() === value.toLowerCase())) setField('skills', [...profile.skills, value])
    setSkill('')
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      const isFirstSave = !profile._id
      const payload = Object.fromEntries(Object.entries({ ...profile, yearsOfExperience: Number(profile.yearsOfExperience) || 0 }).filter(([key]) => !['_id', 'userId', 'createdAt', 'updatedAt', '__v'].includes(key)))
      const { profile: saved } = await api('/profile', { method: profile._id ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
      setProfile({ ...blankProfile(user), ...saved }); if (isFirstSave) navigate('/resume'); else { setNotice('Career profile saved successfully.'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  if (loading) return <div className="center"><div className="loader" /></div>

  return <main className="profile-page">
    <nav className="app-nav"><Link className="brand-link" to="/dashboard"><span className="logo small">R</span><b>RemoteReady</b></Link><div><Link to="/dashboard">Dashboard</Link><button className="text-button" onClick={logout}>Sign out</button></div></nav>
    <header className="profile-header"><p className="eyebrow">CAREER PROFILE</p><h1>Tell us what you bring.</h1><p>This becomes the trusted source for matching jobs and tailoring applications later.</p></header>
    <form className="profile-form" onSubmit={save}>
      {notice && <p className="success-banner">{notice}</p>}{error && <p className="error">{error}</p>}
      <Section number="01" title="Personal details" help="How employers can identify and contact you."><div className="field-grid"><Field label="Full name *" value={profile.fullName} onChange={(e) => setField('fullName', e.target.value)} required /><Field label="Email *" type="email" value={profile.email} onChange={(e) => setField('email', e.target.value)} required /><Field label="Phone" value={profile.phone} onChange={(e) => setField('phone', e.target.value)} /><Field label="Location" placeholder="Lagos, Nigeria" value={profile.location} onChange={(e) => setField('location', e.target.value)} /></div></Section>
      <Section number="02" title="Professional overview" help="A concise picture of your role and experience."><div className="field-grid"><Field label="Professional title *" placeholder="Frontend Developer" value={profile.professionalTitle} onChange={(e) => setField('professionalTitle', e.target.value)} required /><Field label="Years of experience" type="number" min="0" max="70" value={profile.yearsOfExperience} onChange={(e) => setField('yearsOfExperience', e.target.value)} /></div><label>Professional summary<textarea rows="5" value={profile.professionalSummary} onChange={(e) => setField('professionalSummary', e.target.value)} placeholder="Describe your strengths, experience, and the value you create." /></label></Section>
      <Section number="03" title="Skills" help="Add tools, technologies, and capabilities you genuinely have."><div className="tag-entry"><input value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} placeholder="Type a skill and press Enter" /><button type="button" onClick={addSkill}>Add skill</button></div><div className="tags">{profile.skills.map((item) => <span key={item}>{item}<button type="button" aria-label={`Remove ${item}`} onClick={() => setField('skills', profile.skills.filter((value) => value !== item))}>×</button></span>)}</div></Section>
      <Section number="04" title="Work experience" help="List relevant roles, beginning with your most recent.">{profile.experience.map((item, i) => <div className="repeat-card" key={item._id || i}><ItemHeader title={`Experience ${i + 1}`} onRemove={() => removeItem('experience', i)} /><div className="field-grid"><Field label="Job title" value={item.jobTitle} onChange={(e) => updateItem('experience', i, 'jobTitle', e.target.value)} /><Field label="Company" value={item.company} onChange={(e) => updateItem('experience', i, 'company', e.target.value)} /><Field label="Location" value={item.location} onChange={(e) => updateItem('experience', i, 'location', e.target.value)} /><Field label="Start date" type="month" value={item.startDate} onChange={(e) => updateItem('experience', i, 'startDate', e.target.value)} /><Field label="End date" type="month" value={item.endDate} disabled={item.current} onChange={(e) => updateItem('experience', i, 'endDate', e.target.value)} /><label className="checkbox"><input type="checkbox" checked={item.current} onChange={(e) => updateItem('experience', i, 'current', e.target.checked)} />I currently work here</label></div><label>Highlights<textarea rows="4" value={item.description} onChange={(e) => updateItem('experience', i, 'description', e.target.value)} /></label></div>)}<AddButton onClick={() => addItem('experience')}>Add experience</AddButton></Section>
      <Section number="05" title="Education" help="Add degrees, diplomas, or other relevant study.">{profile.education.map((item, i) => <div className="repeat-card" key={item._id || i}><ItemHeader title={`Education ${i + 1}`} onRemove={() => removeItem('education', i)} /><div className="field-grid"><Field label="School" value={item.school} onChange={(e) => updateItem('education', i, 'school', e.target.value)} /><Field label="Degree" value={item.degree} onChange={(e) => updateItem('education', i, 'degree', e.target.value)} /><Field label="Field of study" value={item.fieldOfStudy} onChange={(e) => updateItem('education', i, 'fieldOfStudy', e.target.value)} /><Field label="Start date" type="month" value={item.startDate} onChange={(e) => updateItem('education', i, 'startDate', e.target.value)} /><Field label="End date" type="month" value={item.endDate} onChange={(e) => updateItem('education', i, 'endDate', e.target.value)} /></div></div>)}<AddButton onClick={() => addItem('education')}>Add education</AddButton></Section>
      <Section number="06" title="Projects" help="Show practical work that supports your experience.">{profile.projects.map((item, i) => <div className="repeat-card" key={item._id || i}><ItemHeader title={`Project ${i + 1}`} onRemove={() => removeItem('projects', i)} /><div className="field-grid"><Field label="Project name" value={item.name} onChange={(e) => updateItem('projects', i, 'name', e.target.value)} /><Field label="Project URL" type="url" placeholder="https://" value={item.url} onChange={(e) => updateItem('projects', i, 'url', e.target.value)} /><Field label="Technologies (comma separated)" value={(item.technologies || []).join(', ')} onChange={(e) => updateItem('projects', i, 'technologies', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} /></div><label>Description<textarea rows="4" value={item.description} onChange={(e) => updateItem('projects', i, 'description', e.target.value)} /></label></div>)}<AddButton onClick={() => addItem('projects')}>Add project</AddButton></Section>
      <Section number="07" title="Portfolio links" help="Help employers see more of your professional work."><div className="field-grid">{['linkedin', 'github', 'website'].map((name) => <Field key={name} label={name === 'website' ? 'Portfolio / website' : name[0].toUpperCase() + name.slice(1)} type="url" placeholder="https://" value={profile.portfolio[name] || ''} onChange={(e) => setField('portfolio', { ...profile.portfolio, [name]: e.target.value })} />)}</div></Section>
      <div className="save-bar"><div><b>{profile._id ? 'Profile in progress' : 'Ready to create your profile'}</b><p>You can return and edit these details anytime.</p></div><button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save career profile'}</button></div>
    </form>
  </main>
}

function ItemHeader({ title, onRemove }) { return <div className="repeat-title"><b>{title}</b><button type="button" onClick={onRemove}>Remove</button></div> }
function AddButton({ onClick, children }) { return <button className="outline-button" type="button" onClick={onClick}>+ {children}</button> }
