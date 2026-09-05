import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useSession } from '../context/useSession'
import { apiRequest } from '../services/api'

function Sidebar() {
  const { user, signOut } = useSession()
  const [stalledCount, setStalledCount] = useState(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef(null)

  useEffect(() => {
    if (user?.role !== 'recruiter') return
    apiRequest('/alerts')
      .then(({ data }) => setStalledCount(data.count))
      .catch(() => setStalledCount(null))
  }, [user?.role])

  useEffect(() => {
    if (!accountMenuOpen) return

    function closeOnOutsideClick(event) {
      if (!accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

  const sections = user?.role === 'interviewer'
    ? [{ label: 'Hiring', links: [{ label: 'My interviews', to: '/interviews' }] }]
    : [
        { label: 'Overview', links: [{ label: 'Dashboard', to: '/' }] },
        { label: 'Hiring', links: [{ label: 'Openings', to: '/openings' }, { label: 'Candidates', to: '/candidates' }] },
        { label: 'Attention', links: [{ label: 'Stalled', to: '/stalled', meta: stalledCount, warning: true }] },
      ]

  async function handleSignOut() {
    setAccountMenuOpen(false)
    try {
      await signOut()
    } finally {
      window.location.assign('/login')
    }
  }

  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'HF'

  return (
    <aside className="sidebar">
      <div className="brand-lockup">
        <span className="brand-mark">H</span>
        <span>Hireflow</span>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {sections.map((section) => (
          <div className="nav-section" key={section.label}>
            <p className="nav-section-label">{section.label}</p>
            {section.links.map((link) => (
              <NavLink
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                key={link.to}
                to={link.to}
              >
                <span>{link.label}</span>
                {link.meta !== null && link.meta !== undefined && <span className={link.warning ? 'nav-count warning' : 'nav-count'}>{link.meta}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="account-block" ref={accountMenuRef}>
        <div className="avatar">{initials}</div>
        <div className="account-copy">
          <strong>{user?.name || 'Hiring teammate'}</strong>
          <span>{user?.role || 'Account'}</span>
        </div>
        <button
          className="icon-button account-menu-trigger"
          type="button"
          aria-label="Open account menu"
          aria-haspopup="menu"
          aria-expanded={accountMenuOpen}
          onClick={() => setAccountMenuOpen((open) => !open)}
        >...</button>
        {accountMenuOpen && (
          <div className="account-menu" role="menu">
            <button type="button" role="menuitem" onClick={handleSignOut}>Log out</button>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
