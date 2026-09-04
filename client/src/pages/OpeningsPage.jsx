import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import StatusIndicator from '../components/StatusIndicator'
import { apiRequest } from '../services/api'

const emptyForm = { title: '', department: '', description: '', status: 'open' }

function formatUpdated(value) {
  if (!value) return 'Never'
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function OpeningForm({ opening, onClose, onSaved }) {
  const [form, setForm] = useState(opening ? { title: opening.title, department: opening.department, description: opening.description, status: opening.status } : emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      const response = opening
        ? await apiRequest(`/jobs/${opening._id}`, { method: 'PATCH', body: JSON.stringify(form) })
        : await apiRequest('/jobs', { method: 'POST', body: JSON.stringify(form) })
      onSaved(response.data)
      onClose()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="form-panel"><div className="form-panel-heading"><div><p className="section-kicker">{opening ? 'Edit opening' : 'New opening'}</p><h2>{opening ? opening.title : 'Create a position'}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close form">×</button></div><form className="opening-form" onSubmit={handleSubmit}><label htmlFor="title">Title</label><input id="title" name="title" value={form.title} onChange={updateField} required maxLength={160} /><label htmlFor="department">Department</label><input id="department" name="department" value={form.department} onChange={updateField} required maxLength={100} /><label htmlFor="description">Description</label><textarea id="description" name="description" rows="4" value={form.description} onChange={updateField} required maxLength={10000} /><label htmlFor="status">Status</label><select id="status" name="status" value={form.status} onChange={updateField}><option value="open">Open</option><option value="closed">Closed</option><option value="archived">Archived</option></select>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={isSaving} type="submit">{isSaving ? 'Saving...' : opening ? 'Save changes' : 'Create opening'}</button></div></form></div>
}

function OpeningsPage() {
  const [openings, setOpenings] = useState([])
  const [counts, setCounts] = useState({})
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function loadOpenings() {
    try {
      const response = await apiRequest('/jobs?includeArchived=true')
      setOpenings(response.data)
      const countEntries = await Promise.all(response.data.map(async (opening) => {
        const applications = await apiRequest(`/applications?jobOpening=${opening._id}&limit=1&includeArchived=true`)
        const interviews = await apiRequest(`/applications?jobOpening=${opening._id}&stage=Interview&limit=1&includeArchived=true`)
        return [opening._id, { total: applications.data.pagination.total, interviewing: interviews.data.pagination.total }]
      }))
      setCounts(Object.fromEntries(countEntries))
      setStatus('ready')
    } catch (requestError) {
      setError(requestError.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    apiRequest('/jobs?includeArchived=true')
      .then(async (response) => {
        const countEntries = await Promise.all(response.data.map(async (opening) => {
          const applications = await apiRequest(`/applications?jobOpening=${opening._id}&limit=1&includeArchived=true`)
          const interviews = await apiRequest(`/applications?jobOpening=${opening._id}&stage=Interview&limit=1&includeArchived=true`)
          return [opening._id, { total: applications.data.pagination.total, interviewing: interviews.data.pagination.total }]
        }))
        setOpenings(response.data)
        setCounts(Object.fromEntries(countEntries))
        setStatus('ready')
      })
      .catch((requestError) => {
        setError(requestError.message)
        setStatus('error')
      })
  }, [])

  const visibleOpenings = useMemo(() => openings.filter((opening) => {
    const matchesSearch = `${opening.title} ${opening.department}`.toLowerCase().includes(search.toLowerCase())
    const matchesDepartment = departmentFilter === 'all' || opening.department === departmentFilter
    const matchesStatus = statusFilter === 'all' || opening.status === statusFilter
    const matchesArchived = showArchived || opening.status !== 'archived'
    return matchesSearch && matchesDepartment && matchesStatus && matchesArchived
  }), [departmentFilter, openings, search, showArchived, statusFilter])

  async function changeStatus(opening) {
    const nextStatus = opening.status === 'archived' ? 'open' : 'archived'
    const action = nextStatus === 'archived' ? 'archive' : 'restore'
    if (!window.confirm(`Are you sure you want to ${action} ${opening.title}?`)) return
    try {
      const response = await apiRequest(`/jobs/${opening._id}/${nextStatus === 'archived' ? 'archive' : 'restore'}`, { method: 'POST' })
      setOpenings((current) => current.map((item) => item._id === opening._id ? response.data : item))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function handleSaved(savedOpening) {
    setOpenings((current) => {
      const exists = current.some((opening) => opening._id === savedOpening._id)
      return exists ? current.map((opening) => opening._id === savedOpening._id ? savedOpening : opening) : [savedOpening, ...current]
    })
  }

  if (status === 'loading') return <div className="page route-loading">Loading open positions...</div>
  if (status === 'error') return <div className="page"><PageHeader eyebrow="Hiring desk" title="Open positions" description="Keep every role, team, and candidate count in one place." /><div className="page-error" role="alert"><strong>Unable to load openings.</strong><span>{error}</span><button className="secondary-button" type="button" onClick={() => { setStatus('loading'); loadOpenings() }}>Try again</button></div></div>

  const departments = [...new Set(openings.map((opening) => opening.department))].sort()

  return <div className="page"><PageHeader eyebrow="Hiring desk" title="Open positions" description="Keep every role, team, and candidate count in one place." action={<button className="primary-button" type="button" onClick={() => { setEditing(null); setShowForm(true) }}><span aria-hidden="true">+</span> New opening</button>} />
    {showForm && <OpeningForm opening={editing} onClose={() => setShowForm(false)} onSaved={handleSaved} />}
    <div className="toolbar"><input className="search-input" type="search" placeholder="Search openings" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search openings" /><select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} aria-label="Filter by department"><option value="all">All departments</option>{departments.map((department) => <option value={department} key={department}>{department}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="open">Open</option><option value="closed">Closed</option><option value="archived">Archived</option></select><label className="checkbox-label"><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Show archived</label></div>
    {visibleOpenings.length ? <div className="opening-list page-opening-list">{visibleOpenings.map((opening) => <div className="opening-row opening-row-action" key={opening._id}><Link className="opening-main" to={`/openings/${opening._id}`}><strong>{opening.title}</strong><span>{opening.department}</span></Link><div className="opening-stats"><span>{counts[opening._id]?.total ?? '—'} candidates</span><span>Updated {formatUpdated(opening.updatedAt)}</span></div><div className="opening-updated"><StatusIndicator label={opening.status} tone={opening.status === 'open' ? 'success' : opening.status === 'archived' ? 'warning' : 'info'} /><div className="row-actions"><button className="text-button" type="button" onClick={() => { setEditing(opening); setShowForm(true) }}>Edit</button><button className="text-button" type="button" onClick={() => changeStatus(opening)}>{opening.status === 'archived' ? 'Restore' : 'Archive'}</button></div></div></div>)}</div> : <EmptyState title="No openings match." description="Try a different search or create a new position." />}
  </div>
}

export default OpeningsPage
