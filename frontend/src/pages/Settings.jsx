import { useEffect, useMemo, useState } from 'react'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import { Badge } from '../components/Badge.jsx'
import { apiFetch } from '../lib/api.js'

function numOrEmpty(v) {
  if (v == null) return ''
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  return String(Math.trunc(n))
}

export function Settings() {
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(null)

  const [aiProvider, setAiProvider] = useState('')
  const [maxPerHour, setMaxPerHour] = useState('')
  const [maxPerMinute, setMaxPerMinute] = useState('')
  const [minDelay, setMinDelay] = useState('')
  const [maxDelay, setMaxDelay] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await apiFetch('/api/settings')
        if (cancelled) return
        setData(res)
        setAiProvider(res.saved?.aiProvider || '')
        setMaxPerHour(numOrEmpty(res.saved?.maxMessagesPerHour))
        setMaxPerMinute(numOrEmpty(res.saved?.maxMessagesPerMinute))
        setMinDelay(numOrEmpty(res.saved?.minDelaySeconds))
        setMaxDelay(numOrEmpty(res.saved?.maxDelaySeconds))
        setSaved(null)
      } catch (e) {
        if (cancelled) return
        setError(e.message)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const canSave = useMemo(() => !busy, [busy])

  async function onSave() {
    try {
      setBusy(true)
      setError(null)
      setSaved(null)

      const res = await apiFetch('/api/settings', {
        method: 'POST',
        body: {
          aiProvider: aiProvider || null,
          maxMessagesPerHour: maxPerHour === '' ? null : Number(maxPerHour),
          maxMessagesPerMinute: maxPerMinute === '' ? null : Number(maxPerMinute),
          minDelaySeconds: minDelay === '' ? null : Number(minDelay),
          maxDelaySeconds: maxDelay === '' ? null : Number(maxDelay),
        },
      })

      setSaved('Saved')
      setData((d) => (d ? { ...d, effective: res.effective } : d))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const providers = data?.providersAvailable || { openai: false, gemini: false, mock: true }

  return (
    <div className="stack">
      <Card title="Settings" subtitle="Control sending speed and AI provider">
        {error && <div className="callout callout-danger">{error}</div>}
        {saved && <div className="callout">{saved}</div>}

        <div className="grid-2">
          <div className="panel">
            <div className="panel-title">AI Provider</div>
            <div className="panel-row">
              <div className="panel-k">Active</div>
              <div className="panel-v">
                <Badge value={data?.effective?.aiProvider || '—'} />
              </div>
            </div>
            <div className="panel-row">
              <div className="panel-k">Select</div>
              <div className="panel-v">
                <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)} className="input">
                  <option value="">Auto (server default)</option>
                  <option value="openai" disabled={!providers.openai}>
                    OpenAI (GPT)
                  </option>
                  <option value="gemini" disabled={!providers.gemini}>
                    Gemini
                  </option>
                  <option value="mock">Mock (test)</option>
                </select>
              </div>
            </div>
            <div className="muted" style={{ marginTop: 10 }}>
              If a provider is disabled, the server is missing its API key.
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Sending Limits</div>

            <div className="panel-row">
              <div className="panel-k">Max / hour</div>
              <div className="panel-v">
                <input
                  className="input"
                  inputMode="numeric"
                  value={maxPerHour}
                  onChange={(e) => setMaxPerHour(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={numOrEmpty(data?.defaults?.maxMessagesPerHour)}
                />
              </div>
            </div>

            <div className="panel-row">
              <div className="panel-k">Max / minute</div>
              <div className="panel-v">
                <input
                  className="input"
                  inputMode="numeric"
                  value={maxPerMinute}
                  onChange={(e) => setMaxPerMinute(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={numOrEmpty(data?.defaults?.maxMessagesPerMinute)}
                />
              </div>
            </div>

            <div className="panel-row">
              <div className="panel-k">Delay min (s)</div>
              <div className="panel-v">
                <input
                  className="input"
                  inputMode="numeric"
                  value={minDelay}
                  onChange={(e) => setMinDelay(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={numOrEmpty(data?.defaults?.minDelaySeconds)}
                />
              </div>
            </div>

            <div className="panel-row">
              <div className="panel-k">Delay max (s)</div>
              <div className="panel-v">
                <input
                  className="input"
                  inputMode="numeric"
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={numOrEmpty(data?.defaults?.maxDelaySeconds)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <Button onClick={onSave} variant="primary" size="sm" disabled={!canSave}>
            Save settings
          </Button>
        </div>
      </Card>
    </div>
  )
}

