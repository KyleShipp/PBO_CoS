# Pittsboro Cost of Service

A local, staff/board-facing baseline dashboard for comparing municipal property-tax contribution and allocated service cost for Residential and Nonresidential property.

## Run locally

```bash
npm install
npm run dev
```

## Data status

The initial dashboard is a working model interface with clearly labeled illustrative assumptions. Replace the values in `src/App.tsx` with documented current adopted-budget (including amendments), parcel/GIS, fee, and local activity data. Each service retains its allocation basis, source-status field, evidence quality, gross cost, and direct-revenue offset.

Property-tax contribution versus allocated service cost is not a conclusion about total municipal revenue versus service cost. This version does not allocate sales tax, ABC, franchise, vehicle, or other General Fund revenue.

## Test deployment

The GitHub Pages workflow deploys the production build on pushes to `main` and can be manually run from the Actions tab for testing. In repository Settings, set **Pages > Build and deployment > Source** to **GitHub Actions**.

GitHub Pages publishes a public static site. It cannot securely protect the dashboard with a password: a client-side password prompt would expose both the password and the site assets. Use a private authenticated hosting service if access control is needed.
