import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import StatusIndicator from '../components/StatusIndicator'
import { apiRequest } from '../services/api'

const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']
function daysInStage(value) {
  return Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
}

function OpeningDetailPage() {
  const { id } = useParams()
  const [opening, setOpening] = useState(null)
  const [applications, setApplications] = useState([])
  const [tab, setTab] = useState('Pipeline')
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([apiRequest(`/jobs/${id}`), apiRequest(`/jobs/${id}/applications`)]).then(([openingResponse, applicationsResponse]) => {
      setOpening(openingResponse.data)
      setApplications(applicationsResponse.data)
      setStatus('ready')
    }).catch((requestError) => { setError(requestError.message); setStatus('error') })
  }, [id])

  if (status === 'loading') return <div className="page route-loading">Loading opening...</div>
  if (status === 'error') return <div className="page"><PageHeader eyebrow="Hiring desk" title="Opening unavailable" description={error} /><Link className="text-link" to="/openings">Back to openings</Link></div>

  const grouped = Object.fromEntries(stages.map((stage) => [stage, applications.filter((application) => application.stage === stage)]))
  return <div className="page detail-page"><Link className="back-link" to="/openings">← Open positions</Link><PageHeader eyebrow={opening.department} title={opening.title} description={opening.description} /><div className="detail-tabs">{['Overview', 'Pipeline'].map((item) => <button className={tab === item ? 'detail-tab active' : 'detail-tab'} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</div>{tab === 'Overview' && <section className="detail-overview"><div><p className="section-kicker">Position</p><h2>{opening.title}</h2><p>{opening.description}</p></div><StatusIndicator label={opening.status} tone={opening.status === 'open' ? 'success' : 'warning'} /></section>}{tab === 'Pipeline' && <div className="kanban-board">{stages.map((stage) => <section className="kanban-column" key={stage}><div className="kanban-heading"><h2>{stage}</h2><span>{grouped[stage].length}</span></div>{grouped[stage].map((application) => <Link className="kanban-card" to={`/candidates/${application._id}`} key={application._id}><strong>{application.candidateName}</strong><span>{application.source}</span><small>{daysInStage(application.stageEnteredAt)}d in stage</small></Link>)}{!grouped[stage].length && <p className="column-empty">No candidates</p>}</section>)}</div>}</div>
}

export default OpeningDetailPage
