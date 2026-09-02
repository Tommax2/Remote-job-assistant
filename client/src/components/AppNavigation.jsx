import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  ['/dashboard', 'Home'], ['/jobs', 'Jobs'], ['/saved-jobs', 'Saved'], ['/applications', 'Applications'],
  ['/profile', 'Profile'], ['/resume', 'Master CV'], ['/preferences', 'Preferences'], ['/settings/email', 'Gmail'],
]

const mobileLinks = [
  ['/dashboard', 'Home', 'home'], ['/jobs', 'Jobs', 'search'], ['/saved-jobs', 'Saved', 'bookmark'], ['/applications', 'Applications', 'briefcase'],
]

function NavIcon({ name }) {
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    bookmark: <path d="M6 3.5h12v17l-6-4-6 4z" />,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V4h6v3M3 12h18M10 12v2h4v-2" /></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>
}

function backDestination(pathname) {
  if (pathname === '/dashboard') return null
  if (pathname === '/jobs' || pathname === '/profile' || pathname === '/resume' || pathname === '/preferences' || pathname === '/settings/email') return ['/dashboard', 'Home']
  if (pathname === '/saved-jobs' || /^\/jobs\//.test(pathname)) return ['/jobs', 'Jobs']
  if (/^\/resumes\//.test(pathname)) return ['/jobs', 'Jobs']
  if (/^\/applications\//.test(pathname)) return ['/applications', 'Applications']
  return ['/dashboard', 'Home']
}

function WorkspaceLinks({ onSelect }) {
  return <nav>{links.map(([to, label]) => <NavLink key={to} to={to} onClick={onSelect} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}</nav>
}

function BrandLockup({ compact = false }) {
  return <span className={`brand-lockup ${compact ? 'compact' : ''}`}><span className="brand-monogram" aria-hidden="true">RR</span><span className="brand-words"><b>RemoteReady</b><small>Career intelligence</small></span></span>
}

export default function AppNavigation() {
  const { logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const back = backDestination(location.pathname)
  const moreActive = !mobileLinks.some(([to]) => location.pathname === to || location.pathname.startsWith(`${to}/`))

  useEffect(() => {
    const close = (event) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  return <>
    <aside className="workspace-sidebar">
      <Link className="workspace-wordmark" to="/dashboard" aria-label="RemoteReady home"><BrandLockup /></Link>
      <p className="workspace-nav-label">Workspace</p>
      <WorkspaceLinks />
      <div className="workspace-footer"><p>Private career workspace</p><button className="workspace-signout" onClick={logout}>Sign out</button></div>
    </aside>
    <header className="global-nav">
      <div className="global-nav-start">
        {back
          ? <button className="nav-back" onClick={() => navigate(back[0])} aria-label={`Back to ${back[1]}`}>← <span>{back[1]}</span></button>
          : <Link className="brand-link" to="/dashboard" aria-label="RemoteReady home"><BrandLockup compact /></Link>}
      </div>
      <div className="global-nav-end"><button className={`menu-toggle ${open ? 'open' : ''}`} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="app-menu" aria-label="Open workspace navigation"><b>Menu</b></button></div>
    </header>
    <nav className="mobile-tabbar" aria-label="Primary navigation">
      {mobileLinks.map(([to, label, icon]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}><NavIcon name={icon} /><span>{label}</span></NavLink>)}
      <button className={open || moreActive ? 'active' : ''} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="app-menu"><NavIcon name="more" /><span>More</span></button>
    </nav>
    {open && <>
      <button className="menu-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />
      <aside className="app-menu" id="app-menu">
        <div className="app-menu-head"><div><p className="eyebrow">WORKSPACE</p><h2>RemoteReady</h2></div><button className="menu-close" onClick={() => setOpen(false)} aria-label="Close menu">Close</button></div>
        <WorkspaceLinks onSelect={() => setOpen(false)} />
        <button className="menu-signout" onClick={logout}>Sign out</button>
      </aside>
    </>}
  </>
}
