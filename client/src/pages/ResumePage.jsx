import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

const newItems = {
  experience: { jobTitle: '', company: '', startDate: '', endDate: '', description: '' },
  education: { school: '', degree: '', fieldOfStudy: '', endDate: '' },
  projects: { name: '', description: '', technologies: [] },
}

export default function ResumePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [resume, setResume] = useState(null)
  const [file, setFile] = useState(null)
  const [skill, setSkill] = useState('')
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { api('/resumes').then(({ resumes }) => setResume(resumes.find((item) => item.type === 'MASTER') || null)).catch((err) => setError(err.message)) }, [])
  const chooseFile = (selected) => { if (selected) { setFile(selected); setError('') } }
  async function upload() {
    if (!file) return setError('Choose a PDF or DOCX file first.')
    setBusy(true); setError(''); setNotice('')
    try {
      const data = new FormData(); data.append('resume', file)
      const result = await api('/resumes/upload', { method: 'POST', body: data })
      setResume(result.resume); setNotice(result.parsingMode === 'ai' ? 'CV parsed with AI. Review every detail before approving.' : 'Text extracted. AI is not configured, so review and complete the details below.')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const setField = (name, value) => setResume((old) => ({ ...old, [name]: value }))
  const updateItem = (section, index, name, value) => setResume((old) => ({ ...old, [section]: old[section].map((item, i) => i === index ? { ...item, [name]: value } : item) }))
  const addItem = (section) => setResume((old) => ({ ...old, [section]: [...old[section], { ...newItems[section] }] }))
  const removeItem = (section, index) => setResume((old) => ({ ...old, [section]: old[section].filter((_, i) => i !== index) }))
  function addSkill() { const value = skill.trim(); if (value && !resume.skills.includes(value)) setField('skills', [...resume.skills, value]); setSkill('') }
  async function save(approve = false) {
    setBusy(true); setError(''); setNotice('')
    try {
      const firstApproval = approve && resume.status !== 'APPROVED'
      const fields = ['name', 'professionalTitle', 'professionalSummary', 'skills', 'experience', 'education', 'projects']
      const payload = Object.fromEntries(fields.map((name) => [name, resume[name]])); payload.approve = approve
      const result = await api(`/resumes/${resume._id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      setResume(result.resume); if (firstApproval) navigate('/preferences'); else { setNotice(approve ? 'Master CV approved. Your career profile was updated with the reviewed CV details.' : 'Your review changes were saved.'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return <main className="profile-page">
    <nav className="app-nav"><Link className="brand-link" to="/dashboard"><span className="logo small">R</span><b>RemoteReady</b></Link><div><Link to="/profile">Profile</Link><button className="text-button" onClick={logout}>Sign out</button></div></nav>
    <header className="profile-header"><p className="eyebrow">MASTER CV</p><h1>Your career, in one source.</h1><p>Upload your best CV, inspect what was extracted, and approve only information that is accurate.</p></header>
    <div className="resume-workspace">
      {notice && <p className="success-banner">{notice}</p>}{error && <p className="error">{error}</p>}
      <section className={`upload-card ${dragging ? 'dragging' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files[0]) }}>
        <span className="upload-icon">↑</span><h2>{resume ? 'Replace your master CV' : 'Upload your master CV'}</h2><p>PDF or DOCX, up to 5 MB. Uploaded files are read in memory; extracted content is saved securely to your account.</p>
        <input ref={inputRef} className="file-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => chooseFile(e.target.files[0])} />
        <div className="upload-actions"><button type="button" className="outline-button" onClick={() => inputRef.current.click()}>Choose file</button>{file && <><span>{file.name}</span><button type="button" onClick={upload} disabled={busy}>{busy ? 'Extracting…' : 'Upload and extract'}</button></>}</div>
      </section>
      {resume && <section className="review-shell">
        <div className="review-heading"><div><p className="eyebrow">REVIEW EXTRACTED DETAILS</p><h2>{resume.name}</h2><p>{resume.originalFileName} · {(resume.fileSize / 1024).toFixed(0)} KB</p></div><span className={`status-pill ${resume.status === 'APPROVED' ? 'approved' : ''}`}>{resume.status === 'APPROVED' ? 'Approved' : 'Needs review'}</span></div>
        <div className="review-block"><h3>Professional overview</h3><div className="field-grid"><Field label="CV name" value={resume.name} onChange={(e) => setField('name', e.target.value)} /><Field label="Professional title" value={resume.professionalTitle || ''} onChange={(e) => setField('professionalTitle', e.target.value)} /></div><label>Professional summary<textarea rows="5" value={resume.professionalSummary || ''} onChange={(e) => setField('professionalSummary', e.target.value)} /></label></div>
        <div className="review-block"><h3>Skills</h3><div className="tag-entry"><input value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} placeholder="Add a verified skill" /><button type="button" onClick={addSkill}>Add</button></div><div className="tags">{resume.skills.map((item) => <span key={item}>{item}<button type="button" onClick={() => setField('skills', resume.skills.filter((value) => value !== item))}>×</button></span>)}</div></div>
        <ResumeList title="Experience" section="experience" items={resume.experience} update={updateItem} add={addItem} remove={removeItem} fields={[['jobTitle', 'Job title'], ['company', 'Company'], ['startDate', 'Start date'], ['endDate', 'End date']]} />
        <ResumeList title="Education" section="education" items={resume.education} update={updateItem} add={addItem} remove={removeItem} fields={[['school', 'School'], ['degree', 'Degree'], ['fieldOfStudy', 'Field of study'], ['endDate', 'Completion date']]} />
        <ResumeList title="Projects" section="projects" items={resume.projects} update={updateItem} add={addItem} remove={removeItem} fields={[['name', 'Project name']]} />
        <details className="raw-text"><summary>View extracted source text</summary><pre>{resume.parsedText}</pre></details>
        <div className="review-actions"><button type="button" className="outline-button" onClick={() => save(false)} disabled={busy}>Save draft</button><button type="button" onClick={() => save(true)} disabled={busy}>{busy ? 'Saving…' : 'Approve & update career profile'}</button></div>
      </section>}
    </div>
  </main>
}

function Field({ label, ...props }) { return <label>{label}<input {...props} /></label> }
function ResumeList({ title, section, items, fields, update, add, remove }) {
  return <div className="review-block"><h3>{title}</h3>{items.map((item, index) => <div className="repeat-card" key={item._id || index}><div className="repeat-title"><b>{title} {index + 1}</b><button type="button" onClick={() => remove(section, index)}>Remove</button></div><div className="field-grid">{fields.map(([name, label]) => <Field key={name} label={label} value={item[name] || (name === 'jobTitle' ? item.title : '') || ''} onChange={(e) => update(section, index, name, e.target.value)} />)}</div><label>Description<textarea rows="4" value={item.description || item.summary || ''} onChange={(e) => update(section, index, 'description', e.target.value)} /></label></div>)}<button type="button" className="outline-button" onClick={() => add(section)}>+ Add {title.toLowerCase()}</button></div>
}
