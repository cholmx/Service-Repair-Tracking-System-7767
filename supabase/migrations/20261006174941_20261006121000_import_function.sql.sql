/*
  # Atomic import and restore of service orders

  import_service_orders(p_orders jsonb) upserts a list of orders and their
  status history in a single transaction: either every row is written or none
  are. Totals are recomputed by the service_orders_compute_totals trigger, so
  whatever totals a file carries are ignored.

  Each element of p_orders has the service_orders columns plus a "history"
  array of {id, status, notes, created_at}. History rows are skipped when the
  same id, or the same order, status and timestamp, already exists, so
  re-importing a file does not duplicate history.

  Returns {created, updated, history_added}.
*/

CREATE OR REPLACE FUNCTION import_service_orders(p_orders jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_created int;
  v_updated int;
  v_history int;
BEGIN
  IF jsonb_typeof(p_orders) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'p_orders must be a JSON array';
  END IF;

  WITH upserted AS (
    INSERT INTO service_orders (
      id, customer_name, customer_phone, customer_email, company,
      item_type, serial_number, quantity, description, urgency,
      expected_completion, status, parts, labor, tax_rate,
      archived_at, created_at, updated_at
    )
    SELECT
      o.id, o.customer_name, o.customer_phone, o.customer_email, o.company,
      o.item_type, o.serial_number, COALESCE(o.quantity, 1), o.description, COALESCE(o.urgency, 'normal'),
      o.expected_completion, COALESCE(o.status, 'received'),
      COALESCE(o.parts, '[]'::jsonb), COALESCE(o.labor, '[]'::jsonb), COALESCE(o.tax_rate, 0),
      o.archived_at, COALESCE(o.created_at, now()), now()
    FROM jsonb_to_recordset(p_orders) AS o(
      id text, customer_name text, customer_phone text, customer_email text, company text,
      item_type text, serial_number text, quantity int, description text, urgency text,
      expected_completion date, status text, parts jsonb, labor jsonb, tax_rate numeric,
      archived_at timestamptz, created_at timestamptz
    )
    ON CONFLICT (id) DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      customer_phone = EXCLUDED.customer_phone,
      customer_email = EXCLUDED.customer_email,
      company = EXCLUDED.company,
      item_type = EXCLUDED.item_type,
      serial_number = EXCLUDED.serial_number,
      quantity = EXCLUDED.quantity,
      description = EXCLUDED.description,
      urgency = EXCLUDED.urgency,
      expected_completion = EXCLUDED.expected_completion,
      status = EXCLUDED.status,
      parts = EXCLUDED.parts,
      labor = EXCLUDED.labor,
      tax_rate = EXCLUDED.tax_rate,
      archived_at = EXCLUDED.archived_at,
      updated_at = now()
    RETURNING (xmax = 0) AS inserted
  )
  SELECT
    count(*) FILTER (WHERE inserted),
    count(*) FILTER (WHERE NOT inserted)
  INTO v_created, v_updated
  FROM upserted;

  WITH added AS (
    INSERT INTO status_history (id, service_order_id, status, notes, created_at)
    SELECT
      COALESCE(h.id, gen_random_uuid()), o.id, h.status, COALESCE(h.notes, ''), COALESCE(h.created_at, now())
    FROM jsonb_to_recordset(p_orders) AS o(id text, history jsonb),
         jsonb_to_recordset(COALESCE(o.history, '[]'::jsonb)) AS h(id uuid, status text, notes text, created_at timestamptz)
    WHERE NOT EXISTS (
      SELECT 1 FROM status_history x
      WHERE x.service_order_id = o.id AND x.status = h.status AND x.created_at = h.created_at
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_history FROM added;

  RETURN jsonb_build_object('created', v_created, 'updated', v_updated, 'history_added', v_history);
END;
$$;