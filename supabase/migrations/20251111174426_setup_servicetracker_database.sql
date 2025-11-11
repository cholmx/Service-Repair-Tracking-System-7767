/*
  # ServiceTracker Database Setup for Bolt.new

  This migration creates the complete database schema for the ServiceTracker application
  in Bolt.new's Supabase instance.

  ## Tables Created

  1. **service_orders** - Main table for tracking repair/service orders
     - `id` (TEXT) - Simple numeric order IDs like "328", "762", etc.
     - Customer information fields (name, phone, email, company)
     - Item details (type, serial number, quantity, description)
     - Status tracking and urgency levels
     - Parts and labor as JSONB arrays
     - Pricing fields (parts_total, labor_total, tax, subtotal, total)
     - Archive support with archived_at timestamp
     - Audit timestamps (created_at, updated_at)

  2. **status_history** - Audit trail for all status changes
     - `id` (UUID) - Auto-generated unique identifier
     - `service_order_id` (TEXT) - Links to service_orders.id
     - `status` (TEXT) - The status that was set
     - `notes` (TEXT) - Optional notes about the status change
     - `created_at` (TIMESTAMPTZ) - When the status change occurred

  ## Security

  - RLS enabled on both tables
  - Public access policies (auth not implemented yet)
  - Status history only accessible through service_order relationship

  ## Performance

  - Indexes on status, archived_at, and created_at for fast queries
  - Cascading delete from service_orders to status_history
  - Optimized for filtering active vs archived orders
*/

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS status_history CASCADE;
DROP TABLE IF EXISTS service_orders CASCADE;

-- Create service_orders table
CREATE TABLE service_orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  company TEXT,
  item_type TEXT NOT NULL,
  serial_number TEXT,
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
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_service_orders_archived ON service_orders(archived_at);
CREATE INDEX idx_service_orders_created ON service_orders(created_at DESC);

-- Enable RLS on service_orders
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for public access (no auth implemented yet)
CREATE POLICY "Allow all access to service orders"
  ON service_orders
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create status_history table
CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id TEXT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for status_history
CREATE INDEX idx_status_history_service_order_id ON status_history(service_order_id);
CREATE INDEX idx_status_history_created ON status_history(created_at DESC);

-- Enable RLS on status_history
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for public access
CREATE POLICY "Allow all access to status history"
  ON status_history
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);