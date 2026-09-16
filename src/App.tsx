import { useMemo, useState } from 'react'
import './App.css'

type Evidence = 'Measured' | 'Proxy' | 'Assumption'
type Service = {
  name: string
  gross: number
  offset: number
  other: number
  residential: number
  basis: string
  source: string
  quality: Evidence
}

// Illustrative municipal property-tax rate in dollars per $100 assessed value; replace with adopted rate.
const taxRate = 0.3325
const parcels = {
  residential: { value: 1_120_000_000, acres: 8_900, units: 5_250 },
  nonresidential: { value: 510_000_000, acres: 3_100 },
}

const services: Service[] = [
  { name: 'Police', gross: 3_400_000, offset: 45_000, other: 8, residential: 68, basis: 'Calls for service', source: 'Replace with FY adopted budget and Police presentation', quality: 'Assumption' },
  { name: 'Fire', gross: 2_250_000, offset: 20_000, other: 6, residential: 62, basis: 'Incident activity and occupancy risk', source: 'Replace with FY adopted budget and Fire presentation', quality: 'Assumption' },
  { name: 'Public Works & Streets', gross: 1_550_000, offset: 95_000, other: 7, residential: 56, basis: 'Town-maintained lane miles and activity', source: 'Replace with adopted budget and GIS street inventory', quality: 'Assumption' },
  { name: 'Sanitation', gross: 780_000, offset: 280_000, other: 0, residential: 100, basis: 'Residential collection service', source: 'Replace with sanitation budget and solid-waste fee schedule', quality: 'Assumption' },
  { name: 'Planning & Engineering', gross: 1_180_000, offset: 390_000, other: 4, residential: 48, basis: 'Development-review workload', source: 'Replace with adopted budget and permit/review fee records', quality: 'Assumption' },
  { name: 'Recreation', gross: 620_000, offset: 70_000, other: 3, residential: 88, basis: 'Resident participation', source: 'Replace with adopted budget and participation data', quality: 'Assumption' },
  { name: 'General government & legal', gross: 1_100_000, offset: 0, other: 5, residential: 60, basis: 'Overhead supporting direct services', source: 'Replace with adopted budget', quality: 'Assumption' },
  { name: 'Debt service', gross: 930_000, offset: 0, other: 5, residential: 55, basis: 'Asset/function attribution pending', source: 'Replace with adopted budget and debt schedule', quality: 'Assumption' },
]

