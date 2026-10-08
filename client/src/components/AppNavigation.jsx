import BrandLockup from './BrandLockup'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  ['/dashboard', 'Overview'], ['/planner', 'Action planner'], ['/jobs', 'Explore jobs'], ['/saved-jobs', 'Saved jobs'], ['/applications', 'Applications'],
  ['/profile', 'My profile'], ['/resume', 'Master CV'], ['/preferences', 'Preferences'], ['/settings/email', 'Email connection'],
]

const mobileLinks = [
  ['/dashboard', 'Home'], ['/jobs', 'Jobs'], ['/saved-jobs', 'Saved'], ['/applications', 'Applications'],
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
  return <nav aria-label="Workspace">{links.map(([to, label]) => <NavLink key={to} to={to} onClick={onSelect} className={({ isActive }) => isActive ? 'active' : ''}><span>{label}</span></NavLink>)}</nav>
}

function ThemeButton({ theme, onToggleTheme }) {
  const dark = theme === 'light'
  return <button className="workspace-theme" onClick={onToggleTheme}><span>{dark ? 'Dark mode' : 'Light mode'}</span></button>
}

export default function AppNavigation({ theme, onToggleTheme }) {
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
      <Link className="workspace-wordmark" to="/dashboard" aria-label="ApplyLumo home"><BrandLockup /></Link>
      <p className="workspace-nav-label">Workspace</p>
      <WorkspaceLinks />
      <Link to="/resume" className="sidebar-note"><strong>Your experience.<br />A new perspective.</strong><small>Polish your master CV</small></Link>
      <div className="workspace-footer"><p>Private career workspace</p><ThemeButton theme={theme} onToggleTheme={onToggleTheme} /><button className="workspace-signout" onClick={logout}>Sign out</button></div>
    </aside>
    <header className="global-nav">
      <div className="global-nav-start">
        {back
          ? <button className="nav-back" onClick={() => navigate(back[0])} aria-label={`Back to ${back[1]}`}>Back to <span>{back[1]}</span></button>
          : <Link className="brand-link" to="/dashboard" aria-label="ApplyLumo home"><BrandLockup compact /></Link>}
      </div>
      <div className="global-nav-end"><button className={`menu-toggle ${open ? 'open' : ''}`} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="app-menu" aria-label="Open workspace navigation"><b>Menu</b></button></div>
    </header>
    <nav className="mobile-tabbar" aria-label="Primary navigation">
      {mobileLinks.map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}><span>{label}</span></NavLink>)}
      <button className={open || moreActive ? 'active' : ''} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="app-menu"><span>More</span></button>
    </nav>
    {open && <>
      <button className="menu-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />
      <aside className="app-menu" id="app-menu">
        <div className="app-menu-head"><div><p className="eyebrow">WORKSPACE</p><BrandLockup compact /></div><button className="menu-close" onClick={() => setOpen(false)} aria-label="Close menu">Close</button></div>
        <WorkspaceLinks onSelect={() => setOpen(false)} />
        <div className="menu-footer"><ThemeButton theme={theme} onToggleTheme={onToggleTheme} /><button className="menu-signout" onClick={logout}>Sign out</button></div>
      </aside>
    </>}
  </>
}
