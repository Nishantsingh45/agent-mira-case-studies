import { useEffect, useState } from 'react'
import { getSampleAddresses } from '../api'

export default function AddressForm({ onCompare, loading }) {
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [samples, setSamples] = useState([])

  useEffect(() => {
    getSampleAddresses().then(setSamples).catch(() => {})
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!address1.trim() || !address2.trim()) return
    onCompare(address1, address2)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
      <div className="flex flex-col gap-1">
        <label htmlFor="addr1" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Property 1 Address</label>
        <input
          id="addr1"
          list="sample-addresses"
          type="text"
          value={address1}
          onChange={(e) => setAddress1(e.target.value)}
          placeholder="e.g. 123 Maple Street, Austin, TX"
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="addr2" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Property 2 Address</label>
        <input
          id="addr2"
          list="sample-addresses"
          type="text"
          value={address2}
          onChange={(e) => setAddress2(e.target.value)}
          placeholder="e.g. 1600 Ocean Drive, Miami, FL"
          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <datalist id="sample-addresses">
        {samples.map((a) => (
          <option key={a} value={a} />
        ))}
      </datalist>
      <button
        type="submit"
        disabled={loading}
        className="self-end px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Comparing...' : 'Compare'}
      </button>
    </form>
  )
}
