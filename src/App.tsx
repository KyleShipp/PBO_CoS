import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const testingPasscode = 'pittsboro-test'
const accessStorageKey = 'pbo-cos-testing-access'

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

const adoptedBudgetUrl = 'https://pittsboronc.gov/DocumentCenter/View/7671/2026-to-2027-Adopted-Budget'
const taxRate = 0.44
const revenues = {
  propertyTaxes: 8_255_000,
  salesTaxes: 2_540_000,
  licensesAndPermits: 1_366_000,
  chargesForServices: 746_500,
  intergovernmental: 401_800,
  franchiseTaxes: 350_000,
  investmentIncome: 80_000,
  otherTaxes: 36_000,
  other: 25_000,
}
const parcels = {
  residential: { value: 1_120_000_000, acres: 8_900, units: 5_250 },
  nonresidential: { value: 510_000_000, acres: 3_100 },
}

const services: Service[] = [
  { name: 'Police', gross: 2_732_886, offset: 7_500, other: 8, residential: 68, basis: 'Calls for service', source: 'FY 2026–27 adopted budget and ABC law-enforcement allocation; service shares remain assumptions', quality: 'Proxy' },
  { name: 'Fire', gross: 2_121_371, offset: 0, other: 6, residential: 62, basis: 'Incident activity and occupancy risk', source: 'FY 2026–27 adopted budget; allocation shares remain assumptions', quality: 'Proxy' },
  { name: 'Public Works & Streets', gross: 1_768_298, offset: 236_300, other: 7, residential: 56, basis: 'Town-maintained lane miles and activity', source: 'FY 2026–27 adopted budget, Powell Bill, and sidewalk-in-lieu revenues; service shares remain assumptions', quality: 'Proxy' },
  { name: 'Sanitation', gross: 616_000, offset: 600_000, other: 0, residential: 100, basis: 'Residential collection service', source: 'FY 2026–27 adopted budget and tipping/landfill revenue; allocation shares remain assumptions', quality: 'Proxy' },
  { name: 'Planning & Engineering', gross: 1_390_516, offset: 1_366_000, other: 4, residential: 48, basis: 'Development-review workload', source: 'FY 2026–27 Development Services budget and permit/review revenues; service shares remain assumptions', quality: 'Proxy' },
  { name: 'Recreation', gross: 1_190_318, offset: 119_000, other: 3, residential: 88, basis: 'Resident participation', source: 'FY 2026–27 Parks & Recreation budget and recreation-related revenues; service shares remain assumptions', quality: 'Proxy' },
  { name: 'General government & legal', gross: 3_063_349, offset: 0, other: 5, residential: 60, basis: 'Overhead supporting direct services', source: 'FY 2026–27 Administration, Finance, Downtown, Governing Board, and Legal budgets; allocation shares remain assumptions', quality: 'Proxy' },
  { name: 'Debt service', gross: 917_562, offset: 0, other: 5, residential: 55, basis: 'Asset/function attribution pending', source: 'FY 2026–27 adopted budget; allocation shares remain assumptions', quality: 'Proxy' },
]

const totalBudget = services.reduce((total, service) => total + service.gross, 0)
const directRevenue = services.reduce((total, service) => total + service.offset, 0)
const nonPropertyRevenue = totalBudget - revenues.propertyTaxes
const sharedRevenue = nonPropertyRevenue - directRevenue
const costAfterDirectRevenue = totalBudget - directRevenue
const sharedRevenueRate = sharedRevenue / costAfterDirectRevenue
const propertyFundedCost = (service: Service) => (service.gross - service.offset) * (1 - sharedRevenueRate)

