import { Link, NavLink, Outlet } from 'react-router-dom'
import { Button } from './Button.jsx'
import { useAuth } from '../lib/auth.jsx'
import { useTheme } from '../lib/theme.jsx'

function MktLink({ to, children }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => `mkt-link${isActive ? ' is-active' : ''}`}>
      {children}
    </NavLink>
  )
}

export function MarketingLayout() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="mkt">
      <header className="mkt-head">
        <div className="mkt-head-inner">
          <Link to="/" className="mkt-brand">
            <span className="mkt-mark" aria-hidden="true">
              <span className="mkt-mark-dot" />
              <span className="mkt-mark-dot" />
              <span className="mkt-mark-dot" />
            </span>
            <span className="mkt-brand-text">
              <span className="mkt-brand-title">Sender Studio</span>
              <span className="mkt-brand-sub">WhatsApp + AI</span>
            </span>
          </Link>

          <nav className="mkt-nav">
            <MktLink to="/">Home</MktLink>
            <MktLink to="/about">About</MktLink>
            <MktLink to="/contact">Contact</MktLink>
          </nav>

          <div className="mkt-actions">
            <Button type="button" onClick={toggleTheme} variant="ghost" size="sm">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </Button>
            {user ? (
              <Button as={Link} to="/app" variant="primary" size="sm">
                Dashboard
              </Button>
            ) : (
              <>
                <Button as={Link} to="/login" variant="ghost" size="sm">
                  Sign in
                </Button>
                <Button as={Link} to="/register" variant="primary" size="sm">
                  Create account
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mkt-main">
        <Outlet />
      </main>

      <footer className="mkt-foot">
        <div className="mkt-foot-inner">
          <div className="mkt-foot-left">
            <div className="mkt-foot-title">Sender Studio</div>
            <div className="mkt-foot-sub">Campaigns that feel human, delivered safely.</div>
          </div>
          <div className="mkt-foot-links">
            <Link className="mkt-foot-link" to="/about">
              About
            </Link>
            <Link className="mkt-foot-link" to="/contact">
              Contact
            </Link>
            <a className="mkt-foot-link" href="https://stripe.com" target="_blank" rel="noreferrer">
              Payments
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
