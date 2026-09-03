import { useEffect, useState } from 'react'
import { apiBaseUrl, apiRequest } from './services/api'
import './App.css'

function App() {
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    apiRequest('/health')
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <main className="setup-screen">
      <div className="setup-panel">
        <p className="eyebrow">Hiring Pipeline</p>
        <h1>MERN foundation ready.</h1>
        <p className="intro">
          The React client is connected to the Express API boundary. Feature work starts next with
          authentication and the MongoDB domain models.
        </p>
        <div className="status-row">
          <span className={`status-dot ${apiStatus}`} aria-hidden="true" />
          <span>API {apiStatus}</span>
        </div>
        <code className="api-url">{apiBaseUrl}</code>
      </div>
    </main>
  )
}

export default App
