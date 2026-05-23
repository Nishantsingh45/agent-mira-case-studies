const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-b-0">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="text-slate-900 font-medium text-sm">{value}</span>
    </div>
  )
}

export default function PropertyCard({ data, accent }) {
  const { address, matched, features, predicted_price } = data
  const isSFH = features.property_type === 'SFH'

  const accentClass = accent === 'higher'
    ? 'ring-2 ring-emerald-400'
    : accent === 'lower'
      ? 'ring-2 ring-slate-200'
      : ''

  return (
    <div className={`bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4 ${accentClass}`}>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400">Address</div>
        <div className="text-lg font-semibold text-slate-900 break-words">{address}</div>
        {!matched && (
          <div className="text-xs text-amber-600 mt-1">Unknown address — showing default property features</div>
        )}
      </div>

      <div className="bg-indigo-50 rounded-xl p-4 text-center">
        <div className="text-xs uppercase tracking-wide text-indigo-700">Predicted Price</div>
        <div className="text-3xl font-bold text-indigo-900 mt-1">{dollars.format(predicted_price)}</div>
      </div>

      <div>
        <Row label="Type" value={features.property_type} />
        {isSFH ? (
          <Row label="Lot Area" value={`${features.lot_area.toLocaleString()} sqft`} />
        ) : (
          <Row label="Building Area" value={`${features.building_area.toLocaleString()} sqft`} />
        )}
        <Row label="Bedrooms" value={features.bedrooms} />
        <Row label="Bathrooms" value={features.bathrooms} />
        <Row label="Year Built" value={features.year_built} />
        <Row label="Pool" value={features.has_pool ? 'Yes' : 'No'} />
        <Row label="Garage" value={features.has_garage ? 'Yes' : 'No'} />
        <Row label="School Rating" value={`${features.school_rating} / 10`} />
      </div>
    </div>
  )
}