const money = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
const decimal = (amount: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(amount)

function App() {
  const [allocations, setAllocations] = useState(() => Object.fromEntries(services.map((service) => [service.name, service.residential])))
  const summary = useMemo(() => {
    const costs = services.reduce(
      (total, service) => {
        const net = service.gross - service.offset
        const taxable = net * (1 - service.other / 100)
        const residential = taxable * (allocations[service.name] / 100)
        return { residential: total.residential + residential, nonresidential: total.nonresidential + taxable - residential, other: total.other + net * (service.other / 100) }
      },
      { residential: 0, nonresidential: 0, other: 0 },
    )
    return {
      ...costs,
      residentialTax: parcels.residential.value * (taxRate / 100),
      nonresidentialTax: parcels.nonresidential.value * (taxRate / 100),
    }
  }, [allocations])

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">Pittsboro, North Carolina</p>
          <h1>Cost of Service</h1>
          <p className="subtitle">A transparent baseline for comparing current Residential and Nonresidential municipal property-tax contribution and allocated service cost.</p>
        </div>
        <div className="status"><span></span> Illustrative baseline — replace assumptions with Town source data</div>
      </header>

      <section className="notice">
        <strong>Important:</strong> Property-tax contribution versus allocated service cost is not total municipal revenue versus service cost. Sales taxes, ABC revenue, franchise-related revenue, vehicle taxes, and other General Fund revenues are not allocated in this version.
      </section>

      <section className="headline">
        <Metric label="Residential property tax" value={money(summary.residentialTax)} detail={`${money(summary.residentialTax / parcels.residential.units)} per dwelling unit`} />
        <Metric label="Residential allocated cost" value={money(summary.residential)} detail={contribution(summary.residentialTax, summary.residential)} />
        <Metric label="Nonresidential property tax" value={money(summary.nonresidentialTax)} detail={`${money(summary.nonresidentialTax / parcels.nonresidential.acres)} per acre`} />
        <Metric label="Nonresidential allocated cost" value={money(summary.nonresidential)} detail={contribution(summary.nonresidentialTax, summary.nonresidential)} />
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-heading"><div><p className="eyebrow">Tax-base productivity</p><h2>Value per acre</h2></div><span className="tag">Calculated</span></div>
          <div className="productivity">
            <div><b>Residential</b><strong>{money(parcels.residential.value / parcels.residential.acres)}</strong><small>assessed value / acre</small><strong>{money(summary.residentialTax / parcels.residential.acres)}</strong><small>property tax / acre</small></div>
            <div><b>Nonresidential</b><strong>{money(parcels.nonresidential.value / parcels.nonresidential.acres)}</strong><small>assessed value / acre</small><strong>{money(summary.nonresidentialTax / parcels.nonresidential.acres)}</strong><small>property tax / acre</small></div>
          </div>
          <p className="footnote">Value per acre measures land/tax-base productivity, not complete fiscal impact.</p>
        </article>
        <article className="panel other">
          <p className="eyebrow">Separate from taxable comparison</p><h2>Other / Tax-exempt</h2>
          <strong>{money(summary.other)}</strong><p>Estimated service cost. These properties are modeled separately because they generally produce no municipal property tax.</p>
          <p className="footnote">Other share is set service-by-service before the Residential / Nonresidential split.</p>
        </article>
      </section>

      <section className="details">
        <div className="section-heading"><div><p className="eyebrow">Sensitivity testing</p><h2>Service allocation model</h2><p>Move a slider to test the Residential share of the remaining taxable service cost. Nonresidential receives the remainder.</p></div><button onClick={() => setAllocations(Object.fromEntries(services.map((service) => [service.name, service.residential])))}>Reset all to calculated</button></div>
        <div className="service-list">
          {services.map((service) => (
            <ServiceCard
              key={service.name}
              service={service}
              allocation={allocations[service.name]}
              onChange={(value) => setAllocations({ ...allocations, [service.name]: value })}
            />
          ))}
        </div>
      </section>

      <section className="caveats panel"><p className="eyebrow">Read before interpreting</p><h2>Scope and limitations</h2><ul><li>Vacant and under-development parcels may create Planning and Engineering demand before assessed-value growth appears; development-review fees offset some of that work.</li><li>Town, state, and private streets should not be treated as equivalent Town maintenance liabilities. Full lifecycle replacement costs are outside v1.</li><li>Allocations are estimates, and category averages do not establish the fiscal impact of an individual parcel.</li><li>All illustrative inputs above must be replaced with current adopted-budget figures, adopted amendments, parcel/GIS data, and documented local activity measures.</li></ul></section>
    </main>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="metric"><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>
}

function ServiceCard({ service, allocation, onChange }: { service: Service; allocation: number; onChange: (value: number) => void }) {
  const net = service.gross - service.offset
  const taxable = net * (1 - service.other / 100)
  const residentialCost = taxable * allocation / 100
  const inputId = `allocation-${service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

  return (
    <article className="service">
      <div className="service-top">
        <div><h3>{service.name}</h3><p>{service.basis}</p></div>
        <span className={`quality ${service.quality.toLowerCase()}`}>{service.quality}</span>
      </div>
      <dl>
        <div><dt>Gross budgeted cost</dt><dd>{money(service.gross)}</dd></div>
        <div><dt>Direct revenue offsets</dt><dd>−{money(service.offset)}</dd></div>
        <div><dt>Net service cost</dt><dd>{money(net)}</dd></div>
        <div><dt>Other / tax-exempt share</dt><dd>{service.other}%</dd></div>
      </dl>
      <div className="slider-row">
        <label htmlFor={inputId}>Residential <b>{decimal(allocation)}%</b> <span>· calculated {service.residential}%</span></label>
        <input id={inputId} type="range" min="0" max="100" value={allocation} onChange={(event) => onChange(Number(event.target.value))} />
        <label className="nonres">Nonresidential <b>{decimal(100 - allocation)}%</b></label>
        <button className="reset" onClick={() => onChange(service.residential)}>Reset</button>
      </div>
      <div className="outcomes">
        <span>Residential allocated cost <b>{money(residentialCost)}</b></span>
        <span>Nonresidential allocated cost <b>{money(taxable - residentialCost)}</b></span>
      </div>
      <p className="source"><b>Source status:</b> {service.source}</p>
    </article>
  )
}

function contribution(tax: number, cost: number) {
  const amount = tax - cost
  return `Property-tax contribution ${amount >= 0 ? 'above' : 'below'} allocated cost by ${money(Math.abs(amount))}`
}

export default App
