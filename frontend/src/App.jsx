import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { Shell } from './components/Shell.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { Contacts } from './pages/Contacts.jsx'
import { Campaigns } from './pages/Campaigns.jsx'
import { CampaignDetail } from './pages/CampaignDetail.jsx'
import { WhatsApp } from './pages/WhatsApp.jsx'
import { Billing } from './pages/Billing.jsx'
import { Settings } from './pages/Settings.jsx'
import { Admin } from './pages/Admin.jsx'
import { Landing } from './pages/Landing.jsx'
import { About } from './pages/About.jsx'
import { Contact } from './pages/Contact.jsx'
import { Login } from './pages/Login.jsx'
import { Register } from './pages/Register.jsx'
import { useAuth } from './lib/auth.jsx'
import { MarketingLayout } from './components/MarketingLayout.jsx'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="boot">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route
        path="/app"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="billing" element={<Billing />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<Admin />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
