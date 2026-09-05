import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import StatusIndicator from '../components/StatusIndicator'
import { useSession } from '../context/useSession'
import { apiBaseUrl, apiRequest } from '../services/api'

const stageTones = { Applied: 'info', Screening: 'accent', Interview: 'info', Offer: 'warning', Hired: 'success', Rejected: 'danger' }

function relativeDate(value) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d`
}

function CandidatesPage() {
  const { user } = useSession()
  const [candidates, setCandidates] = useState([])
  const [openings, setOpenings] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ search: '', jobOpening: '', stage: '', source: '', sortBy: 'lastUpdate' })
  const [selected, setSelected] = useState([])
  const [bulkResults, setBulkResults] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [bulkStatus, setBulkStatus] = useState('idle')
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    if (user?.role !== 'recruiter') return
    apiRequest('/jobs').then((response) => setOpenings(response.data)).catch(() => setOpenings([]))
  }, [user?.role])

  useEffect(() => {
    if (user?.role !== 'recruiter') return
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams({ limit: '20', page: String(pagination.page), sortBy: filters.sortBy, sortOrder: 'desc' })
      Object.entries(filters).forEach(([key, value]) => { if (value && key !== 'sortBy') query.set(key, value) })
      apiRequest(`/applications?${query.toString()}`)
        .then((response) => {
          setCandidates(response.data.data)
          setPagination(response.data.pagination)
          setSelected([])
          setStatus('ready')
          setHasLoaded(true)
        })
        .catch((requestError) => { setError(requestError.message); setStatus('error'); setHasLoaded(true) })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [filters, pagination.page, user?.role])

  function updateFilter(event) {
    setStatus('loading')
    setPagination((current) => ({ ...current, page: 1 }))
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function toggleCandidate(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function toggleVisible() {
    const visibleIds = candidates.map((candidate) => candidate._id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id))
    setSelected((current) => allVisibleSelected ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])])
  }

  async function runBulkAction(action) {
    const verb = action === 'advance' ? 'advance' : 'reject'
    if (!window.confirm(`${verb === 'reject' ? 'Reject' : 'Advance'} ${selected.length} selected candidate${selected.length === 1 ? '' : 's'}? Each candidate will be processed independently.`)) return
    setBulkStatus('working')
    setError('')
    try {
      const { data } = await apiRequest(`/applications/bulk-${action}`, { method: 'POST', body: JSON.stringify({ applicationIds: selected }) })
      setBulkResults(data)
      const successfulIds = data.results.filter((result) => result.status === 'succeeded').map((result) => result.applicationId)
      setCandidates((current) => current.map((candidate) => {
        const result = data.results.find((item) => item.applicationId === candidate._id && item.status === 'succeeded')
        return result ? { ...candidate, stage: result.stage, updatedAt: new Date().toISOString() } : candidate
      }))
      setSelected((current) => current.filter((id) => !successfulIds.includes(id)))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBulkStatus('idle')
    }
  }

  async function exportCsv() {
    setError('')
    try {
      const response = await fetch(`${apiBaseUrl}/applications/export.csv`, { credentials: 'include' })
      if (!response.ok) throw new Error('CSV export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'hiring-pipeline.csv'
      link.click()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (user?.role !== 'recruiter') return <Navigate replace to="/interviews" />
  if (!hasLoaded && status === 'loading') return <div className="page route-loading">Loading candidates...</div>
  if (status === 'error') return <div className="page"><PageHeader eyebrow="Hiring desk" title="Candidates" description="Search and move through the people in your pipeline." /><div className="page-error" role="alert"><strong>Unable to load candidates.</strong><span>{error}</span><button className="secondary-button" type="button" onClick={() => setFilters((current) => ({ ...current }))}>Try again</button></div></div>

  const allVisibleSelected = candidates.length > 0 && candidates.every((candidate) => selected.includes(candidate._id))
  const firstVisibleResult = (pagination.page - 1) * pagination.limit + 1
  const lastVisibleResult = Math.min(firstVisibleResult + candidates.length - 1, pagination.total)

  return <div className="page candidates-page"><PageHeader eyebrow="Hiring desk" title="Candidates" description={`${pagination.total} applications across the visible pipeline.`} action={<button className="secondary-button header-button" type="button" onClick={exportCsv}>Export CSV</button>} />{error && <p className="inline-message" role="alert">{error}</p>}<div className="toolbar candidate-toolbar"><input className="search-input" name="search" type="search" placeholder="Search name or email" value={filters.search} onChange={updateFilter} aria-label="Search candidates" /><select name="jobOpening" value={filters.jobOpening} onChange={updateFilter} aria-label="Filter by opening"><option value="">All openings</option>{openings.map((opening) => <option value={opening._id} key={opening._id}>{opening.title}</option>)}</select><select name="stage" value={filters.stage} onChange={updateFilter} aria-label="Filter by stage"><option value="">All stages</option>{['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'].map((stage) => <option value={stage} key={stage}>{stage}</option>)}</select><input className="source-filter" name="source" type="text" placeholder="Source" value={filters.source} onChange={updateFilter} aria-label="Filter by source" /><select name="sortBy" value={filters.sortBy} onChange={updateFilter} aria-label="Sort candidates"><option value="lastUpdate">Updated</option><option value="appliedDate">Applied date</option><option value="stage">Stage</option></select></div>
    {selected.length > 0 && <div className="bulk-toolbar" role="region" aria-label="Bulk candidate actions"><strong>{selected.length} selected</strong><button className="text-button" type="button" onClick={toggleVisible}>{allVisibleSelected ? 'Clear visible' : 'Select all visible'}</button><button className="text-button" type="button" onClick={() => setSelected([])}>Clear selection</button><span /><button className="secondary-button" type="button" disabled={bulkStatus === 'working'} onClick={() => runBulkAction('advance')}>Advance</button><button className="danger-button" type="button" disabled={bulkStatus === 'working'} onClick={() => runBulkAction('reject')}>Reject</button></div>}
    {bulkResults && <section className="bulk-results" aria-live="polite"><div className="bulk-results-heading"><strong>Bulk action complete</strong><span>{bulkResults.summary.succeeded} succeeded · {bulkResults.summary.refused} refused</span><button className="icon-button" type="button" aria-label="Dismiss bulk results" onClick={() => setBulkResults(null)}>×</button></div>{bulkResults.results.map((result) => { const candidate = candidates.find((item) => item._id === result.applicationId); return <div className={`bulk-result ${result.status}`} key={result.applicationId}><span>{candidate?.candidateName || result.applicationId}</span><strong>{result.status === 'succeeded' ? `Moved to ${result.stage}` : result.reason}</strong></div>})}</section>}
    {candidates.length ? <><div className="table-wrap"><table className="candidate-table"><thead><tr><th scope="col"><input type="checkbox" aria-label="Select all visible candidates" checked={allVisibleSelected} onChange={toggleVisible} /></th><th scope="col">Candidate</th><th scope="col">Opening</th><th scope="col">Stage</th><th scope="col">Source</th><th scope="col">Updated</th></tr></thead><tbody>{candidates.map((candidate) => <tr className={selected.includes(candidate._id) ? 'selected-row' : ''} key={candidate._id}><td><input type="checkbox" checked={selected.includes(candidate._id)} onChange={() => toggleCandidate(candidate._id)} aria-label={`Select ${candidate.candidateName}`} /></td><td><Link className="candidate-table-name" to={`/candidates/${candidate._id}`}>{candidate.candidateName}</Link><span className="candidate-email">{candidate.candidateEmail}</span></td><td><span className="table-muted">{candidate.jobOpening?.title || '—'}</span></td><td><StatusIndicator label={candidate.stage} tone={stageTones[candidate.stage] || 'info'} /></td><td><span className="table-muted">{candidate.source}</span></td><td><span className="table-muted">{relativeDate(candidate.updatedAt)}</span></td></tr>)}</tbody></table></div><div className="pagination"><span>Showing {firstVisibleResult}–{lastVisibleResult} of {pagination.total}</span><div><button className="secondary-button" type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><span>Page {pagination.page} of {pagination.totalPages || 1}</span><button className="secondary-button" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div></div></> : <EmptyState title="No candidates here yet." description="Try changing your filters or add an application to an open position." />}
  </div>
}

export default CandidatesPage
