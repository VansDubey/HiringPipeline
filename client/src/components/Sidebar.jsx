import { NavLink } from 'react-router-dom'

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
        <div className="avatar">VD</div>
        <div className="account-copy">
          <strong>Vanshika</strong>
          <span>Recruiter</span>
        </div>
        <button className="icon-button" type="button" aria-label="Open account menu">...</button>
      </div>
    </aside>
  )
}

export default Sidebar
