import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ApplicationForm from '../components/ApplicationForm'
import EmptyState from '../components/EmptyState'
import StatusIndicator from '../components/StatusIndicator'
import { useSession } from '../context/useSession'
import { apiRequest } from '../services/api'

const toneByType = { stage_changed: 'info', rejected: 'danger', reinstated: 'success', feedback_submitted: 'accent', application_created: 'neutral' }
const toneByStage = { Applied: 'info', Screening: 'accent', Interview: 'info', Offer: 'warning', Hired: 'success', Rejected: 'danger' }

function CandidateDetailPage() {
  const { id } = useParams()
  const { user } = useSession()
  const [application, setApplication] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [panel, setPanel] = useState([])
  const [feedback, setFeedback] = useState('')
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  async function loadCandidate() {
    const [applicationResponse, timelineResponse, panelResponse] = await Promise.all([
      apiRequest(`/applications/${id}`),
      apiRequest(`/applications/${id}/timeline`),
      apiRequest(`/applications/${id}/panel`),
    ])
    setApplication(applicationResponse.data)
    setTimeline(timelineResponse.data)
    setPanel(panelResponse.data)
    setStatus('ready')
  }

  useEffect(() => {
    let active = true
    Promise.all([
      apiRequest(`/applications/${id}`),
      apiRequest(`/applications/${id}/timeline`),
      apiRequest(`/applications/${id}/panel`),
    ]).then(([applicationResponse, timelineResponse, panelResponse]) => {
      if (!active) return
      setApplication(applicationResponse.data)
      setTimeline(timelineResponse.data)
      setPanel(panelResponse.data)
      setStatus('ready')
    }).catch((error) => {
      if (!active) return
      setMessage(error.message)
      setStatus('error')
    })
    return () => { active = false }
  }, [id])

  async function updateApplication(form) {
    const response = await apiRequest(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(form),
    })
    setApplication(response.data)
    setIsEditing(false)
    setMessage('Application details updated.')
  }

  async function transition(action) {
    if (!window.confirm(`Are you sure you want to ${action} this application?`)) return
    try {
      setMessage('')
      await apiRequest(`/applications/${id}/${action}`, { method: 'POST' })
      await loadCandidate()
    } catch (error) {
      setMessage(error.message)
    }
  }

  async function submitFeedback(event) {
    event.preventDefault()
    try {
      await apiRequest(`/applications/${id}/feedback`, { method: 'POST', body: JSON.stringify({ feedback }) })
      setFeedback('')
      await loadCandidate()
    } catch (error) {
      setMessage(error.message)
    }
  }

  if (status === 'loading') return <div className="page route-loading">Loading candidate...</div>
  if (status === 'error') return <div className="page page-error" role="alert"><strong>Unable to load candidate.</strong><span>{message}</span><Link className="text-link" to="/candidates">Back to candidates</Link></div>

  const editableApplication = {
    candidateName: application.candidateName,
    candidateEmail: application.candidateEmail,
    source: application.source,
    notes: application.notes || '',
  }

  return <div className="page candidate-detail-page">
    <Link className="back-link" to="/candidates">← Candidates</Link>
    <header className="candidate-detail-header"><div><p className="page-eyebrow">{application.jobOpening?.title}</p><h1>{application.candidateName}</h1><a className="candidate-email-link" href={`mailto:${application.candidateEmail}`}>{application.candidateEmail}</a></div><StatusIndicator label={application.stage} tone={toneByStage[application.stage] || 'info'} /></header>
    {message && <p className="inline-message" role="status">{message}</p>}
    {isEditing && <ApplicationForm initialValue={editableApplication} title={`Edit ${application.candidateName}`} submitLabel="Save changes" onCancel={() => setIsEditing(false)} onSubmit={updateApplication} />}
    <div className="candidate-detail-grid">
      <main className="candidate-main">
        <section className="detail-block"><p className="section-kicker">Application</p><div className="detail-facts"><div><span>Applied via</span><strong>{application.source}</strong></div><div><span>Applied on</span><strong>{new Date(application.createdAt).toLocaleDateString()}</strong></div><div><span>Current stage</span><strong>{application.stage}</strong></div></div></section>
        <section className="detail-block"><p className="section-kicker">Notes</p><p className="notes-copy">{application.notes || 'No notes have been added.'}</p></section>
        <section className="detail-block"><div className="section-heading"><div><p className="section-kicker">Interview panel</p><h2>{panel.length} assigned</h2></div></div>{panel.length ? <div className="panel-list">{panel.map((assignment) => <div className="panel-person" key={assignment._id}><span className="candidate-avatar">{assignment.interviewer.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span><strong>{assignment.interviewer.name}</strong><small>{assignment.interviewer.email}</small></span></div>)}</div> : <p className="notes-copy">No interviewers assigned yet.</p>}</section>
        {user?.role === 'interviewer' && <form className="feedback-form detail-block" onSubmit={submitFeedback}><p className="section-kicker">Interview feedback</p><textarea rows="5" value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Share structured feedback..." required /><button className="primary-button" type="submit">Add feedback</button></form>}
        {user?.role === 'recruiter' && <section className="detail-actions"><button className="secondary-button" type="button" onClick={() => { setMessage(''); setIsEditing(true) }}>Edit application</button><button className="primary-button" type="button" onClick={() => transition(application.stage === 'Rejected' ? 'reinstate' : 'advance')}>{application.stage === 'Rejected' ? 'Reinstate' : 'Advance stage'}</button>{application.stage !== 'Rejected' && <button className="danger-button" type="button" onClick={() => transition('reject')}>Reject</button>}</section>}
      </main>
      <aside className="activity-panel"><div className="section-heading"><div><p className="section-kicker">Permanent record</p><h2>Activity</h2></div></div>{timeline.length ? timeline.map((event) => <article className="activity-item" key={event._id}><div className={`activity-marker ${toneByType[event.type] || 'neutral'}`} /><div><p className="activity-meta">{new Date(event.createdAt).toLocaleDateString()} · {event.performedBy?.name || 'System'}</p><strong>{event.type.replaceAll('_', ' ')}</strong>{event.oldStage && <p>{event.oldStage} → {event.newStage}</p>}{event.feedback && <blockquote>{event.feedback}</blockquote>}</div></article>) : <EmptyState title="No activity yet." description="Application history will appear here." />}</aside>
    </div>
  </div>
}

export default CandidateDetailPage
