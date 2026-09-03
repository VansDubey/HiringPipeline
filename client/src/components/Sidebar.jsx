import { NavLink } from 'react-router-dom'
import { useSession } from '../context/useSession'

const sections = [
  {
    label: 'Overview',
    links: [{ label: 'Dashboard', to: '/' }],
  },
  {
    label: 'Hiring',
    links: [
      { label: 'Openings', to: '/openings', meta: '7' },
      { label: 'Candidates', to: '/candidates' },
      { label: 'My interviews', to: '/interviews' },
    ],
  },
  {
    label: 'Attention',
    links: [{ label: 'Stalled', to: '/stalled', meta: '6', warning: true }],
  },
]

function Sidebar() {
  const { user, signOut } = useSession()

  async function handleSignOut() {
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
                {link.meta && <span className={link.warning ? 'nav-count warning' : 'nav-count'}>{link.meta}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="account-block">
        <div className="avatar">{initials}</div>
        <div className="account-copy">
          <strong>{user?.name || 'Hiring teammate'}</strong>
          <span>{user?.role || 'Account'}</span>
        </div>
        <button className="icon-button" type="button" aria-label="Sign out" onClick={handleSignOut}>...</button>
      </div>
    </aside>
  )
}

export default Sidebar
