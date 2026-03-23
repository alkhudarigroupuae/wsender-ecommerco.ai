import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../lib/api.js'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { Badge } from '../components/Badge.jsx'
import { VoiceRecorder } from '../components/VoiceRecorder.jsx'

export function Campaigns() {
  const [campaignIdea, setCampaignIdea] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [promotionDetails, setPromotionDetails] = useState('')
  const [media, setMedia] = useState(null)
  const [recorderKey, setRecorderKey] = useState(0)
  const fileInputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const [items, setItems] = useState([])

  async function load() {
    const res = await apiFetch('/api/campaigns')
    setItems(res.items || [])
  }

  useEffect(() => {
    load().catch((e) => setError(e.message))
  }, [])

  async function onCreate() {
    try {
      setBusy(true)
      setError(null)
      const form = new FormData()
      form.append('campaignIdea', campaignIdea)
      form.append('productDescription', productDescription)
      form.append('promotionDetails', promotionDetails)
      if (media) form.append('media', media)

      await apiFetch('/api/campaigns', { method: 'POST', body: form })
      setCampaignIdea('')
      setProductDescription('')
      setPromotionDetails('')
      setMedia(null)
      setRecorderKey((k) => k + 1)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <Card
        title="Campaign creator"
        subtitle="Describe your offer and we’ll generate a unique message per contact"
        right={
          <Button
            onClick={onCreate}
            disabled={busy || !campaignIdea || !productDescription || !promotionDetails}
            variant="primary"
            size="sm"
          >
            {busy ? 'Creating…' : 'Create'}
          </Button>
        }
      >
        <div className="form-grid">
          <label className="field">
            <div className="field-label">Campaign idea</div>
            <textarea
              className="input"
              value={campaignIdea}
              onChange={(e) => setCampaignIdea(e.target.value)}
              rows={2}
            />
            <div className="field-hint">What are you selling? Write the main offer in one sentence.</div>
          </label>
          <label className="field">
            <div className="field-label">Product description</div>
            <textarea
              className="input"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              rows={2}
            />
            <div className="field-hint">Add key details and who it’s for. Keep it short and specific.</div>
          </label>
          <label className="field">
            <div className="field-label">Promotion details</div>
            <textarea
              className="input"
              value={promotionDetails}
              onChange={(e) => setPromotionDetails(e.target.value)}
              rows={2}
            />
            <div className="field-hint">Deadline, discount, and what the lead should do next.</div>
          </label>
          <label className="field">
            <div className="field-label">Media (optional)</div>
            <input
              ref={fileInputRef}
              className="file"
              type="file"
              accept="image/*,video/*,audio/*,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] || null
                setMedia(f)
                if (f) setRecorderKey((k) => k + 1)
              }}
            />
            <div className="field-hint">Send media + AI caption as the message.</div>
          </label>

          <VoiceRecorder
            key={recorderKey}
            disabled={busy}
            onRecorded={(file) => {
              setMedia(file)
              if (file && fileInputRef.current) fileInputRef.current.value = ''
            }}
          />
        </div>

        {error && <div className="callout callout-danger">{error}</div>}
      </Card>

      <Card title="Campaigns" subtitle={`${items.length} total`}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Idea</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id}>
                  <td className="cell-strong">{c.campaignIdea}</td>
                  <td>
                    <Badge value={c.status} />
                  </td>
                  <td className="cell-muted">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="cell-actions">
                    <Button as={Link} to={`/app/campaigns/${c._id}`} variant="ghost" size="sm">
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={4} className="cell-muted">
                    No campaigns yet. Create one above.
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
