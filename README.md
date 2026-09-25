# Pittsboro Cost of Service

A local, staff/board-facing baseline dashboard for comparing municipal property-tax contribution and allocated service cost for Residential and Nonresidential property.

## Run locally

```bash
npm install
npm run dev
```

## Data status

The dashboard uses the Town's FY 2026–27 original adopted budget for the $0.44 property-tax rate, $13,800,300 in gross expenditures, and all General Fund revenue sources. Department amounts are grouped into the dashboard's service categories; General government and legal combines Administration, Finance, Downtown, Governing Board, and Legal. Documented direct-service revenues are assigned first, and remaining non-property revenues are distributed proportionally across costs before Residential and Nonresidential allocation. Estimated service costs associated with tax-exempt property are included in, rather than excluded from, payer allocations.

Source: [Town of Pittsboro FY 2026–27 adopted budget](https://pittsboronc.gov/DocumentCenter/View/7671/2026-to-2027-Adopted-Budget)

Revenue attribution and cost allocation are analytical choices rather than an adopted Town policy. Parcel/GIS inputs, service-allocation shares, adopted amendments, and local activity measures remain assumptions or outstanding data needs.

## Test deployment

The GitHub Pages workflow deploys the production build on pushes to `main` and can be manually run from the Actions tab for testing. In repository Settings, set **Pages > Build and deployment > Source** to **GitHub Actions**.

GitHub Pages publishes a public static site. For testing, the dashboard includes a bypassable convenience gate. The initial testing passcode is `pittsboro-test`, configured at the top of `src/App.tsx`; it persists only for the current browser session. It is not security: the passcode and site assets remain publicly available. Use private authenticated hosting if access control is needed.
