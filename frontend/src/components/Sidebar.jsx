import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth.jsx'

function Icon({ name }) {
  if (name === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
        <path
          fill="currentColor"
          d="M12 3.2l9 7.1v10.5a1.2 1.2 0 0 1-1.2 1.2h-5.7v-6.6H9.9V22H4.2A1.2 1.2 0 0 1 3 20.8V10.3l9-7.1zm0 2.5L5.4 10.9v9h3.3v-6.6h6.6v6.6h3.3v-9L12 5.7z"
        />
      </svg>
    )
  }
  if (name === 'users') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
        <path
          fill="currentColor"
          d="M16 11.2a4.2 4.2 0 1 0-3.8-6.1A4.2 4.2 0 0 0 16 11.2zm-8 0a3.7 3.7 0 1 0 0-7.4a3.7 3.7 0 0 0 0 7.4zm8 1.6c-2.8 0-8.4 1.4-8.4 4.2v2h16.8v-2c0-2.8-5.6-4.2-8.4-4.2zm-8 0c-2.4 0-7.6 1.2-7.6 3.7V19h6.1v-1.9c0-2.3 1.5-3.7 3.1-4.6c-.7-.2-1.2-.3-1.6-.3z"
        />
      </svg>
    )
  }
  if (name === 'spark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
        <path
          fill="currentColor"
          d="M12 2l1.6 6.1L20 10l-6.4 1.9L12 18l-1.6-6.1L4 10l6.4-1.9L12 2zm7.5 9.6l.9 3.3L24 16l-3.6 1.1l-.9 3.3l-.9-3.3L15 16l3.6-1.1l.9-3.3z"
        />
      </svg>
    )
  }
  if (name === 'wa') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.3A10 10 0 1 0 12 2zm0 18.3c-1.6 0-3.1-.4-4.4-1.2l-.3-.2l-3.1.8l.8-3l-.2-.3A8.3 8.3 0 1 1 12 20.3zm4.6-6.1c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2c-.2.3-.8.9-1 .9s-.4 0-.7-.2a6.9 6.9 0 0 1-2-1.3a7.5 7.5 0 0 1-1.4-1.8c-.1-.3 0-.5.2-.6l.5-.6c.2-.2.2-.4.3-.6c.1-.2 0-.4 0-.6s-.7-1.6-1-2.2c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4c-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.3 3.1a10.7 10.7 0 0 0 4.1 3.7c1.5.6 1.8.5 2.2.5c.4-.1 1.3-.5 1.5-1c.2-.5.2-.9.1-1c-.1-.1-.3-.2-.6-.4z"
        />
      </svg>
    )
  }
  if (name === 'card') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
        <path
          fill="currentColor"
          d="M3.5 6.4A2.9 2.9 0 0 1 6.4 3.5h11.2A2.9 2.9 0 0 1 20.5 6.4v11.2a2.9 2.9 0 0 1-2.9 2.9H6.4a2.9 2.9 0 0 1-2.9-2.9V6.4zm2.9-.9c-.5 0-.9.4-.9.9v1.1h15V6.4c0-.5-.4-.9-.9-.9H6.4zm14 4H5.5v8.1c0 .5.4.9.9.9h11.2c.5 0 .9-.4.9-.9V9.5zm-11 5.2h4.1v1.4H9.4v-1.4z"
        />
      </svg>
    )
  }
  if (name === 'gear') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
        <path
          fill="currentColor"
          d="M19.4 13.5c.04-.5.04-1 0-1.5l2-1.6a.9.9 0 0 0 .2-1.1l-1.9-3.3a.9.9 0 0 0-1.1-.4l-2.4 1a8.4 8.4 0 0 0-1.3-.7l-.4-2.6a.9.9 0 0 0-.9-.8H9.4a.9.9 0 0 0-.9.8l-.4 2.6c-.5.2-.9.4-1.3.7l-2.4-1a.9.9 0 0 0-1.1.4L1.4 9.3a.9.9 0 0 0 .2 1.1l2 1.6c-.04.5-.04 1 0 1.5l-2 1.6a.9.9 0 0 0-.2 1.1l1.9 3.3c.2.4.7.6 1.1.4l2.4-1c.4.3.8.5 1.3.7l.4 2.6c.1.4.4.8.9.8h3.2c.4 0 .8-.3.9-.8l.4-2.6c.5-.2.9-.4 1.3-.7l2.4 1c.4.2.9 0 1.1-.4l1.9-3.3a.9.9 0 0 0-.2-1.1l-2-1.6zM11 15.8a3.8 3.8 0 1 1 0-7.6a3.8 3.8 0 0 1 0 7.6z"
        />
      </svg>
    )
  }
  return null
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/app'}
      className={({ isActive }) => `nav-item${isActive ? ' is-active' : ''}`}
    >
      <Icon name={icon} />
      <span className="nav-label">{label}</span>
      <span className="nav-glow" aria-hidden="true" />
    </NavLink>
  )
}

export function Sidebar() {
  const { user } = useAuth()

  return (
    <div className="rail">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <span className="brand-dot" />
          <span className="brand-dot" />
          <span className="brand-dot" />
        </div>
        <div className="brand-text">
          <div className="brand-title">Sender Studio</div>
          <div className="brand-sub">Ads + Sales</div>
        </div>
      </div>

      <nav className="nav">
        <NavItem to="/app" icon="home" label="Workspace" />
        <NavItem to="/app/contacts" icon="users" label="Leads" />
        <NavItem to="/app/campaigns" icon="spark" label="Campaigns" />
        <NavItem to="/app/whatsapp" icon="wa" label="WhatsApp" />
        <NavItem to="/app/billing" icon="card" label="Billing" />
        <NavItem to="/app/settings" icon="gear" label="Settings" />
        {user?.isAdmin && <NavItem to="/app/admin" icon="gear" label="Admin" />}
      </nav>

      <div className="rail-foot">
        <div className="foot-chip">
          <span className="chip-dot" />
          <span className="chip-text">Queue + rate limit enabled</span>
        </div>
      </div>
    </div>
  )
}
