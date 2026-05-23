import { useState } from 'react'
import AddressForm from './components/AddressForm'
import ComparisonView from './components/ComparisonView'
import { compareProperties } from './api'

function App() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCompare(address1, address2) {
    setLoading(true)
    setError('')
    try {
      const data = await compareProperties(address1, address2)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Property Price Comparator</h1>
        <p className="text-slate-500 mt-2">
          Enter two addresses to compare features and estimated prices side-by-side.
        </p>
      </header>

      <AddressForm onCompare={handleCompare} loading={loading} />

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {result && !error && (
        <div className="mt-8">
          <ComparisonView result={result} />
        </div>
      )}

      {!result && !error && !loading && (
        <p className="mt-8 text-center text-slate-400 text-sm">
          Tip: try a sample address from the dropdown suggestions.
        </p>
      )}
    </div>
  )
}

export default App
