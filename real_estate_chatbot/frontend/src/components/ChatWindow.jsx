import { useEffect, useRef, useState } from 'react'
import PropertyCard from './PropertyCard'
import { chatTurn, getConfig, saveProperty, searchProperties, unsaveProperty } from '../api'
import { getUserId } from '../userId'

const PROMPTS = {
  location: "Hi! 👋 I'm Mira. What city or area are you looking in? (e.g. New York, Miami)",
  budget: 'Great. What is your maximum budget in USD? (e.g. 500000)',
  bedrooms: 'And the minimum number of bedrooms?',
}
const GREETING = "Hi! 👋 I'm Mira. Tell me what you're looking for — city, budget, and minimum bedrooms. You can say it all at once or one at a time."

function botMessage(text, extras = {}) {
  return { id: crypto.randomUUID?.() || Math.random(), from: 'bot', text, ...extras }
}
function userMessage(text) {
  return { id: crypto.randomUUID?.() || Math.random(), from: 'user', text }
}

const EMPTY_CRITERIA = { location: null, maxPrice: null, minBedrooms: null }

export default function ChatWindow({ savedIds, onSavedChange }) {
  const userId = getUserId()
  const [nlpEnabled, setNlpEnabled] = useState(false)
  const [messages, setMessages] = useState([botMessage(PROMPTS.location)])
  const [step, setStep] = useState('location') // only used in state-machine mode
  const [criteria, setCriteria] = useState(EMPTY_CRITERIA)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    getConfig()
      .then((cfg) => {
        setNlpEnabled(cfg.nlpEnabled)
        if (cfg.nlpEnabled) {
          setMessages([botMessage(GREETING)])
          setStep('nlp')
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function handleSubmit(e) {
    e.preventDefault()
    const value = input.trim()
    if (!value || loading) return
    setInput('')
    const userMsg = userMessage(value)
    setMessages((m) => [...m, userMsg])

    if (nlpEnabled) {
      await advanceWithNlp(value)
    } else {
      await advanceWithStateMachine(value)
    }
  }

  // ---------- LLM path ----------

  async function advanceWithNlp(latest) {
    setLoading(true)
    try {
      // Build the conversation history for the LLM in OpenAI format.
      // Skip the synthetic property-result and "tip" messages — only send text turns.
      const history = messages
        .filter((m) => typeof m.text === 'string')
        .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }))
      history.push({ role: 'user', content: latest })

      const turn = await chatTurn(history, criteria)
      setCriteria(turn.criteria)
      setMessages((m) => [...m, botMessage(turn.reply)])
      if (turn.ready) {
        if (turn.results && turn.results.length > 0) {
          setMessages((m) => [
            ...m,
            botMessage(`I found ${turn.results.length} match${turn.results.length === 1 ? '' : 'es'}:`, { results: turn.results }),
            botMessage('Tap the heart to save any you like. Want to refine? Just tell me what to change.'),
          ])
        } else if (turn.results) {
          setMessages((m) => [
            ...m,
            botMessage("I couldn't find anything matching that. Try widening your budget or area."),
          ])
        }
      }
    } catch (err) {
      setMessages((m) => [...m, botMessage(`Sorry, something went wrong: ${err.message}`)])
    } finally {
      setLoading(false)
    }
  }

  // ---------- State-machine fallback ----------

  async function advanceWithStateMachine(value) {
    if (step === 'location') {
      setCriteria((c) => ({ ...c, location: value }))
      setStep('budget')
      setMessages((m) => [...m, botMessage(PROMPTS.budget)])
      return
    }
    if (step === 'budget') {
      const n = Number(value.replace(/[$,]/g, ''))
      if (Number.isNaN(n) || n <= 0) {
        setMessages((m) => [...m, botMessage("Hmm, that didn't look like a number. Try again — e.g. 500000.")])
        return
      }
      setCriteria((c) => ({ ...c, maxPrice: n }))
      setStep('bedrooms')
      setMessages((m) => [...m, botMessage(PROMPTS.bedrooms)])
      return
    }
    if (step === 'bedrooms') {
      const n = Number(value)
      if (Number.isNaN(n) || n < 0) {
        setMessages((m) => [...m, botMessage('I need a number for bedrooms — try 1, 2, 3...')])
        return
      }
      const updated = { ...criteria, minBedrooms: n }
      setCriteria(updated)
      setStep('results')
      await runSearch(updated)
      return
    }
    if (step === 'results') {
      restart()
    }
  }

  async function runSearch(c) {
    setLoading(true)
    setMessages((m) => [...m, botMessage('Searching for matches…')])
    try {
      const results = await searchProperties(c)
      if (results.length === 0) {
        setMessages((m) => [
          ...m,
          botMessage("Sorry, I couldn't find anything matching that. Type anything to start a new search."),
        ])
      } else {
        setMessages((m) => [
          ...m,
          botMessage(`I found ${results.length} match${results.length === 1 ? '' : 'es'}:`, { results }),
          botMessage('Tap the heart to save any you like. Type anything to start a new search.'),
        ])
      }
    } catch (err) {
      setMessages((m) => [...m, botMessage(`Search failed: ${err.message}`)])
    } finally {
      setLoading(false)
    }
  }

  // ---------- Shared ----------

  function restart() {
    setCriteria(EMPTY_CRITERIA)
    if (nlpEnabled) {
      setStep('nlp')
      setMessages([botMessage(GREETING)])
    } else {
      setStep('location')
      setMessages([botMessage(PROMPTS.location)])
    }
  }

  async function handleSave(propertyId) {
    await saveProperty(userId, propertyId)
    onSavedChange()
  }
  async function handleUnsave(propertyId) {
    await unsaveProperty(userId, propertyId)
    onSavedChange()
  }

  return (
    <div className="bg-white rounded-2xl shadow-md flex flex-col h-[70vh]">
      <header className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center font-bold">M</span>
          <div>
            <div className="font-semibold text-slate-900">Mira</div>
            <div className="text-xs text-slate-500">
              {nlpEnabled ? 'Real estate assistant · AI mode' : 'Real estate assistant'}
            </div>
          </div>
        </div>
        <button onClick={restart} className="text-xs text-slate-500 hover:text-slate-800 underline">
          Restart
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id}>
            <div className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  m.from === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'
                }`}
              >
                {m.text}
              </div>
            </div>
            {m.results && (
              <div className="grid gap-3 sm:grid-cols-2 mt-3">
                {m.results.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    saved={savedIds.has(p.id)}
                    onSave={handleSave}
                    onUnsave={handleUnsave}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-500 px-3 py-2 rounded-2xl text-sm">…</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={nlpEnabled ? 'Tell Mira what you\'re looking for…' : 'Type your answer…'}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50 hover:bg-indigo-700 transition"
        >
          Send
        </button>
      </form>
    </div>
  )
}
