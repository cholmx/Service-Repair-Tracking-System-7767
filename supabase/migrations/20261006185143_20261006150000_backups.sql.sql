/*
  # Backups of all service orders

  service_order_backups holds full snapshots (orders and their status history) in the same JSON
  format the Settings page exports, so any snapshot can be downloaded or restored through the
  normal import screen.

  - _create_backup(source) takes a snapshot and trims old ones: the newest 12 'scheduled'
    snapshots and the newest 5 'manual' snapshots are kept, counted separately so button clicks
    can never push out the weekly ones. It is not callable from the app.
  - create_backup() is the "Back up now" button. It always makes a 'manual' snapshot.
  - The app can read backups but cannot add, change or delete them.

  The weekly schedule is set up by the next migration.
*/

CREATE TABLE IF NOT EXISTS service_order_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source IN ('scheduled', 'manual')),
  order_count integer NOT NULL,
  history_count integer NOT NULL,
  size_bytes integer NOT NULL,
  data jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_order_backups_created ON service_order_backups(created_at DESC);

ALTER TABLE service_order_backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read backups" ON service_order_backups;
CREATE POLICY "Read backups"
  ON service_order_backups
  FOR SELECT
  TO public
  USING (true);

CREATE OR REPLACE FUNCTION _create_backup(p_source text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orders jsonb;
  v_data jsonb;
  v_orders_count int;
  v_history_count int;
  v_id uuid;
  v_created timestamptz;
BEGIN
  IF p_source NOT IN ('scheduled', 'manual') THEN
    RAISE EXCEPTION 'Unknown backup source %', p_source;
  END IF;

  SELECT
    COALESCE(
      jsonb_agg(
        to_jsonb(o) || jsonb_build_object(
          'statusHistory',
          COALESCE(
            (SELECT jsonb_agg(to_jsonb(h) ORDER BY h.created_at) FROM status_history h WHERE h.service_order_id = o.id),
            '[]'::jsonb
          )
        )
        ORDER BY o.created_at
      ),
      '[]'::jsonb
    ),
    count(*)
  INTO v_orders, v_orders_count
  FROM service_orders o;

  SELECT count(*) INTO v_history_count FROM status_history;

  v_data := jsonb_build_object(
    'version', '1.0',
    'exportDate', now(),
    'recordCount', v_orders_count,
    'includesArchived', true,
    'data', v_orders
  );

  INSERT INTO service_order_backups (source, order_count, history_count, size_bytes, data)
  VALUES (p_source, v_orders_count, v_history_count, length(v_data::text), v_data)
  RETURNING id, created_at INTO v_id, v_created;

  DELETE FROM service_order_backups
  WHERE source = p_source
    AND id NOT IN (
      SELECT id FROM service_order_backups
      WHERE source = p_source
      ORDER BY created_at DESC
      LIMIT CASE WHEN p_source = 'scheduled' THEN 12 ELSE 5 END
    );

  RETURN jsonb_build_object('id', v_id, 'created_at', v_created, 'order_count', v_orders_count);
END;
$$;

CREATE OR REPLACE FUNCTION create_backup()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _create_backup('manual');
$$;

REVOKE ALL ON FUNCTION _create_backup(text) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON FUNCTION _create_backup(text) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON FUNCTION _create_backup(text) FROM authenticated;
  END IF;
END;
$$;
