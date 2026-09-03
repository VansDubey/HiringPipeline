import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CandidatesPage from './pages/CandidatesPage'
import OpeningsPage from './pages/OpeningsPage'
import OpeningDetailPage from './pages/OpeningDetailPage'
import CandidateDetailPage from './pages/CandidateDetailPage'
import InterviewsPage from './pages/InterviewsPage'
import StalledPage from './pages/StalledPage'
import { useSession } from './context/useSession'
import './App.css'

function HomeRoute() {
  const { user } = useSession()
  return user?.role === 'interviewer' ? <Navigate replace to="/interviews" /> : <DashboardPage />
}

function App() {
  return <BrowserRouter><Routes><Route path="/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route path="/" element={<HomeRoute />} /><Route path="/openings" element={<OpeningsPage />} /><Route path="/openings/:id" element={<OpeningDetailPage />} /><Route path="/candidates" element={<CandidatesPage />} /><Route path="/candidates/:id" element={<CandidateDetailPage />} /><Route path="/interviews" element={<InterviewsPage />} /><Route path="/stalled" element={<StalledPage />} /></Route></Route></Routes></BrowserRouter>
}

export default App
