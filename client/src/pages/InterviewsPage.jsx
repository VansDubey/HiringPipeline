import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import StatusIndicator from '../components/StatusIndicator'
import { useSession } from '../context/useSession'
import { apiRequest } from '../services/api'

function InterviewsPage() {
  const { user } = useSession()
  const [assignments, setAssignments] = useState([])
  const [feedbackById, setFeedbackById] = useState({})
  const [activeId, setActiveId] = useState(null)
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user?.role !== 'interviewer') return
    apiRequest('/applications/my-panel')
      .then(({ data }) => { setAssignments(data.filter((item) => item.application)); setStatus('ready') })
      .catch((error) => { setMessage(error.message); setStatus('error') })
  }, [user?.role])

  async function submitFeedback(event, applicationId) {
    event.preventDefault()
    const feedback = feedbackById[applicationId]?.trim()
    if (!feedback) return
    setActiveId(applicationId)
    setMessage('')
    try {
      await apiRequest(`/applications/${applicationId}/feedback`, { method: 'POST', body: JSON.stringify({ feedback }) })
      setFeedbackById((current) => ({ ...current, [applicationId]: '' }))
      setMessage('Feedback added to the permanent timeline.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setActiveId(null)
    }
  }

  if (user?.role !== 'interviewer') return <Navigate replace to="/" />
  if (status === 'loading') return <div className="page route-loading">Loading your interviews...</div>
  if (status === 'error') return <div className="page"><PageHeader eyebrow="Hiring desk" title="My interviews" /><div className="page-error" role="alert"><strong>Unable to load assignments.</strong><span>{message}</span></div></div>

  return <div className="page"><PageHeader eyebrow="Hiring desk" title="My interviews" description={`${assignments.length} candidate${assignments.length === 1 ? '' : 's'} assigned to your panel.`} />{message && <p className="success-message" role="status">{message}</p>}{assignments.length ? <div className="interview-list">{assignments.map(({ _id, application }) => <article className="interview-card" key={_id}><div className="interview-summary"><div><p className="section-kicker">{application.jobOpening?.title}</p><Link className="interview-name" to={`/candidates/${application._id}`}>{application.candidateName}</Link><span>{application.candidateEmail}</span></div><StatusIndicator label={application.stage} tone={application.stage === 'Rejected' ? 'danger' : 'info'} /></div><form className="inline-feedback" onSubmit={(event) => submitFeedback(event, application._id)}><label htmlFor={`feedback-${application._id}`}>Interview feedback</label><textarea id={`feedback-${application._id}`} rows="3" placeholder="Add evidence-based feedback to the permanent timeline..." value={feedbackById[application._id] || ''} onChange={(event) => setFeedbackById((current) => ({ ...current, [application._id]: event.target.value }))} required /><div><Link className="text-link" to={`/candidates/${application._id}`}>View candidate and timeline</Link><button className="primary-button" type="submit" disabled={activeId === application._id}>{activeId === application._id ? 'Submitting...' : 'Submit feedback'}</button></div></form></article>)}</div> : <EmptyState title="No interviews assigned." description="Candidates will appear here when a recruiter adds you to an interview panel." />}</div>
}

export default InterviewsPage
