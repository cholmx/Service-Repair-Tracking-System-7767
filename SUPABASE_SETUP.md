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

## SCBA repair history

`20261007000000_serial_key.sql` adds `serial_key`, a column the database calculates from the serial number. `20261007000100_scba_flag.sql` adds the `is_scba` flag, flags existing orders from their item type once, adds an index for serial lookups, and replaces the order, update and import functions so they carry the flag. Apply them in this order, after the backup migrations. Check the flags afterwards in Settings or on the SCBA History page; anything that was guessed wrong can be changed on the order. Re-running the migration does not undo your corrections.

## Weekly backups

`20261006150000_backups.sql` creates the backup table and functions. `20261006150100_schedule_weekly_backup.sql` schedules the job with `pg_cron` for Sundays at 09:00 UTC (about 4 or 5 in the morning in the US) and keeps the newest 12.

If the second migration stops with "pg_cron is not available", enable the extension (Supabase dashboard, Database, Extensions, pg_cron) and run it again. It is safe to run more than once. To check the job, run `select * from cron.job;`, and to see the results, run `select * from service_order_backups order by created_at desc;`.

The Settings page lists the backups, lets you download or restore one, and warns when no automatic backup has run for more than 8 days. Backups are stored in the same Supabase project as your data, so download one now and then to keep a copy somewhere else.

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
