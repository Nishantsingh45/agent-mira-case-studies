// Stable per-browser anonymous identifier. No auth in this case study.
const KEY = 'agent_mira_user_id'

export function getUserId() {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now())
    localStorage.setItem(KEY, id)
  }
  return id
}
