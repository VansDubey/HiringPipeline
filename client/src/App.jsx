import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import EmptyState from './components/EmptyState'
import KPIStat from './components/KPIStat'
import PageHeader from './components/PageHeader'
import ProtectedRoute from './components/ProtectedRoute'
import StatusIndicator from './components/StatusIndicator'
import LoginPage from './pages/LoginPage'
import './App.css'

const pipeline = [
  { label: 'Applied', count: 28, width: '76%', tone: 'accent' },
  { label: 'Screening', count: 19, width: '54%', tone: 'info' },
  { label: 'Interview', count: 12, width: '36%', tone: 'success' },
  { label: 'Offer', count: 6, width: '20%', tone: 'warning' },
  { label: 'Hired', count: 4, width: '14%', tone: 'success' },
]

const openings = [
  { title: 'Backend Engineer', department: 'Engineering', candidates: 27, interviewing: 8, updated: 'Today' },
  { title: 'Product Designer', department: 'Design', candidates: 18, interviewing: 4, updated: 'Yesterday' },
  { title: 'Customer Success Lead', department: 'Support', candidates: 14, interviewing: 3, updated: '2 days ago' },
]

const candidates = [
  { name: 'Aarushi Sharma', opening: 'Backend Engineer', stage: 'Interview', updated: 'Today' },
  { name: 'Rohan Gupta', opening: 'Product Designer', stage: 'Screening', updated: '2d' },
  { name: 'Vivek Singh', opening: 'Backend Engineer', stage: 'Screening', updated: '12d' },
]

function Dashboard() {
  return (
    <div className="page dashboard-page">
      <PageHeader eyebrow="Wednesday, September 3, 2026" title="Hiring overview" description="A clear view of the work moving through your hiring desk." action={<button className="primary-button" type="button"><span aria-hidden="true">+</span> New opening</button>} />
      <section className="kpi-strip" aria-label="Hiring metrics">
        <KPIStat label="Open positions" value="7" detail="Across 4 departments" />
        <KPIStat label="Active applications" value="84" detail="+12 this month" accent />
        <KPIStat label="Interviews" value="12" detail="Scheduled this week" />
        <KPIStat label="Hires" value="4" detail="This month" />
      </section>
      <div className="dashboard-grid">
        <section className="content-section pipeline-section">
          <div className="section-heading"><div><p className="section-kicker">Funnel</p><h2>Pipeline overview</h2></div><span className="muted-label">84 active</span></div>
          <div className="pipeline-list">{pipeline.map((stage) => <div className="pipeline-row" key={stage.label}><div className="pipeline-label"><span>{stage.label}</span><strong>{stage.count}</strong></div><div className="pipeline-track"><span className={`pipeline-fill ${stage.tone}`} style={{ width: stage.width }} /></div></div>)}</div>
        </section>
        <section className="content-section trend-section">
          <div className="section-heading"><div><p className="section-kicker">Last quarter</p><h2>Applications trend</h2></div><span className="muted-label">Weekly</span></div>
          <div className="trend-chart" aria-label="Applications increased over the last quarter">{[34, 42, 38, 51, 46, 62, 58, 72, 66, 81, 74, 88].map((height, index) => <span className="trend-bar" key={index} style={{ height: `${height}%` }} />)}</div>
          <div className="chart-axis"><span>Jun 15</span><span>Jul 13</span><span>Aug 10</span><span>Sep 3</span></div>
        </section>
      </div>
      <div className="dashboard-grid lower-grid">
        <section className="content-section">
          <div className="section-heading"><div><p className="section-kicker">Hiring</p><h2>Open positions</h2></div><a className="text-link" href="/openings">View all</a></div>
          <div className="opening-list">{openings.map((opening) => <a className="opening-row" href="/openings" key={opening.title}><div><strong>{opening.title}</strong><span>{opening.department}</span></div><div className="opening-stats"><span>{opening.candidates} candidates</span><span>{opening.interviewing} interviewing</span></div><div className="opening-updated"><StatusIndicator label="Open" tone="success" /><span>{opening.updated}</span></div></a>)}</div>
        </section>
        <section className="content-section">
          <div className="section-heading"><div><p className="section-kicker">Activity</p><h2>Recently active</h2></div><a className="text-link" href="/candidates">View all</a></div>
          <div className="candidate-list">{candidates.map((candidate) => <a className="candidate-row" href="/candidates" key={candidate.name}><span className="candidate-avatar">{candidate.name.split(' ').map((part) => part[0]).join('')}</span><span className="candidate-copy"><strong>{candidate.name}</strong><span>{candidate.opening}</span></span><StatusIndicator label={candidate.stage} tone={candidate.stage === 'Interview' ? 'success' : 'info'} /><span className="candidate-time">{candidate.updated}</span></a>)}</div>
        </section>
      </div>
    </div>
  )
}

function PlaceholderPage({ title, description }) {
  return <div className="page"><PageHeader eyebrow="Hiring desk" title={title} description={description} /><EmptyState title="This view is next in line." description="The shell is ready. This workflow will connect to the recruiting API in the next frontend pass." /></div>
}

function App() {
  return <BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route path="/" element={<Dashboard />} /><Route path="/openings" element={<PlaceholderPage title="Open positions" description="Keep every role, team, and candidate count in one place." />} /><Route path="/candidates" element={<PlaceholderPage title="Candidates" description="Search and move through the people in your pipeline." />} /><Route path="/interviews" element={<PlaceholderPage title="My interviews" description="Your assigned conversations, feedback, and follow-ups." />} /><Route path="/stalled" element={<PlaceholderPage title="Stalled candidates" description="Candidates remaining in the same stage for more than 10 days." />} /></Route></Route></Routes></BrowserRouter>
}

export default App
