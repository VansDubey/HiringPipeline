import { useEffect, useState } from 'react'
import { apiRequest } from '../services/api'
import { SessionContext } from './sessionContext'

export function SessionProvider({ children }) {
  const [session, setSession] = useState({ status: 'loading', user: null })

  useEffect(() => {
    apiRequest('/auth/me')
      .then(({ data }) => setSession({ status: 'authenticated', user: data.user }))
      .catch(() => setSession({ status: 'anonymous', user: null }))
  }, [])

  async function signIn(credentials) {
    const { data } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    setSession({ status: 'authenticated', user: data.user })
    return data.user
  }

  async function signOut() {
    await apiRequest('/auth/logout', { method: 'POST' })
    setSession({ status: 'anonymous', user: null })
  }

  return <SessionContext.Provider value={{ ...session, signIn, signOut }}>{children}</SessionContext.Provider>
}

