import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import StatusIndicator from '../components/StatusIndicator'
import { apiRequest } from '../services/api'

const stageTones = { Applied: 'info', Screening: 'accent', Interview: 'info', Offer: 'warning', Hired: 'success', Rejected: 'danger' }

function relativeDate(value) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d`
}

function CandidatesPage() {
  const [candidates, setCandidates] = useState([])
  const [openings, setOpenings] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ search: '', jobOpening: '', stage: '', source: '', sortBy: 'lastUpdate' })
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/jobs')
      .then((response) => setOpenings(response.data))
      .catch(() => setOpenings([]))
  }, [])

  useEffect(() => {
    const query = new URLSearchParams({ limit: '20', page: String(pagination.page), sortBy: filters.sortBy, sortOrder: 'desc' })
    Object.entries(filters).forEach(([key, value]) => { if (value && key !== 'sortBy') query.set(key, value) })
    apiRequest(`/applications?${query.toString()}`)
      .then((response) => {
        setCandidates(response.data.data)
        setPagination(response.data.pagination)
        setStatus('ready')
      })
      .catch((requestError) => {
        setError(requestError.message)
        setStatus('error')
      })
  }, [filters, pagination.page])

  function updateFilter(event) {
    setStatus('loading')
    setPagination((current) => ({ ...current, page: 1 }))
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  if (status === 'loading' && candidates.length === 0) return <div className="page route-loading">Loading candidates...</div>
  if (status === 'error') return <div className="page"><PageHeader eyebrow="Hiring desk" title="Candidates" description="Search and move through the people in your pipeline." /><div className="page-error" role="alert"><strong>Unable to load candidates.</strong><span>{error}</span><button className="secondary-button" type="button" onClick={() => setFilters((current) => ({ ...current }))}>Try again</button></div></div>

  return <div className="page candidates-page"><PageHeader eyebrow="Hiring desk" title="Candidates" description={`${pagination.total} applications across the visible pipeline.`} /><div className="toolbar candidate-toolbar"><input className="search-input" name="search" type="search" placeholder="Search name or email" value={filters.search} onChange={updateFilter} aria-label="Search candidates" /><select name="jobOpening" value={filters.jobOpening} onChange={updateFilter} aria-label="Filter by opening"><option value="">All openings</option>{openings.map((opening) => <option value={opening._id} key={opening._id}>{opening.title}</option>)}</select><select name="stage" value={filters.stage} onChange={updateFilter} aria-label="Filter by stage"><option value="">All stages</option>{['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'].map((stage) => <option value={stage} key={stage}>{stage}</option>)}</select><input className="source-filter" name="source" type="text" placeholder="Source" value={filters.source} onChange={updateFilter} aria-label="Filter by source" /><select name="sortBy" value={filters.sortBy} onChange={updateFilter} aria-label="Sort candidates"><option value="lastUpdate">Updated</option><option value="appliedDate">Applied date</option><option value="stage">Stage</option></select></div>
    {candidates.length ? <><div className="table-wrap"><table className="candidate-table"><thead><tr><th scope="col"><input type="checkbox" aria-label="Select all visible candidates" /></th><th scope="col">Candidate</th><th scope="col">Opening</th><th scope="col">Stage</th><th scope="col">Source</th><th scope="col">Updated</th></tr></thead><tbody>{candidates.map((candidate) => <tr key={candidate._id}><td><input type="checkbox" aria-label={`Select ${candidate.candidateName}`} /></td><td><Link className="candidate-table-name" to={`/candidates/${candidate._id}`}>{candidate.candidateName}</Link><span className="candidate-email">{candidate.candidateEmail}</span></td><td><span className="table-muted">{candidate.jobOpening?.title || '—'}</span></td><td><StatusIndicator label={candidate.stage} tone={stageTones[candidate.stage] || 'info'} /></td><td><span className="table-muted">{candidate.source}</span></td><td><span className="table-muted">{relativeDate(candidate.updatedAt)}</span></td></tr>)}</tbody></table></div><div className="pagination"><span>Showing {candidates.length} of {pagination.total}</span><div><button className="secondary-button" type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><span>Page {pagination.page} of {pagination.totalPages || 1}</span><button className="secondary-button" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div></div></> : <EmptyState title="No candidates here yet." description="Try changing your filters or add an application to an open position." />}
  </div>
}

export default CandidatesPage
