# Supabase Database Setup Guide

## Fix "invalid input syntax for type uuid" Error

You're getting this error because the database tables are expecting UUID values, but the app is trying to use simple numeric IDs like "328".

## Database Setup Instructions

1. **Login to Supabase Dashboard**
   - Go to https://app.supabase.com/
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left menu
   - Click "New Query"

3. **Run This SQL Script**
   - Copy and paste the following SQL:

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

4. **Click "Run" to execute the SQL**

5. **Reload your ServiceTracker app**
   - The error should be fixed
   - You can now create service orders with IDs like "328", "762", etc.

## Explanation

The key fix is changing:
- `id UUID PRIMARY KEY` to `id TEXT PRIMARY KEY`

This allows the app to use simple text IDs (like "328") instead of complex UUIDs.

## If Still Having Issues

1. Check the browser console for errors
2. Make sure the SQL script executed successfully
3. Try clearing your browser cache or using incognito mode
4. Verify you're using the latest code from the repository