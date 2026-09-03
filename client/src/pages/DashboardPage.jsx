import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import KPIStat from '../components/KPIStat'
import PageHeader from '../components/PageHeader'
import StatusIndicator from '../components/StatusIndicator'
import { apiRequest } from '../services/api'

const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired']
const stageTones = { Applied: 'info', Screening: 'accent', Interview: 'info', Offer: 'warning', Hired: 'success' }

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date)
}

function relativeDate(value) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [recentApplications, setRecentApplications] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiRequest('/dashboard'),
      apiRequest('/applications?limit=4&sortBy=lastUpdate&sortOrder=desc'),
    ])
      .then(([dashboardResponse, applicationsResponse]) => {
        setDashboard(dashboardResponse.data)
        setRecentApplications(applicationsResponse.data.data)
        setStatus('ready')
      })
      .catch((requestError) => {
        setError(requestError.message)
        setStatus('error')
      })
  }, [])

  if (status === 'loading') {
    return <div className="page route-loading dashboard-loading">Loading hiring overview...</div>
  }

  if (status === 'error') {
    return <div className="page"><PageHeader eyebrow="Hiring desk" title="Hiring overview" description="A clear view of the work moving through your hiring desk." /><div className="page-error" role="alert"><strong>Unable to load the overview.</strong><span>{error}</span><button className="secondary-button" type="button" onClick={() => window.location.reload()}>Try again</button></div></div>
  }

  const metrics = dashboard.headline
  const stageCounts = Object.fromEntries(dashboard.applicationsByStage.map((item) => [item.stage, item.count]))
  const maxStageCount = Math.max(...stages.map((stage) => stageCounts[stage] || 0), 1)
  const weeklyMaximum = Math.max(...dashboard.applicationsByWeek.map((week) => week.count), 1)

  return (
    <div className="page dashboard-page">
      <PageHeader eyebrow={formatDate(new Date())} title="Hiring overview" description="A clear view of the work moving through your hiring desk." action={<Link className="primary-button" to="/openings"><span aria-hidden="true">+</span> New opening</Link>} />
      <section className="kpi-strip" aria-label="Hiring metrics">
        <KPIStat label="Open positions" value={metrics.openPositions} detail="Currently accepting candidates" />
        <KPIStat label="Active applications" value={metrics.activeApplications} detail="Across open positions" accent />
        <KPIStat label="Interviews" value={metrics.interviewsThisWeek} detail="Scheduled this week" />
        <KPIStat label="Hires" value={metrics.hiresThisMonth} detail="This month" />
      </section>
      <div className="dashboard-grid">
        <section className="content-section pipeline-section">
          <div className="section-heading"><div><p className="section-kicker">Funnel</p><h2>Pipeline overview</h2></div><span className="muted-label">{metrics.activeApplications} active</span></div>
          <div className="pipeline-list">{stages.map((stage) => <div className="pipeline-row" key={stage}><div className="pipeline-label"><span>{stage}</span><strong>{stageCounts[stage] || 0}</strong></div><div className="pipeline-track"><span className={`pipeline-fill ${stageTones[stage]}`} style={{ width: `${((stageCounts[stage] || 0) / maxStageCount) * 100}%` }} /></div></div>)}</div>
        </section>
        <section className="content-section trend-section">
          <div className="section-heading"><div><p className="section-kicker">Last quarter</p><h2>Applications trend</h2></div><span className="muted-label">Weekly</span></div>
          {dashboard.applicationsByWeek.some((week) => week.count > 0) ? <><div className="trend-chart" aria-label="Applications received over the last quarter">{dashboard.applicationsByWeek.map((week) => <span className="trend-bar" key={week.weekStart} style={{ height: `${(week.count / weeklyMaximum) * 100}%` }} title={`${week.count} applications`} />)}</div><div className="chart-axis"><span>{new Date(dashboard.applicationsByWeek[0].weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><span>Mid-quarter</span><span>{new Date(dashboard.applicationsByWeek.at(-1).weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div></> : <EmptyState title="No applications yet." description="New applications will appear in the quarterly trend." />}
        </section>
      </div>
      <div className="dashboard-grid lower-grid">
        <section className="content-section">
          <div className="section-heading"><div><p className="section-kicker">Hiring</p><h2>Open positions</h2></div><Link className="text-link" to="/openings">View all</Link></div>
          {dashboard.applicationsByJobOpening.length ? <div className="opening-list">{dashboard.applicationsByJobOpening.map((opening) => <Link className="opening-row" to="/openings" key={opening.jobOpeningId}><div><strong>{opening.title}</strong><span>Active pipeline</span></div><div className="opening-stats"><span>{opening.count} active candidates</span></div><div className="opening-updated"><StatusIndicator label="Open" tone="success" /></div></Link>)}</div> : <EmptyState title="No open positions yet." description="Create an opening to start building your pipeline." action={<Link className="text-link" to="/openings">Add an opening</Link>} />}
        </section>
        <section className="content-section">
          <div className="section-heading"><div><p className="section-kicker">Activity</p><h2>Recently active</h2></div><Link className="text-link" to="/candidates">View all</Link></div>
          {recentApplications.length ? <div className="candidate-list">{recentApplications.map((candidate) => <Link className="candidate-row" to={`/candidates/${candidate._id}`} key={candidate._id}><span className="candidate-avatar">{candidate.candidateName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span className="candidate-copy"><strong>{candidate.candidateName}</strong><span>{candidate.jobOpening?.title || 'Unassigned opening'}</span></span><StatusIndicator label={candidate.stage} tone={stageTones[candidate.stage] || 'info'} /><span className="candidate-time">{relativeDate(candidate.updatedAt)}</span></Link>)}</div> : <EmptyState title="No candidate activity yet." description="Applications will appear here as your team works the pipeline." />}
        </section>
      </div>
    </div>
  )
}

export default DashboardPage