const money = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
const decimal = (amount: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(amount)

function App() {
  const [hasAccess, setHasAccess] = useState(() => sessionStorage.getItem(accessStorageKey) === 'granted')
  const [allocations, setAllocations] = useState(() => Object.fromEntries(services.map((service) => [service.name, service.residential])))
  const summary = useMemo(() => {
    const costs = services.reduce(
      (total, service) => {
        const fundedCost = propertyFundedCost(service)
        const residential = fundedCost * (allocations[service.name] / 100)
        return { residential: total.residential + residential, nonresidential: total.nonresidential + fundedCost - residential, other: total.other + fundedCost * (service.other / 100) }
      },
      { residential: 0, nonresidential: 0, other: 0 },
    )
    return {
      ...costs,
      residentialTax: parcels.residential.value * (taxRate / 100),
      nonresidentialTax: parcels.nonresidential.value * (taxRate / 100),
    }
  }, [allocations])

  if (!hasAccess) {
    return <AccessGate onAccess={() => {
      sessionStorage.setItem(accessStorageKey, 'granted')
      setHasAccess(true)
    }} />
  }

  return (
    <main>
      <header>
        <div>
          <p className="eyebrow">Pittsboro, North Carolina</p>
          <h1>Cost of Service</h1>
          <p className="subtitle">A transparent baseline for comparing current Residential and Nonresidential municipal property-tax contribution and allocated service cost.</p>
        </div>
        <div className="status"><span></span> FY 2026–27 original adopted budget baseline</div>
      </header>

      <section className="notice">
        <strong>Important:</strong> Gross costs, revenues, and the $0.44 tax rate come from the <a href={adoptedBudgetUrl}>FY 2026–27 original adopted budget</a>. Revenue attribution is analytical, not a Town cost-allocation policy. Tax-base, parcel, and service-allocation inputs remain assumptions.
      </section>

      <section className="budget-summary">
        <Metric label="Total adopted budget" value={money(totalBudget)} detail="FY 2026–27 General Fund expenditures" />
        <Metric label="Budgeted property taxes" value={money(revenues.propertyTaxes)} detail={`${decimal(revenues.propertyTaxes / totalBudget * 100)}% of adopted revenue`} />
        <Metric label="Other budgeted revenue" value={money(nonPropertyRevenue)} detail="Applied before allocating costs to property taxpayers" />
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
          <p className="eyebrow">Included in payer allocations</p><h2>Other / Tax-exempt</h2>
          <strong>{money(summary.other)}</strong><p>Estimated property-tax-funded service cost attributable to properties that generally produce no municipal property tax. This cost is spread across Residential and Nonresidential payers in the allocated totals above.</p>
          <p className="footnote">The estimated share is set service-by-service and shown here for transparency; it is not added a second time.</p>
        </article>
      </section>

      <section className="revenue-panel panel">
        <div className="section-heading"><div><p className="eyebrow">Adopted revenue mix</p><h2>All General Fund revenue sources</h2><p>Direct-service revenues are assigned where a documented relationship exists. The remaining {money(sharedRevenue)} is distributed proportionally across service costs before Residential and Nonresidential allocation.</p></div><span className="tag">Totals {money(totalBudget)}</span></div>
        <div className="revenue-grid">
          <Revenue label="Property taxes" value={revenues.propertyTaxes} />
          <Revenue label="Sales taxes" value={revenues.salesTaxes} />
          <Revenue label="Licenses & permits" value={revenues.licensesAndPermits} />
          <Revenue label="Charges for services" value={revenues.chargesForServices} />
          <Revenue label="Intergovernmental" value={revenues.intergovernmental} />
          <Revenue label="Franchise taxes" value={revenues.franchiseTaxes} />
          <Revenue label="Investment income" value={revenues.investmentIncome} />
          <Revenue label="Other taxes" value={revenues.otherTaxes} />
          <Revenue label="Other revenue" value={revenues.other} />
        </div>
      </section>

      <section className="details">
        <div className="section-heading"><div><p className="eyebrow">Sensitivity testing</p><h2>Service allocation model</h2><p>Move a slider to test the Residential share of property-tax-funded service cost, including the cost associated with tax-exempt properties. Nonresidential receives the remainder.</p></div><button onClick={() => setAllocations(Object.fromEntries(services.map((service) => [service.name, service.residential])))}>Reset all to calculated</button></div>
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

      <section className="caveats panel"><p className="eyebrow">Read before interpreting</p><h2>Scope and limitations</h2><ul><li>Vacant and under-development parcels may create Planning and Engineering demand before assessed-value growth appears; development-review fees offset some of that work.</li><li>Town, state, and private streets should not be treated as equivalent Town maintenance liabilities. Full lifecycle replacement costs are outside v1.</li><li>Allocations are estimates, and category averages do not establish the fiscal impact of an individual parcel.</li><li>Direct revenue attribution and proportional distribution of shared revenue are analytical choices, not an adopted Town cost-allocation policy.</li><li>FY 2026–27 original adopted expenditures, revenues, and tax rate are sourced; parcel/GIS inputs, allocation shares, adopted amendments, and local activity measures still require documented Town data.</li></ul></section>
    </main>
  )
}

function AccessGate({ onAccess }: { onAccess: () => void }) {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState(false)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (passcode === testingPasscode) {
      onAccess()
      return
    }
    setError(true)
  }

  return (
    <main className="access-page">
      <section className="access-card">
        <p className="eyebrow">Testing access</p>
        <h1>Pittsboro Cost of Service</h1>
        <p>Enter the testing passcode to view the dashboard.</p>
        <form onSubmit={submit}>
          <label htmlFor="passcode">Testing passcode</label>
          <input
            autoFocus
            id="passcode"
            onChange={(event) => {
              setPasscode(event.target.value)
              setError(false)
            }}
            type="password"
            value={passcode}
          />
          {error && <p className="access-error">That passcode did not match.</p>}
          <button type="submit">Enter dashboard</button>
        </form>
        <p className="footnote">This is a convenience gate only, not security. The passcode is included in the public site code and access lasts only for this browser session.</p>
      </section>
    </main>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="metric"><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>
}

function Revenue({ label, value }: { label: string; value: number }) {
  return <div><span>{label}</span><strong>{money(value)}</strong></div>
}

function ServiceCard({ service, allocation, onChange }: { service: Service; allocation: number; onChange: (value: number) => void }) {
  const net = service.gross - service.offset
  const sharedOffset = net * sharedRevenueRate
  const fundedCost = propertyFundedCost(service)
  const residentialCost = fundedCost * allocation / 100
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
        <div><dt>Shared revenue allocation</dt><dd>−{money(sharedOffset)}</dd></div>
        <div><dt>Property-tax-funded cost</dt><dd>{money(fundedCost)}</dd></div>
        <div><dt>Other / tax-exempt share</dt><dd>{service.other}% · {money(fundedCost * service.other / 100)}</dd></div>
      </dl>
      <div className="slider-row">
        <label htmlFor={inputId}>Residential <b>{decimal(allocation)}%</b> <span>· calculated {service.residential}%</span></label>
        <input id={inputId} type="range" min="0" max="100" value={allocation} onChange={(event) => onChange(Number(event.target.value))} />
        <label className="nonres">Nonresidential <b>{decimal(100 - allocation)}%</b></label>
        <button className="reset" onClick={() => onChange(service.residential)}>Reset</button>
      </div>
      <div className="outcomes">
        <span>Residential allocated cost <b>{money(residentialCost)}</b></span>
        <span>Nonresidential allocated cost <b>{money(fundedCost - residentialCost)}</b></span>
      </div>
      <p className="source"><b>Source status:</b> {service.source}. <a href={adoptedBudgetUrl}>View adopted budget</a>.</p>
    </article>
  )
}

function contribution(tax: number, cost: number) {
  const amount = tax - cost
  return `Property-tax contribution ${amount >= 0 ? 'above' : 'below'} allocated cost by ${money(Math.abs(amount))}`
}

export default App
