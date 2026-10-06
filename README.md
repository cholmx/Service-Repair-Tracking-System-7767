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
- **PIN access**: two secret PINs checked by a Supabase Edge Function.

## Development

```bash
npm install
npm run dev      # start the app
npm run lint     # eslint
npm test         # unit tests and database tests
npm run build    # production build
```

Create a `.env` with your Supabase project:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The tests include a real in-memory Postgres (PGlite) that applies every file in `supabase/migrations`, so the SQL functions are tested without a Supabase project.

## Setup

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md). In short: apply the migrations, set the two PIN secrets and deploy the `verify-pin` Edge Function.

## Project structure

- `src/App.jsx` - routes, PIN gate and the shared orders provider
- `src/contexts/ServiceOrdersContext.jsx` - loads orders once and shares them with every page
- `src/hooks/useServiceOrders.js` - read the shared orders and actions
- `src/hooks/useOrderEditor.js` - edit state for the order details page
- `src/services/` - Supabase calls (`orderService`, `importService`, `pinService`) and the import file schema
- `src/utils/` - money math in cents (`pricing`) and parts/labor list helpers (`lineItems`)
- `src/pages/` - Dashboard, ItemIntake, TrackingView, ItemDetails, Settings
- `src/components/ItemDetails/`, `src/components/Settings/` - the pieces those two pages are built from
- `supabase/migrations/` - database schema and functions
- `supabase/functions/verify-pin/` - the PIN check
- `tests/` - Vitest tests

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

A trigger recomputes `parts_total`, `labor_total`, `subtotal`, `tax` and `total` from the line items on every write, using exact decimal math. The app cannot store totals that disagree with the line items.

### Parts and labor JSON

```json
{ "description": "Replacement Screen", "quantity": 1, "price": 49.99, "isWarranty": false }
{ "description": "Screen Installation", "hours": 2, "rate": 85, "isWarranty": true }
```

Lines with `isWarranty: true` are not charged.

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
