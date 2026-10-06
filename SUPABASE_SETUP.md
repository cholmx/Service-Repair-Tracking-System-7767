# Supabase Setup for Bolt.new

This ServiceTracker application uses Bolt.new's built-in Supabase database. The database is pre-configured and ready to use!

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

## Order ID System

Unlike traditional databases that use UUIDs, ServiceTracker uses simple 3-digit numbers for easy customer reference.

## Data Backup & Restore

The Settings page includes built-in export/import functionality for data backup and migration.

## Access PINs

The app has two access PINs. They are stored as bcrypt hashes in the `app_pins` table, which the browser cannot read or write. The login screen calls the `verify_pin()` function, which only answers yes or no and locks out guessing after 10 failed attempts in 5 minutes.

1. Apply the migrations (the one that creates this is `20261006130000_pin_verification.sql`).
2. Open the Supabase SQL editor and run the following, with your own values. Do not commit them.

```sql
INSERT INTO app_pins (slot, pin_hash) VALUES
  ('primary',   extensions.crypt('YOUR_FIRST_PIN',  extensions.gen_salt('bf'))),
  ('secondary', extensions.crypt('YOUR_SECOND_PIN', extensions.gen_salt('bf')))
ON CONFLICT (slot) DO UPDATE
  SET pin_hash = EXCLUDED.pin_hash, updated_at = now();
```

Run the same statement again any time you want to change a PIN.
