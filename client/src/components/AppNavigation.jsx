import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  ['/dashboard', 'Home'], ['/jobs', 'Jobs'], ['/saved-jobs', 'Saved'], ['/applications', 'Applications'],
  ['/profile', 'Profile'], ['/resume', 'Master CV'], ['/preferences', 'Preferences'], ['/settings/email', 'Gmail'],
]

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
