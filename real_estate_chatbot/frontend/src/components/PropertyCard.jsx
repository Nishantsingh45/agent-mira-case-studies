const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function PropertyCard({ property, saved, onSave, onUnsave }) {
  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden flex flex-col">
      <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={property.image_url}
          alt={property.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 leading-tight">{property.title}</h3>
          <button
            type="button"
            onClick={() => (saved ? onUnsave(property.id) : onSave(property.id))}
            className={`shrink-0 text-lg leading-none ${saved ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'}`}
            aria-label={saved ? 'Unsave property' : 'Save property'}
            title={saved ? 'Saved' : 'Save'}
          >
            {saved ? '♥' : '♡'}
          </button>
        </div>
        <div className="text-sm text-slate-500">{property.location}</div>
        <div className="text-lg font-bold text-indigo-700">{dollars.format(property.price)}</div>
        <div className="text-xs text-slate-600">
          {property.bedrooms} bd · {property.bathrooms} ba · {property.size_sqft.toLocaleString()} sqft
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {property.amenities?.map((a) => (
            <span key={a} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
