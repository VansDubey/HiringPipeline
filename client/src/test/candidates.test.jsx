import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CandidatesPage from '../pages/CandidatesPage'
import { SessionContext } from '../context/sessionContext'
import { apiRequest } from '../services/api'

vi.mock('../services/api', () => ({ apiBaseUrl: 'http://localhost/api', apiRequest: vi.fn() }))

const candidate = {
  _id: '507f1f77bcf86cd799439011', candidateName: 'Maya Chen', candidateEmail: 'maya@example.com',
  jobOpening: { _id: 'job-1', title: 'Backend Engineer' }, stage: 'Applied', source: 'Referral',
  updatedAt: new Date().toISOString(),
}

function renderPage() {
  return render(<SessionContext.Provider value={{ user: { role: 'recruiter' } }}><MemoryRouter><CandidatesPage /></MemoryRouter></SessionContext.Provider>)
}

describe('candidate workflows', () => {
  beforeEach(() => {
    apiRequest.mockReset()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    apiRequest.mockImplementation((path) => {
      if (path === '/jobs') return Promise.resolve({ data: [{ _id: 'job-1', title: 'Backend Engineer' }] })
      if (path.startsWith('/applications?')) return Promise.resolve({ data: { data: [candidate], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } } })
      if (path === '/applications/bulk-advance') return Promise.resolve({ data: { summary: { total: 1, succeeded: 1, refused: 0 }, results: [{ applicationId: candidate._id, status: 'succeeded', stage: 'Screening' }] } })
      return Promise.reject(new Error('Unexpected request'))
    })
  })

  it('sends server-side search state and resets the page', async () => {
    renderPage()
    await screen.findByText('Maya Chen')
    fireEvent.change(screen.getByLabelText('Search candidates'), { target: { name: 'search', value: 'maya' } })
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('search=maya')))
  })

  it('selects visible candidates, confirms bulk advance, and reports each result', async () => {
    renderPage()
    await screen.findByText('Maya Chen')
    fireEvent.click(screen.getByLabelText('Select all visible candidates'))
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Advance' }))
    await waitFor(() => expect(window.confirm).toHaveBeenCalled())
    expect(await screen.findByText('Moved to Screening')).toBeInTheDocument()
    expect(apiRequest).toHaveBeenCalledWith('/applications/bulk-advance', expect.objectContaining({ method: 'POST' }))
  })

  it('shows the current result range when moving between pages', async () => {
    apiRequest.mockImplementation((path) => {
      if (path === '/jobs') return Promise.resolve({ data: [] })
      if (path.includes('page=2')) {
        return Promise.resolve({ data: { data: [candidate], pagination: { page: 2, limit: 20, total: 51, totalPages: 3 } } })
      }
      return Promise.resolve({ data: { data: [candidate], pagination: { page: 1, limit: 20, total: 51, totalPages: 3 } } })
    })

    renderPage()
    expect(await screen.findByText('Showing 1–1 of 51')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText('Showing 21–21 of 51')).toBeInTheDocument()
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(expect.stringContaining('page=2')))
  })

  it('renders API failures as an error state', async () => {
    apiRequest.mockImplementation((path) => path === '/jobs' ? Promise.resolve({ data: [] }) : Promise.reject(new Error('Network unavailable')))
    renderPage()
    expect(await screen.findByText('Unable to load candidates.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable')
  })
})
