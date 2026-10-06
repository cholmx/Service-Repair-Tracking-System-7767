# ServiceTracker

A service order management system for repair shops, built with React and Supabase and hosted on Bolt.

## Features

- **Short order numbers**: 3 digit IDs (101-999) that roll to 4 digits when the shorter range fills up. IDs are assigned by the database, so two devices can never collide.
- **Service orders**: create, track and edit repair orders, several items per intake.
- **Status tracking**: every status change is recorded with notes and a timestamp.
- **Quotes**: prepare a quote, send it for approval, then start work.
- **Parts and labor**: line items with warranty support (warranty lines are free) and a tax rate. Totals are calculated by the database.
- **Print receipts** for customers.
- **Archive**: move finished orders out of the way. Archived orders load only when you open them.
- **Backup and restore**: export everything to JSON, and import it back after a preview and PIN confirmation.
- **Automatic weekly backups**: the database saves a snapshot every Sunday and keeps the last 12. Settings lists them with Download and Restore, and warns if the schedule stops.
- **SCBA repair history**: every SCBA order is flagged, and the shop can look up all the repairs ever done on one unit by serial number. An SCBA's order page shows its other repairs, and the intake form warns when the same serial already has an open order or was repaired in the last 90 days. Other equipment keeps no history.
- **Returning customers**: typing a name or phone on the intake form suggests people from past orders and fills in the rest.
- **Live updates**: changes made on one device show up on the others within a couple of seconds.
- **Works through bad connections**: an offline banner, readable error messages and a Try again button instead of silent failures.
- **PIN access**: two secret PINs checked by a Supabase Edge Function.

## Development

```bash
npm install
npm run dev      # start the app
npm run lint     # eslint
npm test         # unit tests and database tests
npm run test:e2e # browser tests (see below)
npm run build    # production build
```

Create a `.env` with your Supabase project:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Tests

- `npm test` runs the Vitest tests in `tests/`. They include a real in-memory Postgres (PGlite) that applies every file in `supabase/migrations`, so the SQL functions are tested without a Supabase project.
- `npm run test:e2e` runs Playwright browser tests in `e2e/`. They drive the real app against a fake Supabase (`e2e/backend.js`) that stands in for the PIN function, the tables, the order functions and the realtime socket, so they need no database or network. Run `npx playwright install chromium` once first, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an existing Chromium or Chrome.

## Setup

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md). In short: apply the migrations, set the two PIN secrets and deploy the `verify-pin` Edge Function.

## Project structure

- `src/App.jsx` - routes, PIN gate and the shared orders provider
- `src/contexts/ServiceOrdersContext.jsx` - loads orders once and shares them with every page
- `src/hooks/useServiceOrders.js` - read the shared orders and actions
- `src/hooks/useOrderEditor.js` - edit state for the order details page
- `src/hooks/useCustomerSuggestions.js`, `src/hooks/useToasts.js` - customer lookup on the intake form and toast messages
- `src/services/` - Supabase calls (`orderService`, `importService`, `pinService`) and the import file schema
- `src/utils/` - money math in cents (`pricing`) and parts/labor list helpers (`lineItems`)
- `src/pages/` - Dashboard, ItemIntake, TrackingView, ItemDetails, ScbaHistory, Settings
- `src/components/ItemDetails/`, `src/components/Settings/`, `src/components/Tracking/`, `src/components/ScbaHistory/` - the pieces those pages are built from
- `supabase/migrations/` - database schema and functions
- `supabase/functions/verify-pin/` - the PIN check
- `tests/` - Vitest tests
- `e2e/` - Playwright browser tests

## Database

Two tables:

- `service_orders`: customer and item details, `status`, `urgency`, `parts` and `labor` as JSONB arrays, the money columns, and `archived_at`.
- `status_history`: one row per status change, linked to the order, deleted with it.

Writes go through Postgres functions so they are atomic:

