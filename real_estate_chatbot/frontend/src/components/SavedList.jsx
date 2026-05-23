const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function SavedList({ saved, onUnsave }) {
  return (
    <aside className="bg-white rounded-2xl shadow-md p-4 h-[70vh] flex flex-col">
      <h2 className="font-semibold text-slate-900 mb-3">Saved properties</h2>
      {saved.length === 0 ? (
        <p className="text-sm text-slate-500">
          No saved properties yet. Tap the heart on any result to save it.
        </p>
      ) : (
        <ul className="space-y-2 overflow-y-auto pr-1">
          {saved.map((p) => (
            <li
              key={p.id}
              className="border border-slate-100 rounded-lg p-2 flex gap-2"
            >
              <img
                src={p.image_url}
                alt=""
                className="w-16 h-16 rounded-md object-cover shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{p.title}</div>
                <div className="text-xs text-slate-500">{p.location}</div>
                <div className="text-xs font-medium text-indigo-700">{dollars.format(p.price)}</div>
              </div>
              <button
                onClick={() => onUnsave(p.id)}
                className="text-rose-500 text-lg leading-none self-start"
                aria-label="Unsave"
                title="Unsave"
              >
                ♥
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
