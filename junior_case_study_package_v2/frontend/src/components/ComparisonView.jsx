import PropertyCard from './PropertyCard'

export default function ComparisonView({ result }) {
  const { property1, property2 } = result
  const p1Higher = property1.predicted_price >= property2.predicted_price
  const diff = Math.abs(property1.predicted_price - property2.predicted_price)
  const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <PropertyCard data={property1} accent={p1Higher ? 'higher' : 'lower'} />
      <PropertyCard data={property2} accent={p1Higher ? 'lower' : 'higher'} />
      <div className="md:col-span-2 text-center text-sm text-slate-500">
        Difference: <span className="font-semibold text-slate-700">{dollars.format(diff)}</span>
      </div>
    </div>
  )
}
