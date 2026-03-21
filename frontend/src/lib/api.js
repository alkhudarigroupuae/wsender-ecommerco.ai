export function getAuthToken() {
  return localStorage.getItem('auth_token')
}

export function setAuthToken(token) {
  if (!token) localStorage.removeItem('auth_token')
  else localStorage.setItem('auth_token', token)
}

function resolveApiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL
  if (!base) return path
  const s = String(path || '')
  if (!s.startsWith('/')) return s
  return `${String(base).replace(/\/+$/, '')}${s}`
}

export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const init = { method, headers: { ...(headers || {}) } }
  const token = getAuthToken()
  if (token) init.headers.authorization = `Bearer ${token}`

  if (body instanceof FormData) {
    init.body = body
  } else if (body !== undefined) {
    init.headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  const res = await fetch(resolveApiUrl(path), init)
  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      const err = new Error('API returned HTML instead of JSON. Check VITE_API_BASE_URL and backend route.')
      err.status = res.status
      err.data = text.slice(0, 200)
      throw err
    }
  }

  if (!res.ok) {
    const message = data?.error || `Request failed: ${res.status}`
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}
