import { useCallback, useEffect, useState } from 'react'
import ChatWindow from './components/ChatWindow'
import SavedList from './components/SavedList'
import { getSaved, unsaveProperty } from './api'
import { getUserId } from './userId'

function App() {
  const userId = getUserId()
  const [saved, setSaved] = useState([])

  const refreshSaved = useCallback(async () => {
    try {
      const list = await getSaved(userId)
      setSaved(list)
    } catch {
      setSaved([])
    }
  }, [userId])

  useEffect(() => {
    refreshSaved()
  }, [refreshSaved])

  const savedIds = new Set(saved.map((p) => p.id))

  async function handleUnsaveFromSidebar(propertyId) {
    await unsaveProperty(userId, propertyId)
    refreshSaved()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Agent Mira</h1>
        <p className="text-slate-500 mt-1">Chat with Mira to find your next home.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ChatWindow savedIds={savedIds} onSavedChange={refreshSaved} />
        <SavedList saved={saved} onUnsave={handleUnsaveFromSidebar} />
      </div>
    </div>
  )
}

export default App
