const API_BASE = import.meta.env.VITE_API_URL || ''

export async function getConfig() {
  const res = await fetch(`${API_BASE}/api/config`)
  if (!res.ok) throw new Error(`Config failed (${res.status})`)
  return res.json()
}

export async function chatTurn(messages, criteria) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, criteria }),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new Error(detail.error || `Chat failed (${res.status})`)
  }
  return res.json()
}

export async function searchProperties({ location, maxPrice, minBedrooms }) {
  const params = new URLSearchParams()
  if (location) params.set('location', location)
  if (maxPrice != null) params.set('maxPrice', String(maxPrice))
  if (minBedrooms != null) params.set('minBedrooms', String(minBedrooms))
  const res = await fetch(`${API_BASE}/api/properties?${params.toString()}`)
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  return res.json()
}

export async function saveProperty(userId, propertyId) {
  const res = await fetch(`${API_BASE}/api/saved`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, propertyId }),
  })
  if (!res.ok) throw new Error(`Save failed (${res.status})`)
  return res.json()
}

export async function getSaved(userId) {
  const res = await fetch(`${API_BASE}/api/saved/${encodeURIComponent(userId)}`)
  if (!res.ok) throw new Error(`Fetch saved failed (${res.status})`)
  return res.json()
}

export async function unsaveProperty(userId, propertyId) {
  const res = await fetch(`${API_BASE}/api/saved/${encodeURIComponent(userId)}/${propertyId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Unsave failed (${res.status})`)
  return res.json()
}
