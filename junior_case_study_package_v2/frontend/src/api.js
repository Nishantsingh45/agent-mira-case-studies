const API_BASE = import.meta.env.VITE_API_URL || ''

export async function getSampleAddresses() {
  const res = await fetch(`${API_BASE}/api/sample-addresses`)
  if (!res.ok) throw new Error(`Failed to load sample addresses (${res.status})`)
  return res.json()
}

export async function compareProperties(address1, address2) {
  const res = await fetch(`${API_BASE}/api/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address1, address2 }),
  })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new Error(detail.detail || `Compare failed (${res.status})`)
  }
  return res.json()
}
