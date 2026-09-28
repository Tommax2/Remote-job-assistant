import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

export default function ApplicationPlan({ application, onSave }) {
  const [form, setForm] = useState({ nextAction: application.nextAction || '', actionDueDate: application.actionDueDate || '', priority: application.priority || 'NORMAL', actionCompleted: application.actionCompleted || false, privateNotes: application.privateNotes || '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  function change(field, value) {
    setMessage('')
    setForm((current) => ({ ...current, [field]: value, ...(field === 'nextAction' ? { actionCompleted: false } : {}) }))
  }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('')
    try {
      const result = await api(`/applications/${application._id}/plan`, { method: 'PATCH', body: JSON.stringify(form), signal: AbortSignal.timeout(20000) })
      onSave(result.application)
      setMessage('Your plan and notes have been saved.')
    } catch (err) { setError(err.name === 'TimeoutError' ? 'Saving timed out. Your text is still here; try saving again.' : err.message) }
    finally { setSaving(false) }
  }
  return <section className="action-workspace">
    <div className="action-heading"><div><p className="eyebrow">KEEP THINGS MOVING</p><h2>Your next step</h2></div><Link to="/planner">Open planner</Link></div>
    <form onSubmit={save}>
      <fieldset disabled={saving}>
        <label>Next action<input maxLength={240} placeholder="Follow up with the recruiter" value={form.nextAction} onChange={(event) => change('nextAction', event.target.value)} /></label>
        <div className="action-fields"><label>Due date<input type="date" value={form.actionDueDate} onChange={(event) => change('actionDueDate', event.target.value)} /></label><label>Priority<select value={form.priority} onChange={(event) => change('priority', event.target.value)}><option value="NORMAL">Normal</option><option value="HIGH">High priority</option></select></label></div>
        {form.nextAction.trim() && <label className="action-checkbox"><input type="checkbox" checked={form.actionCompleted} onChange={(event) => change('actionCompleted', event.target.checked)} />This action is complete</label>}
        <div className="notebook-heading"><h2>Private notebook</h2><p>Keep recruiter details, interview questions, and your preparation notes together. These notes are never included in application emails.</p></div>
        <label>Application notes<textarea rows={7} maxLength={6000} placeholder="Recruiter contact, company research, questions to ask, or notes from your last conversation…" value={form.privateNotes} onChange={(event) => change('privateNotes', event.target.value)} /></label>
        <small className="note-count">{form.privateNotes.length.toLocaleString()} / 6,000 characters</small>
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p className="success-banner" role="status">{message}</p>}
      <div className="action-save"><p>Dates appear in your planner. No emails are sent automatically.</p><button disabled={saving}>{saving ? 'Saving…' : 'Save plan and notes'}</button></div>
    </form>
  </section>
}
