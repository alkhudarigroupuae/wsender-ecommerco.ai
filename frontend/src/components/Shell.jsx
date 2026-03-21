import { useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'

const TITLES = [
  { prefix: '/app/contacts', title: 'Leads' },
  { prefix: '/app/campaigns', title: 'Campaigns' },
  { prefix: '/app/whatsapp', title: 'WhatsApp' },
  { prefix: '/app/billing', title: 'Billing' },
  { prefix: '/app/settings', title: 'Settings' },
  { prefix: '/app/admin', title: 'Admin' },
  { prefix: '/app', title: 'Workspace' },
]

export function Shell() {
  const location = useLocation()
  const title = useMemo(() => {
    const match = TITLES.find((t) => location.pathname.startsWith(t.prefix))
    return match?.title || 'Dashboard'
  }, [location.pathname])

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <Sidebar />
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <Topbar title={title} />
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
