-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles_st847291 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company_name TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on user profiles
ALTER TABLE user_profiles_st847291 ENABLE ROW LEVEL SECURITY;

-- Create policy for user profiles
CREATE POLICY "Users can only access their own profile"
  ON user_profiles_st847291
  FOR ALL
  USING (auth.uid() = user_id);

-- Create service orders table
CREATE TABLE IF NOT EXISTS service_orders_st847291 (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
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
  parts JSONB,
  labor JSONB,
  parts_total NUMERIC(10,2),
  labor_total NUMERIC(10,2),
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(10,2),
  total NUMERIC(10,2),
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for user_id on service orders
CREATE INDEX IF NOT EXISTS idx_service_orders_user_id ON service_orders_st847291(user_id);

-- Enable RLS on service orders
ALTER TABLE service_orders_st847291 ENABLE ROW LEVEL SECURITY;

-- Create policy for service orders
CREATE POLICY "Users can only access their own service orders"
  ON service_orders_st847291
  FOR ALL
  USING (auth.uid() = user_id);

-- Create status history table
CREATE TABLE IF NOT EXISTS status_history_st847291 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES service_orders_st847291(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for service_order_id on status history
CREATE INDEX IF NOT EXISTS idx_status_history_service_order_id ON status_history_st847291(service_order_id);

-- Enable RLS on status history
ALTER TABLE status_history_st847291 ENABLE ROW LEVEL SECURITY;

-- Create policy for status history
CREATE POLICY "Users can only access status history for their own service orders"
  ON status_history_st847291
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM service_orders_st847291
      WHERE service_orders_st847291.id = status_history_st847291.service_order_id
      AND service_orders_st847291.user_id = auth.uid()
    )
  );

-- Create functions for table creation
CREATE OR REPLACE FUNCTION create_user_profiles_table() 
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS user_profiles_st847291 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company_name TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  ALTER TABLE user_profiles_st847291 ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Users can only access their own profile" ON user_profiles_st847291;
  CREATE POLICY "Users can only access their own profile"
    ON user_profiles_st847291
    FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating user_profiles_st847291 table: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_service_orders_table() 
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS service_orders_st847291 (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
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
    parts JSONB,
    labor JSONB,
    parts_total NUMERIC(10,2),
    labor_total NUMERIC(10,2),
    tax_rate NUMERIC(5,2) DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    subtotal NUMERIC(10,2),
    total NUMERIC(10,2),
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  CREATE INDEX IF NOT EXISTS idx_service_orders_user_id ON service_orders_st847291(user_id);
  
  ALTER TABLE service_orders_st847291 ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Users can only access their own service orders" ON service_orders_st847291;
  CREATE POLICY "Users can only access their own service orders"
    ON service_orders_st847291
    FOR ALL
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating service_orders_st847291 table: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_status_history_table() 
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS status_history_st847291 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_order_id UUID NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
  
  CREATE INDEX IF NOT EXISTS idx_status_history_service_order_id ON status_history_st847291(service_order_id);
  
  ALTER TABLE status_history_st847291 ENABLE ROW LEVEL SECURITY;
  
  DROP POLICY IF EXISTS "Users can only access status history for their own service orders" ON status_history_st847291;
  CREATE POLICY "Users can only access status history for their own service orders"
    ON status_history_st847291
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM service_orders_st847291
        WHERE service_orders_st847291.id = status_history_st847291.service_order_id
        AND service_orders_st847291.user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating status_history_st847291 table: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create master function to create all tables
CREATE OR REPLACE FUNCTION create_tables_if_not_exist() 
RETURNS void AS $$
BEGIN
  PERFORM create_user_profiles_table();
  PERFORM create_service_orders_table();
  PERFORM create_status_history_table();
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error creating tables: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;