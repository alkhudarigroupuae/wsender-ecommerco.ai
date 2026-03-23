/**
 * Vercel Serverless: proxy /api/* → BACKEND_URL/api/*
 * Repo root deploy: use this file. If Vercel Root Directory is `frontend`, use frontend/api/[...path].js (duplicate).
 * Set BACKEND_URL in Vercel — no trailing slash, no /api suffix. Leave VITE_API_BASE_URL unset for same-origin /api.
 */
export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) {
    res.status(500).json({
      error: 'Missing BACKEND_URL',
      hint: 'In Vercel → Environment Variables, set BACKEND_URL to your backend origin (e.g. https://xxx.onrender.com).',
    })
    return
  }

  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path || '')
  if (path === 'billing/webhook') {
    res.status(400).json({ error: 'Webhook must target backend directly' })
    return
  }

  let search = ''
  try {
    const u = new URL(req.url || '/', 'http://localhost')
    search = u.search || ''
  } catch {
    // ignore
  }

  const upstreamUrl = `${backendUrl.replace(/\/+$/, '')}/api/${path}${search}`

  const headers = { ...req.headers }
  delete headers.host
  delete headers.connection
  delete headers['content-length']

  const init = {
    method: req.method,
    headers,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      const { Readable } = await import('node:stream')
      init.body = Readable.toWeb(req)
      init.duplex = 'half'
    } catch {
      init.body = req
    }
  }

  const upstream = await fetch(upstreamUrl, init)

  res.status(upstream.status)
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return
    res.setHeader(key, value)
  })

  const buffer = Buffer.from(await upstream.arrayBuffer())
  res.send(buffer)
}
