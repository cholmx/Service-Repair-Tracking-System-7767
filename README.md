# ServiceTracker

A modern service order management system built with React, Supabase, and Tailwind CSS.

## Database Setup

To fix the "invalid input syntax for type uuid" error, you need to create the correct database schema in Supabase:

### 1. Go to Supabase Dashboard
- Open your project at https://supabase.com/dashboard
- Navigate to the SQL Editor

### 2. Run this SQL to create the correct schema:

```sql
-- Drop existing tables completely
DROP TABLE IF EXISTS status_history_public_st847291 CASCADE;
DROP TABLE IF EXISTS service_orders_public_st847291 CASCADE;

-- Create service orders table with TEXT id (not UUID)
CREATE TABLE service_orders_public_st847291 (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  company TEXT,
  item_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal',
  expected_completion DATE,
  status TEXT NOT NULL DEFAULT 'received',
  parts JSONB DEFAULT '[]'::jsonb,
  labor JSONB DEFAULT '[]'::jsonb,
  parts_total NUMERIC(10,2) DEFAULT 0,
  labor_total NUMERIC(10,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS and create policies
ALTER TABLE service_orders_public_st847291 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on service orders" ON service_orders_public_st847291
FOR ALL USING (true) WITH CHECK (true);

-- Create status history table with TEXT foreign key
CREATE TABLE status_history_public_st847291 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id TEXT NOT NULL REFERENCES service_orders_public_st847291(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS and create policies for status history
ALTER TABLE status_history_public_st847291 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on status history" ON status_history_public_st847291
FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_service_orders_status ON service_orders_public_st847291(status);
CREATE INDEX idx_service_orders_created_at ON service_orders_public_st847291(created_at);
CREATE INDEX idx_service_orders_archived_at ON service_orders_public_st847291(archived_at);
CREATE INDEX idx_status_history_service_order_id ON status_history_public_st847291(service_order_id);
CREATE INDEX idx_status_history_created_at ON status_history_public_st847291(created_at);
```

### 3. After running the SQL:
- Refresh your app
- The order IDs will now work correctly as TEXT instead of UUID
- You can create service orders with IDs like "247", "762", etc.

## Key Features

- **Random Order IDs**: Simple 3-digit numbers (101-999) instead of complex UUIDs
- **Service Order Management**: Create, track, and manage service orders
- **Status Tracking**: Real-time status updates with history
- **Parts & Labor**: Add parts and labor costs with automatic calculations
- **Print Receipts**: Professional receipt printing
- **Archive System**: Archive completed orders
- **Responsive Design**: Works on desktop and mobile

## Development

```bash
npm install
npm run dev
```

## Database Schema

The key change is using `TEXT` for the `id` field instead of `UUID`:

- `service_orders_public_st847291.id` → TEXT PRIMARY KEY
- `status_history_public_st847291.service_order_id` → TEXT (references service_orders.id)

This allows the app to use simple numeric IDs like "247" instead of complex UUIDs.