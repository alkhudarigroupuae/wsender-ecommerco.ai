import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { apiFetch, getAuthToken } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'

function formatDate(v) {
  if (!v) return '—'
  try {
    return new Date(v).toLocaleString()
  } catch {
    return '—'
  }
}

export function Admin() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [contacts, setContacts] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) || null, [users, selectedUserId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setBusy(true)
        setError(null)
        const res = await apiFetch('/api/admin/users')
        if (cancelled) return
        setUsers(res.items || [])
        if (!selectedUserId && res.items?.[0]?.id) setSelectedUserId(res.items[0].id)
      } catch (e) {
        if (cancelled) return
        setError(e.message)
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedUserId])

  useEffect(() => {
    if (!selectedUserId) return
    let cancelled = false
    async function load() {
      try {
        setBusy(true)
        setError(null)
        const [cRes, caRes] = await Promise.all([
          apiFetch(`/api/admin/users/${selectedUserId}/contacts?limit=50&skip=0`),
          apiFetch(`/api/admin/users/${selectedUserId}/campaigns`),
        ])
        if (cancelled) return
        setContacts(cRes.items || [])
        setCampaigns(caRes.items || [])
      } catch (e) {
        if (cancelled) return
        setError(e.message)
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedUserId])

  if (!user?.isAdmin) {
    return (
      <div className="stack">
        <Card title="Admin" subtitle="Access denied">
          <div className="callout callout-danger">This page is only for admins.</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="stack">
      <Card title="Admin" subtitle="View all client accounts">
        {error && <div className="callout callout-danger">{error}</div>}

        <div className="grid-2">
          <div className="panel">
            <div className="panel-title">Clients</div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Contacts</th>
                    <th>Campaigns</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      style={{ cursor: 'pointer', opacity: busy ? 0.8 : 1 }}
                    >
                      <td className="cell-strong">
                        {u.email}
                        <div className="cell-muted">{u.name}</div>
                      </td>
                      <td>{u.plan}</td>
                      <td className="mono">{u.contactsCount}</td>
                      <td className="mono">{u.campaignsCount}</td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr>
                      <td colSpan={4} className="cell-muted">
                        No users yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Selected Client</div>
            <div className="panel-row">
              <div className="panel-k">Email</div>
              <div className="panel-v">{selectedUser?.email || '—'}</div>
            </div>
            <div className="panel-row">
              <div className="panel-k">Name</div>
              <div className="panel-v">{selectedUser?.name || '—'}</div>
            </div>
            <div className="panel-row">
              <div className="panel-k">Created</div>
              <div className="panel-v">{formatDate(selectedUser?.createdAt)}</div>
            </div>
            <div className="panel-row">
              <div className="panel-k">Sent total</div>
              <div className="panel-v mono">{selectedUser?.sentTotal ?? '—'}</div>
            </div>

            <div className="panel-title" style={{ marginTop: 14 }}>
              Latest Contacts (50)
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Company</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c._id}>
                      <td className="cell-strong">{c.name || '—'}</td>
                      <td className="mono">{c.phone}</td>
                      <td>{c.company || '—'}</td>
                    </tr>
                  ))}
                  {!contacts.length && (
                    <tr>
                      <td colSpan={3} className="cell-muted">
                        No contacts.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="panel-title" style={{ marginTop: 14 }}>
              Campaigns
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Idea</th>
                    <th>Status</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c._id}>
                      <td className="cell-strong">{c.campaignIdea}</td>
                      <td>{c.status}</td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const token = getAuthToken()
                              const res = await fetch(`/api/admin/campaigns/${c._id}/report.csv`, {
                                headers: token ? { authorization: `Bearer ${token}` } : {},
                              })
                              if (!res.ok) throw new Error(`Download failed: ${res.status}`)
                              const blob = await res.blob()
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `campaign-${c._id}-report.csv`
                              document.body.appendChild(a)
                              a.click()
                              a.remove()
                              URL.revokeObjectURL(url)
                            } catch (e) {
                              setError(e.message)
                            }
                          }}
                        >
                          CSV
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!campaigns.length && (
                    <tr>
                      <td colSpan={3} className="cell-muted">
                        No campaigns.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
