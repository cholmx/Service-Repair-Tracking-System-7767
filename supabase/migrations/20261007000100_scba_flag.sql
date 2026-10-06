/*
  # SCBA flag, so repair history is kept for SCBAs only

  is_scba marks an order as an SCBA (the unit whose repair history the shop keeps, matched by
  serial number). Item types are typed freely ("G1 SCBA", "FIREHAWK", "G1 SBCA"), so the flag is
  stored on the order, guessed from the item type when the order is made, and can be corrected.

  looks_like_scba() is that guess. It matches SCBA (and the common typo SBCA), FireHawk, and the
  G1 and M7 model names. It is written the same way in src/utils/scba.js and a test checks the two
  agree. Gas detectors (Altair, Sensit), loose face pieces and cylinders are not guessed to be SCBAs
  unless the text says so; flip the flag on an order to change that.

  Existing orders are flagged from their item type once, when the column is added. Running this
  migration again does not undo corrections made since.

  The order functions below replace the earlier versions so they carry the flag, and a backup or
  import round trip keeps it.
*/

CREATE OR REPLACE FUNCTION looks_like_scba(p_item_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(p_item_type ~* '(scba|sbca|fire ?hawk|\mg1|\mm7\M)', false);
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'service_orders' AND column_name = 'is_scba'
  ) THEN
    ALTER TABLE service_orders ADD COLUMN is_scba boolean NOT NULL DEFAULT false;
    UPDATE service_orders SET is_scba = looks_like_scba(item_type);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_service_orders_scba_serial
  ON service_orders(serial_key)
  WHERE is_scba AND serial_key IS NOT NULL;

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
      urgency, expected_completion, status, is_scba
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
      v_status,
      COALESCE((v_item->>'is_scba')::boolean, looks_like_scba(v_item->>'item_type'))
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
    is_scba             = CASE WHEN p_updates ? 'is_scba'             THEN COALESCE((p_updates->>'is_scba')::boolean, false) ELSE is_scba END,
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
      archived_at, created_at, updated_at, is_scba
    )
    SELECT
      o.id, o.customer_name, o.customer_phone, o.customer_email, o.company,
      o.item_type, o.serial_number, COALESCE(o.quantity, 1), o.description, COALESCE(o.urgency, 'normal'),
      o.expected_completion, COALESCE(o.status, 'received'),
      COALESCE(o.parts, '[]'::jsonb), COALESCE(o.labor, '[]'::jsonb), COALESCE(o.tax_rate, 0),
      o.archived_at, COALESCE(o.created_at, now()), now(), COALESCE(o.is_scba, looks_like_scba(o.item_type))
    FROM jsonb_to_recordset(p_orders) AS o(
      id text, customer_name text, customer_phone text, customer_email text, company text,
      item_type text, serial_number text, quantity int, description text, urgency text,
      expected_completion date, status text, parts jsonb, labor jsonb, tax_rate numeric,
      archived_at timestamptz, created_at timestamptz, is_scba boolean
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
      is_scba = EXCLUDED.is_scba,
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
