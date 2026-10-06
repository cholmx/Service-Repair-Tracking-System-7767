# Supabase Setup

ServiceTracker stores its data in Supabase and is hosted on Bolt. Apply the migrations in `supabase/migrations`, then set up the PINs below.

## Database Tables

The application uses two main tables:

### 1. service_orders

Stores all service/repair orders with customer information, item details, pricing, and status.

**Key Columns:**
- `id` (TEXT) - Simple order IDs like "328", "762", etc.
- Customer fields: `customer_name`, `customer_phone`, `customer_email`, `company`
- Item fields: `item_type`, `serial_number`, `quantity`, `description`
- Status tracking: `status`, `urgency`, `expected_completion`
- Pricing: `parts`, `labor`, `parts_total`, `labor_total`, `tax_rate`, `tax`, `subtotal`, `total`
- Timestamps: `created_at`, `updated_at`, `archived_at`

### 2. status_history

Tracks all status changes for complete audit trail.

**Key Columns:**
- `id` (UUID) - Auto-generated unique identifier
- `service_order_id` (TEXT) - Links to service_orders.id
- `status` (TEXT) - The status that was set
- `notes` (TEXT) - Optional notes about the change
- `created_at` (TIMESTAMPTZ) - When the change occurred

## Database functions

The app writes through these functions (created by `20261006120000_order_functions.sql` and `20261006121000_import_function.sql`):

- `create_service_orders(p_order)`: creates the orders for an intake and their first status history rows in one transaction.
- `update_service_order(p_id, p_updates, p_notes)`: applies the fields you send and records a status history row when a status is included.
- `import_service_orders(p_orders)`: upserts a backup file, orders and history together, all or nothing.
- `generate_order_id()`: picks a random unused ID. 3 digits (101-999) first, then 4 digits, then 5.

`20261006140000_enable_realtime.sql` adds `service_orders` and `status_history` to the `supabase_realtime` publication so open screens update when another device makes a change. It is optional; without it the app refreshes every minute instead.

A trigger on `service_orders` recomputes the money columns from `parts`, `labor` and `tax_rate` on every insert and update, so they always agree with the line items.

All migrations are safe to re-run. Apply them in order. The two function migrations must be applied before deploying a version of the app that calls them.

## Data Backup & Restore

The Settings page exports everything to JSON. Import shows a preview (new, overwritten and invalid rows) and asks for your PIN before it writes anything.

## Access PINs

The two access PINs are secrets of the `verify-pin` Edge Function (`supabase/functions/verify-pin`). They are not in the repo, the app bundle or the database. The login screen sends the entered PIN to the function, which answers yes or no.

1. Set the secrets in Supabase (Edge Functions, then Secrets), or from the CLI:

```bash
supabase secrets set PIN_PRIMARY=your-first-pin PIN_SECONDARY=your-second-pin
```

2. Deploy the function (from the CLI, or ask Bolt to deploy the `verify-pin` edge function):

```bash
supabase functions deploy verify-pin
```

To change a PIN, set the secret again. Edge Functions pick up new secrets without a redeploy of the app.
