-- Update service orders table to use TEXT for id instead of UUID
-- This allows us to use simple numeric IDs like "762" instead of UUIDs

-- First, create the new table structure
CREATE TABLE IF NOT EXISTS service_orders_public_st847291_new (
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

-- Enable RLS on new table
ALTER TABLE service_orders_public_st847291_new ENABLE ROW LEVEL SECURITY;

-- Create policies for the new table (public access since we're not using auth)
CREATE POLICY "Allow all operations on service orders" ON service_orders_public_st847291_new
FOR ALL USING (true) WITH CHECK (true);

-- Create status history table with TEXT foreign key
CREATE TABLE IF NOT EXISTS status_history_public_st847291_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id TEXT NOT NULL REFERENCES service_orders_public_st847291_new(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new status history table
ALTER TABLE status_history_public_st847291_new ENABLE ROW LEVEL SECURITY;

-- Create policies for status history (public access)
CREATE POLICY "Allow all operations on status history" ON status_history_public_st847291_new
FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_orders_new_status ON service_orders_public_st847291_new(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_new_created_at ON service_orders_public_st847291_new(created_at);
CREATE INDEX IF NOT EXISTS idx_service_orders_new_archived_at ON service_orders_public_st847291_new(archived_at);
CREATE INDEX IF NOT EXISTS idx_status_history_new_service_order_id ON status_history_public_st847291_new(service_order_id);
CREATE INDEX IF NOT EXISTS idx_status_history_new_created_at ON status_history_public_st847291_new(created_at);

-- Drop old tables if they exist (be careful in production!)
DROP TABLE IF EXISTS status_history_public_st847291 CASCADE;
DROP TABLE IF EXISTS service_orders_public_st847291 CASCADE;

-- Rename new tables to the original names
ALTER TABLE service_orders_public_st847291_new RENAME TO service_orders_public_st847291;
ALTER TABLE status_history_public_st847291_new RENAME TO status_history_public_st847291;

-- Rename indexes to match original naming
ALTER INDEX idx_service_orders_new_status RENAME TO idx_service_orders_status;
ALTER INDEX idx_service_orders_new_created_at RENAME TO idx_service_orders_created_at;
ALTER INDEX idx_service_orders_new_archived_at RENAME TO idx_service_orders_archived_at;
ALTER INDEX idx_status_history_new_service_order_id RENAME TO idx_status_history_service_order_id;
ALTER INDEX idx_status_history_new_created_at RENAME TO idx_status_history_created_at;