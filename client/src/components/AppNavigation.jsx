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

export default function AppNavigation() {
  const { logout } = useAuth(); const location = useLocation(); const navigate = useNavigate(); const [open, setOpen] = useState(false)
  const back = backDestination(location.pathname)
  useEffect(() => { const close = (event) => { if (event.key === 'Escape') setOpen(false) }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [])
  return <><header className="global-nav"><div className="global-nav-start">{back ? <button className="nav-back" onClick={() => navigate(back[0])} aria-label={`Back to ${back[1]}`}>← <span>{back[1]}</span></button> : <Link className="brand-link" to="/dashboard"><span className="logo small">R</span><b>RemoteReady</b></Link>}</div><div className="global-nav-end"><button className="menu-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="app-menu"><span /><span /><span /><b>Menu</b></button></div></header>{open && <><button className="menu-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} /><aside className="app-menu" id="app-menu"><div className="app-menu-head"><div><p className="eyebrow">WORKSPACE</p><h2>RemoteReady</h2></div><button className="menu-close" onClick={() => setOpen(false)} aria-label="Close menu">×</button></div><nav>{links.map(([to, label]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}</nav><button className="menu-signout" onClick={logout}>Sign out</button></aside></>}</>
}
