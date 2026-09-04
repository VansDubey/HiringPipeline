import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Sidebar from '../components/Sidebar'
import { SessionContext } from '../context/sessionContext'
import { apiRequest } from '../services/api'

vi.mock('../services/api', () => ({ apiRequest: vi.fn() }))

function renderSidebar(user) {
  return render(<SessionContext.Provider value={{ user, signOut: vi.fn() }}><MemoryRouter><Sidebar /></MemoryRouter></SessionContext.Provider>)
}

describe('role-specific navigation', () => {
  beforeEach(() => apiRequest.mockReset())

  it('shows only assigned-work navigation to interviewers', () => {
    renderSidebar({ name: 'Ivy Interviewer', role: 'interviewer' })
    expect(screen.getByRole('link', { name: 'My interviews' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Openings' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Candidates' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Stalled/ })).not.toBeInTheDocument()
  })

  it('shows recruiter navigation and the live stalled count', async () => {
    apiRequest.mockResolvedValue({ data: { count: 4 } })
    renderSidebar({ name: 'Rae Recruiter', role: 'recruiter' })
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    const stalledLink = screen.getByRole('link', { name: 'Stalled' })
    await waitFor(() => expect(stalledLink).toHaveTextContent('4'))
  })
})
