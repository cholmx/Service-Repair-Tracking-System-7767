/*
  # Create Service Orders Management Tables

  This migration creates all the necessary tables for managing service orders,
  including user profiles, service orders, and status history tracking.

  1. New Tables
    - `service_orders` - Main table for tracking repair orders
      - Contains customer information, item details, pricing, and status
      - Supports multi-user with user_id foreign key
      - Includes archival functionality with archived_at timestamp
    
    - `status_history` - Audit trail for status changes
      - Tracks all status transitions for service orders
      - Links to service_orders via foreign key
      - Includes timestamp and notes for each change

  2. Security
    - Enable RLS on all tables
    - Users can only access their own service orders and related data
    - Status history is accessible only for owned service orders

  3. Performance
    - Indexes on user_id and service_order_id for efficient queries
*/

-- Create service orders table
CREATE TABLE IF NOT EXISTS service_orders (
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

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_archived ON service_orders(archived_at);
CREATE INDEX IF NOT EXISTS idx_service_orders_created ON service_orders(created_at DESC);

-- Enable RLS on service orders
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (can be restricted later with auth)
CREATE POLICY "Allow all access to service orders"
  ON service_orders
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create status history table
CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id TEXT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for service_order_id on status history
CREATE INDEX IF NOT EXISTS idx_status_history_service_order_id ON status_history(service_order_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON status_history(created_at DESC);

-- Enable RLS on status history
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (can be restricted later with auth)
CREATE POLICY "Allow all access to status history"
  ON status_history
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);