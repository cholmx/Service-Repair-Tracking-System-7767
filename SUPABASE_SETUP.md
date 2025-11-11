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
