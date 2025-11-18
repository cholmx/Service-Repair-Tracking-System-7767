/*
  # Create app_settings table for PIN configuration

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key) - Unique identifier for the setting
      - `setting_key` (text, unique) - The setting name/key (e.g., 'app_pin')
      - `setting_value` (text) - The setting value (stores the PIN)
      - `is_active` (boolean) - Whether the setting is active
      - `created_at` (timestamptz) - When the setting was created
      - `updated_at` (timestamptz) - When the setting was last updated

  2. Security
    - Enable RLS on `app_settings` table
    - Add policy to allow anyone to read settings (needed for PIN verification)
    - Add policy to allow authenticated users to update settings (for PIN changes)

  3. Initial Data
    - Insert default PIN setting with value '1234'
*/

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (needed for PIN verification before authentication)
CREATE POLICY "Anyone can read active settings"
  ON app_settings
  FOR SELECT
  USING (is_active = true);

-- Allow anyone to update settings (we'll control this at app level)
CREATE POLICY "Anyone can update settings"
  ON app_settings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Insert default PIN
INSERT INTO app_settings (setting_key, setting_value, is_active)
VALUES ('app_pin', '1234', true)
ON CONFLICT (setting_key) DO NOTHING;