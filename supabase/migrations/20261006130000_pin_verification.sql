/*
  # Secret PIN verification

  The two access PINs are stored as bcrypt hashes in app_pins. The table has
  row level security enabled with no policies, so the browser (anon key) can
  neither read nor change it. The only way in is verify_pin(), which answers
  yes or no and slows down guessing.

  Set or change the PINs from the Supabase SQL editor (see SUPABASE_SETUP.md).
  Never commit the real PIN values.

  This also removes the old plaintext PIN from app_settings, which anyone
  could read with the public key.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS app_pins (
  slot text PRIMARY KEY CHECK (slot IN ('primary', 'secondary')),
  pin_hash text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pin_attempts (
  id bigserial PRIMARY KEY,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_attempts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON app_pins, pin_attempts FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON app_pins, pin_attempts FROM authenticated;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION verify_pin(p_pin text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_recent int;
  v_valid boolean;
BEGIN
  DELETE FROM pin_attempts WHERE attempted_at < now() - interval '1 hour';

  SELECT count(*) INTO v_recent
  FROM pin_attempts
  WHERE attempted_at > now() - interval '5 minutes';

  IF v_recent >= 10 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Too many attempts. Please wait a few minutes and try again.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM app_pins) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'PIN not configured. Please contact administrator.');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM app_pins WHERE pin_hash = crypt(COALESCE(p_pin, ''), pin_hash)
  ) INTO v_valid;

  IF v_valid THEN
    DELETE FROM pin_attempts;
  ELSE
    INSERT INTO pin_attempts DEFAULT VALUES;
  END IF;

  RETURN jsonb_build_object('valid', v_valid);
END;
$$;

DELETE FROM app_settings WHERE setting_key = 'app_pin';
