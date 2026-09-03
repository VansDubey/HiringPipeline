import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import EmptyState from './components/EmptyState'
import PageHeader from './components/PageHeader'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CandidatesPage from './pages/CandidatesPage'
import OpeningsPage from './pages/OpeningsPage'
import './App.css'

function PlaceholderPage({ title, description }) {
  return <div className="page"><PageHeader eyebrow="Hiring desk" title={title} description={description} /><EmptyState title="This view is next in line." description="The shell is ready. This workflow will connect to the recruiting API in the next frontend pass." /></div>
}

function App() {
  return <BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route path="/" element={<DashboardPage />} /><Route path="/openings" element={<OpeningsPage />} /><Route path="/openings/:id" element={<PlaceholderPage title="Opening details" description="The opening pipeline view will be added next." />} /><Route path="/candidates" element={<CandidatesPage />} /><Route path="/candidates/:id" element={<PlaceholderPage title="Candidate details" description="The candidate activity view will be added next." />} /><Route path="/interviews" element={<PlaceholderPage title="My interviews" description="Your assigned conversations, feedback, and follow-ups." />} /><Route path="/stalled" element={<PlaceholderPage title="Stalled candidates" description="Candidates remaining in the same stage for more than 10 days." />} /></Route></Route></Routes></BrowserRouter>
}

export default App
