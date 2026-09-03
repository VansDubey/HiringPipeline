import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import StatusIndicator from '../components/StatusIndicator'
import { useSession } from '../context/useSession'
import { apiRequest } from '../services/api'

function StalledPage() {
  const { user } = useSession()
  const [alerts, setAlerts] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [dismissing, setDismissing] = useState(null)

  async function loadAlerts() {
    setStatus('loading')
    try {
      const { data } = await apiRequest('/alerts')
      setAlerts(data.data)
      setStatus('ready')
    } catch (requestError) {
      setError(requestError.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    if (user?.role !== 'recruiter') return
    apiRequest('/alerts')
      .then(({ data }) => { setAlerts(data.data); setStatus('ready') })
      .catch((requestError) => { setError(requestError.message); setStatus('error') })
  }, [user?.role])

  async function dismiss(applicationId) {
    if (!window.confirm('Dismiss this alert for the candidate’s current stage?')) return
    setDismissing(applicationId)
    try {
      await apiRequest(`/alerts/${applicationId}/dismiss`, { method: 'POST' })
      setAlerts((current) => current.filter((alert) => alert._id !== applicationId))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDismissing(null)
    }
  }

  if (user?.role !== 'recruiter') return <Navigate replace to="/interviews" />
  if (status === 'loading') return <div className="page route-loading">Loading stalled candidates...</div>

  return <div className="page"><PageHeader eyebrow="Attention" title="Stalled candidates" description="Applications that have remained in the same stage for more than 10 days." />{error && <div className="page-error" role="alert"><strong>Unable to update alerts.</strong><span>{error}</span>{status === 'error' && <button className="secondary-button" type="button" onClick={loadAlerts}>Try again</button>}</div>}{status !== 'error' && (alerts.length ? <div className="stalled-list">{alerts.map((alert) => <article className="stalled-row" key={alert._id}><div className="warning-mark" aria-hidden="true">!</div><div><Link className="candidate-table-name" to={`/candidates/${alert._id}`}>{alert.candidateName}</Link><span className="candidate-email">{alert.candidateEmail}</span></div><div><span className="row-label">Opening</span><strong>{alert.jobOpening?.title}</strong></div><div><span className="row-label">Stage</span><StatusIndicator label={alert.stage} tone="warning" /></div><div><span className="row-label">Time in stage</span><strong>{alert.daysStalled} days</strong></div><div className="row-actions"><Link className="text-link" to={`/candidates/${alert._id}`}>View</Link><button className="text-button warning-text" type="button" disabled={dismissing === alert._id} onClick={() => dismiss(alert._id)}>{dismissing === alert._id ? 'Dismissing...' : 'Dismiss'}</button></div></article>)}</div> : <EmptyState title="No stalled candidates." description="Everyone in the active pipeline has moved within the last 10 days." />)}</div>
}

export default StalledPage
