/*
  # Server-side order IDs, atomic writes and authoritative totals

  1. generate_order_id()
     Picks a random unused ID. Starts with 3 digits (101-999), then rolls to
     4 digits (1000-9999) and 5 digits (10000-99999) as the shorter ranges fill up.
     It only looks at IDs that exist in service_orders, so it can never hand
     out a duplicate and it works from any device.

  2. create_service_orders(p_order jsonb)
     Creates one order per item plus the first status_history row for each,
     in a single transaction. If anything fails, nothing is written.

  3. update_service_order(p_id, p_updates jsonb, p_notes text)
     Applies a whitelisted set of column updates and records a status_history
     row when a status is supplied, in a single transaction. Only keys present
     in p_updates are changed.

  4. service_orders_compute_totals trigger
     Recomputes parts_total, labor_total, subtotal, tax and total from the
     parts and labor JSON using exact NUMERIC math. Warranty lines are free.
     Clients can no longer store totals that disagree with the line items.
*/

CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_id text;
  v_range int[];
  v_ranges int[][] := ARRAY[[101, 999], [1000, 9999], [10000, 99999]];
  i int;
BEGIN
  FOR i IN 1..array_length(v_ranges, 1) LOOP
    SELECT n::text INTO v_id
    FROM generate_series(v_ranges[i][1], v_ranges[i][2]) AS n
    WHERE NOT EXISTS (SELECT 1 FROM service_orders o WHERE o.id = n::text)
    ORDER BY random()
    LIMIT 1;

    IF v_id IS NOT NULL THEN
      RETURN v_id;
    END IF;
  END LOOP;

  RAISE EXCEPTION 'No order IDs are available';
END;
$$;

CREATE OR REPLACE FUNCTION service_orders_line_total(p_lines jsonb, p_qty_key text, p_rate_key text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(SUM(
    round(
      COALESCE((line->>p_qty_key)::numeric, 0) * COALESCE((line->>p_rate_key)::numeric, 0),
      2
    )
  ), 0)
  FROM jsonb_array_elements(
    CASE WHEN jsonb_typeof(p_lines) = 'array' THEN p_lines ELSE '[]'::jsonb END
  ) AS line
  WHERE COALESCE((line->>'isWarranty')::boolean, false) = false;
$$;

CREATE OR REPLACE FUNCTION service_orders_compute_totals()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.parts_total := service_orders_line_total(NEW.parts, 'quantity', 'price');
  NEW.labor_total := service_orders_line_total(NEW.labor, 'hours', 'rate');
  NEW.subtotal := NEW.parts_total + NEW.labor_total;
  NEW.tax := round(NEW.subtotal * COALESCE(NEW.tax_rate, 0) / 100, 2);
  NEW.total := NEW.subtotal + NEW.tax;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_orders_compute_totals ON service_orders;
CREATE TRIGGER service_orders_compute_totals
  BEFORE INSERT OR UPDATE OF parts, labor, tax_rate ON service_orders
  FOR EACH ROW
  EXECUTE FUNCTION service_orders_compute_totals();

CREATE OR REPLACE FUNCTION service_order_with_history(p_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT to_jsonb(o) || jsonb_build_object(
    'status_history',
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(h) ORDER BY h.created_at) FROM status_history h WHERE h.service_order_id = o.id),
      '[]'::jsonb
    )
  )
  FROM service_orders o
  WHERE o.id = p_id;
$$;

