export default async function handler(req, res) {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) {
    res.status(500).json({ error: 'Missing BACKEND_URL' })
    return
  }

  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path || '')
  if (path === 'billing/webhook') {
    res.status(400).json({ error: 'Webhook must target backend directly' })
    return
  }

  const upstreamUrl = `${backendUrl.replace(/\/+$/, '')}/api/${path}`

  const headers = { ...req.headers }
  delete headers.host
  delete headers.connection
  delete headers['content-length']

  const init = {
    method: req.method,
    headers,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req
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

