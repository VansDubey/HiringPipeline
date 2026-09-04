import { useState } from 'react'

const emptyApplication = { candidateName: '', candidateEmail: '', source: '', notes: '' }

function ApplicationForm({ initialValue = emptyApplication, title, submitLabel, onCancel, onSubmit }) {
  const [form, setForm] = useState({ ...emptyApplication, ...initialValue })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="form-panel"><div className="form-panel-heading"><div><p className="section-kicker">Application</p><h2>{title}</h2></div><button className="icon-button" type="button" onClick={onCancel} aria-label="Close application form">×</button></div><form className="opening-form" onSubmit={handleSubmit}><label htmlFor="candidateName">Candidate name</label><input id="candidateName" name="candidateName" value={form.candidateName} onChange={updateField} required maxLength={160} /><label htmlFor="candidateEmail">Email</label><input id="candidateEmail" name="candidateEmail" type="email" value={form.candidateEmail} onChange={updateField} required maxLength={254} /><label htmlFor="source">Source</label><input id="source" name="source" value={form.source} onChange={updateField} required maxLength={100} placeholder="LinkedIn, referral, careers page…" /><label htmlFor="notes">Notes</label><textarea id="notes" name="notes" rows="4" value={form.notes} onChange={updateField} maxLength={10000} />{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Saving...' : submitLabel}</button></div></form></div>
}

export default ApplicationForm
