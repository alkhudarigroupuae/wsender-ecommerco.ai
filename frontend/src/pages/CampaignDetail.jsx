import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiFetch, getAuthToken } from '../lib/api.js'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { Badge } from '../components/Badge.jsx'

export function CampaignDetail() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [stats, setStats] = useState(null)
  const [report, setReport] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [preview, setPreview] = useState([])

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const [page, setPage] = useState(0)
  const limit = 50
  const skip = page * limit

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        const [cRes, sRes, rRes, lRes] = await Promise.all([
          apiFetch(`/api/campaigns/${id}`),
          apiFetch(`/api/campaigns/${id}/stats`),
          apiFetch(`/api/campaigns/${id}/report`),
          apiFetch(`/api/campaigns/${id}/logs?limit=${limit}&skip=${skip}`),
        ])
        if (cancelled) return
        setCampaign(cRes.item)
        setStats(sRes)
        setReport(rRes)
        setLogs(lRes.items || [])
        setLogsTotal(lRes.total || 0)
      } catch (e) {
        if (cancelled) return
        setError(e.message)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [id, skip])

  const pageCount = useMemo(() => Math.max(1, Math.ceil(logsTotal / limit)), [logsTotal])

  async function onPreview() {
    try {
      setBusy(true)
      setError(null)
      const res = await apiFetch(`/api/campaigns/${id}/preview`, { method: 'POST', body: { count: 5 } })
      setPreview(res.items || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function onStart() {
    try {
      setBusy(true)
      setError(null)
      await apiFetch(`/api/campaigns/${id}/start`, { method: 'POST', body: {} })
      const [cRes, sRes, rRes, lRes] = await Promise.all([
        apiFetch(`/api/campaigns/${id}`),
        apiFetch(`/api/campaigns/${id}/stats`),
        apiFetch(`/api/campaigns/${id}/report`),
        apiFetch(`/api/campaigns/${id}/logs?limit=${limit}&skip=${skip}`),
      ])
      setCampaign(cRes.item)
      setStats(sRes)
      setReport(rRes)
      setLogs(lRes.items || [])
      setLogsTotal(lRes.total || 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function onDownloadCsv() {
    try {
      setBusy(true)
      setError(null)
      const token = getAuthToken()
      const res = await fetch(`/api/campaigns/${id}/report.csv`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`Download failed: ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaign-${id}-report.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="breadcrumbs">
        <Link to="/app/campaigns" className="crumb">
          Campaigns
        </Link>
        <span className="crumb-sep">/</span>
        <span className="crumb">{campaign?.campaignIdea || 'Campaign'}</span>
      </div>

      <div className="grid-2">
        <Card
          title="Campaign"
          subtitle={campaign?.campaignDescription || '—'}
          right={
            <div className="row">
              <Badge value={campaign?.status} />
              <Button onClick={onPreview} variant="ghost" size="sm" disabled={busy}>
                Preview AI
              </Button>
              <Button onClick={onStart} variant="primary" size="sm" disabled={busy}>
                Start sending
              </Button>
            </div>
          }
        >
          <div className="kv">
            <div className="kv-row">
              <div className="kv-k">Idea</div>
              <div className="kv-v">{campaign?.campaignIdea || '—'}</div>
            </div>
            <div className="kv-row">
              <div className="kv-k">Product</div>
              <div className="kv-v">{campaign?.productDescription || '—'}</div>
            </div>
            <div className="kv-row">
              <div className="kv-k">Promo</div>
              <div className="kv-v">{campaign?.promotionDetails || '—'}</div>
            </div>
            <div className="kv-row">
              <div className="kv-k">Media</div>
              <div className="kv-v">
                {campaign?.media ? (
                  <a className="link" href={`/api/media/${campaign.media.filename}`} target="_blank" rel="noreferrer">
                    {campaign.media.originalName}
                  </a>
                ) : (
                  '—'
                )}
              </div>
            </div>
          </div>
          {error && <div className="callout callout-danger">{error}</div>}
        </Card>

        <Card title="Monitor" subtitle="Real-time campaign progress">
          <div className="meter-grid">
            <div className="stat">
              <div className="stat-label">Sent</div>
              <div className="stat-value">{stats?.sent ?? '—'}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Failed</div>
              <div className="stat-value">{stats?.failed ?? '—'}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Queued</div>
              <div className="stat-value">{stats?.queued ?? '—'}</div>
            </div>
          </div>

          {report?.summary && (
            <div className="meter-grid" style={{ marginTop: 12 }}>
              <div className="stat">
                <div className="stat-label">Unique numbers</div>
                <div className="stat-value">{report.summary.uniqueNumbers ?? '—'}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Success rate</div>
                <div className="stat-value">{report.summary.successRate ?? '—'}%</div>
              </div>
              <div className="stat">
                <div className="stat-label">Last sent</div>
                <div className="stat-value">
                  {report.summary.lastSentAt ? new Date(report.summary.lastSentAt).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          )}

          {preview.length > 0 && (
            <div className="preview">
              <div className="preview-title">AI preview</div>
              {preview.map((p) => (
                <div key={p.contactId} className="preview-row">
                  <div className="preview-meta">
                    <div className="cell-strong">{p.name || 'Client'}</div>
                    <div className="cell-muted mono">{p.phone}</div>
                  </div>
                  <div className="preview-msg">{p.message}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Delivery log"
        subtitle={`${logsTotal} total`}
        right={
          <div className="pager">
            <Button variant="ghost" size="sm" onClick={onDownloadCsv} disabled={busy}>
              Download CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0}
            >
              Prev
            </Button>
            <div className="pager-meta">
              Page {page + 1} / {pageCount}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page + 1 >= pageCount}
            >
              Next
            </Button>
          </div>
        }
      >
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Status</th>
                <th>Message</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id}>
                  <td>
                    <div className="cell-strong mono">{l.phone}</div>
                  </td>
                  <td>
                    <Badge value={l.status} />
                  </td>
                  <td className="cell-muted">{l.message}</td>
                  <td className="cell-muted">{new Date(l.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
              {!logs.length && (
                <tr>
                  <td colSpan={4} className="cell-muted">
                    No logs yet. Start sending to populate delivery results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
