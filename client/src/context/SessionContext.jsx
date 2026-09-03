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

  return <SessionContext.Provider value={{ ...session, setSession }}>{children}</SessionContext.Provider>
}