| Function | What it does |
| --- | --- |
| `create_service_orders` | Creates one order per item with fresh IDs and the first history row, all or nothing |
| `update_service_order` | Updates only the fields you send and records a history row when the status is set |
| `import_service_orders` | Upserts orders and history from a backup, all or nothing |
| `create_backup` | Saves a manual snapshot (the Back up now button) |

A trigger recomputes `parts_total`, `labor_total`, `subtotal`, `tax` and `total` from the line items on every write, using exact decimal math. The app cannot store totals that disagree with the line items.

### Parts and labor JSON

```json
{ "description": "Replacement Screen", "quantity": 1, "price": 49.99, "isWarranty": false }
{ "description": "Screen Installation", "hours": 2, "rate": 85, "isWarranty": true }
```

Lines with `isWarranty: true` are not charged.

### SCBA repair history

Repair history is kept for SCBAs only. Each order has an `is_scba` flag. Item types are typed freely ("G1 SCBA", "FIREHAWK", "G1 SBCA"), so the flag is guessed from the item type by `looks_like_scba()` (SCBA or the typo SBCA, FireHawk, and the G1 and M7 models), shown as a checkbox on the intake form and the edit screen, and can be corrected on any order. Gas detectors (Altair, Sensit), loose face pieces and cylinders are not guessed to be SCBAs. The same rule is in `src/utils/scba.js`, and a test checks the SQL and JavaScript agree.

Units are matched by `serial_key`, the serial number with only letters and digits in capitals, so `sn-4471`, `SN 4471` and `SN4471` are one unit. One or two stray letters in front of a long serial (at least 8 characters after them, starting with a digit) are ignored too, so `e00401508eae6af7` and `00401508EAE6AF7` match. Short serials such as `SN4471` are left alone. Every order keeps its serial exactly as typed and the history shows it. A repeat repair is an SCBA that returns within 90 days of a finished repair (`REPEAT_WINDOW_DAYS` in `src/utils/serial.js`).

### Backups

`service_order_backups` holds full snapshots in the same JSON format as the Settings export. A `pg_cron` job (`weekly-service-order-backup`, Sundays 09:00 UTC) calls `_create_backup('scheduled')`, which keeps the newest 12 weekly snapshots. Manual snapshots are trimmed separately to the newest 5, so pressing the button can never push out a weekly one. The app can read backups but cannot add, change or delete them, and cannot run the scheduled job.

Backups live in the same Supabase project as the data. They protect against mistakes such as a bad import or a deleted order. To protect against losing the whole project, download one now and then from Settings.

### Live updates

`20261006140000_enable_realtime.sql` adds the two tables to Supabase's `supabase_realtime` publication. The app listens for changes and refetches a second after one arrives. If live updates are not available, the app refreshes every minute and whenever you return to the tab, so the migration is optional.

## Printing

Receipts print with the browser's own print command. `@media print` rules in `src/index.css` hide the app and print only the receipt on a single Letter page. The receipt renders straight into `<body>` (see `PrintReceipt.jsx`) so nothing else takes up space on the page.

## Status workflow

- With a quote: `needs-quote` → `quote-approval` → `in-progress` → `ready` → `completed` → `archived`
- Without a quote: `received` → `in-progress` → `ready` → `completed` → `archived`
- `waiting-parts` can be used during `in-progress`

## Backup and restore

Settings has Export and Import. Import validates the file, shows how many orders are new, how many existing ones would be overwritten and which rows are invalid, and asks for your PIN before writing anything. If the import fails, nothing is changed.

## Security notes

The login PINs are secrets of the `verify-pin` Edge Function. The database tables themselves still allow the public Supabase key full access (see the policies in the first migration), so the PIN protects the app screens, not direct database access. Moving to Supabase Auth and tightening those policies is the next step if the data needs stronger protection.

## Technology

React 18, React Router, TailwindCSS, Framer Motion, Supabase (Postgres and Edge Functions), Zod, Vite, Vitest, ESLint.
