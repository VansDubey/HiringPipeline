import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from '../pages/LoginPage'
import ProtectedRoute from '../components/ProtectedRoute'
import { SessionContext } from '../context/sessionContext'

function withSession(ui, value, initialEntries = ['/']) {
  return render(<SessionContext.Provider value={value}><MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter></SessionContext.Provider>)
}

describe('authentication UI', () => {
  it('redirects anonymous users to login', () => {
    withSession(<Routes><Route element={<ProtectedRoute />}><Route path="/" element={<p>Private workspace</p>} /></Route><Route path="/login" element={<p>Login route</p>} /></Routes>, { status: 'anonymous', user: null })
    expect(screen.getByText('Login route')).toBeInTheDocument()
    expect(screen.queryByText('Private workspace')).not.toBeInTheDocument()
  })

  it('shows a useful sign-in error', async () => {
    const signIn = vi.fn().mockRejectedValue(new Error('Invalid email or password'))
    withSession(<Routes><Route path="/login" element={<LoginPage />} /></Routes>, { status: 'anonymous', user: null, signIn }, ['/login'])
    fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'wrong@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password'))
  })
})