CREATE OR REPLACE FUNCTION create_service_orders(p_order jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_item jsonb;
  v_id text;
  v_status text;
  v_note text;
  v_quantity int;
  v_result jsonb := '[]'::jsonb;
BEGIN
  IF jsonb_typeof(p_order->'items') IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_order->'items') = 0 THEN
    RAISE EXCEPTION 'At least one item is required';
  END IF;

  -- Serialize ID assignment so two concurrent intakes cannot pick the same ID.
  PERFORM pg_advisory_xact_lock(hashtext('service_orders_id'));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order->'items') LOOP
    v_id := generate_order_id();
    v_quantity := COALESCE((v_item->>'quantity')::int, 1);

    IF COALESCE((v_item->>'needs_quote')::boolean, false) THEN
      v_status := 'needs-quote';
      v_note := format('%s x %s received and needs quote preparation', v_quantity, v_item->>'item_type');
    ELSE
      v_status := 'received';
      v_note := format('%s x %s received and logged into system', v_quantity, v_item->>'item_type');
    END IF;

    INSERT INTO service_orders (
      id, customer_name, customer_phone, customer_email, company,
      item_type, serial_number, quantity, description,
      urgency, expected_completion, status
    ) VALUES (
      v_id,
      p_order->>'customer_name',
      p_order->>'customer_phone',
      NULLIF(p_order->>'customer_email', ''),
      NULLIF(p_order->>'company', ''),
      v_item->>'item_type',
      NULLIF(v_item->>'serial_number', ''),
      v_quantity,
      v_item->>'description',
      COALESCE(NULLIF(p_order->>'urgency', ''), 'normal'),
      NULLIF(p_order->>'expected_completion', '')::date,
      v_status
    );

    INSERT INTO status_history (service_order_id, status, notes)
    VALUES (v_id, v_status, v_note);

    v_result := v_result || jsonb_build_array(service_order_with_history(v_id));
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION update_service_order(
  p_id text,
  p_updates jsonb,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE service_orders SET
    customer_name       = CASE WHEN p_updates ? 'customer_name'       THEN p_updates->>'customer_name'       ELSE customer_name END,
    customer_phone      = CASE WHEN p_updates ? 'customer_phone'      THEN p_updates->>'customer_phone'      ELSE customer_phone END,
    customer_email      = CASE WHEN p_updates ? 'customer_email'      THEN NULLIF(p_updates->>'customer_email', '') ELSE customer_email END,
    company             = CASE WHEN p_updates ? 'company'             THEN NULLIF(p_updates->>'company', '') ELSE company END,
    item_type           = CASE WHEN p_updates ? 'item_type'           THEN p_updates->>'item_type'           ELSE item_type END,
    serial_number       = CASE WHEN p_updates ? 'serial_number'       THEN NULLIF(p_updates->>'serial_number', '') ELSE serial_number END,
    quantity            = CASE WHEN p_updates ? 'quantity'            THEN (p_updates->>'quantity')::int     ELSE quantity END,
    description         = CASE WHEN p_updates ? 'description'         THEN p_updates->>'description'         ELSE description END,
    urgency             = CASE WHEN p_updates ? 'urgency'             THEN p_updates->>'urgency'             ELSE urgency END,
    expected_completion = CASE WHEN p_updates ? 'expected_completion' THEN NULLIF(p_updates->>'expected_completion', '')::date ELSE expected_completion END,
    status              = CASE WHEN p_updates ? 'status'              THEN p_updates->>'status'              ELSE status END,
    parts               = CASE WHEN jsonb_typeof(p_updates->'parts') = 'array' THEN p_updates->'parts' ELSE parts END,
    labor               = CASE WHEN jsonb_typeof(p_updates->'labor') = 'array' THEN p_updates->'labor' ELSE labor END,
    tax_rate            = CASE WHEN p_updates ? 'tax_rate'            THEN COALESCE((p_updates->>'tax_rate')::numeric, 0) ELSE tax_rate END,
    archived_at         = CASE
                            WHEN p_updates ? 'archived_at'              THEN (p_updates->>'archived_at')::timestamptz
                            WHEN p_updates->>'status' = 'archived'      THEN now()
                            ELSE archived_at
                          END,
    updated_at          = now()
  WHERE id = p_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Service order % not found', p_id;
  END IF;

  IF p_updates ? 'status' THEN
    INSERT INTO status_history (service_order_id, status, notes)
    VALUES (p_id, p_updates->>'status', COALESCE(p_notes, ''));
  END IF;

  RETURN service_order_with_history(p_id);
END;
$$;
