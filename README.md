# Bee Keeper

Bee Keeper is a responsive Angular 21 app for recording shared expenses, splitting totals equally in Nigerian naira, and manually tracking each member’s payment status. It stores data in the current browser only; it does not move or verify money.

## Run locally

```sh
npm ci
npm start
```

## Build and tests

```sh
npm run build
npm test
```

## Routes

- `/` — expense list, search, payment filters, and sample data
- `/expenses/new` — create an expense with a live split preview
- `/expenses/:id` — expense details and manual payment status controls
- `/expenses/:id/edit` — edit the saved expense
- Unknown routes and missing expense IDs show recovery links to the dashboard.

## Storage and recovery

The versioned snapshot is stored at `bee-keeper:expenses:v1` in `localStorage`. Currency calculations use integer kobo. Changes are written before the in-memory view changes. If saved data cannot be read or validated, the app preserves it and offers Retry or an explicit reset of Bee Keeper’s key. A reset only removes that key. The prototype supports one browser profile and one active editing tab, without cross-device sync.

## Demo

1. On an empty dashboard, choose **Load sample expenses**.
2. Open **In-Drive** and verify ₦15,000.00 collected (60%); mark another member paid and unpaid.
3. Create a ₦100.00 expense for three people and review the ₦33.34 / ₦33.33 / ₦33.33 preview.
4. Refresh the detail URL, edit an amount or member, then try both cancelling and confirming deletion.

All sample member names are fictitious. The UI includes P1 title search and payment filters. Screenshots and a full browser acceptance-check record should be captured during the final demonstration; no live-device or adoption claims are made by this source handoff.

## Verification record

- Production build: passed (`npm run build`).
- Automated money-rule and snapshot validation tests: 8 passed (`npm test`).
- Browser workflow, keyboard, and 360/768/1440 px checks: pending. The managed browser tools could not connect to the local dev server, so no running-app screenshots are included and A01–A08 are not claimed as verified.
