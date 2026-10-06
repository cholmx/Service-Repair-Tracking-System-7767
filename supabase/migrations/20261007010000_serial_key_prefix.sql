/*
  # Treat a stray letter in front of a long serial number as the same unit

  The same SCBA gets typed both as 00401508EAE6AF7 and as e00401508eae6af7. serial_key already
  ignores case, spaces and punctuation; this also drops one or two letters at the very front when
  what follows starts with a digit and is at least 8 characters long, so both become 00401508EAE6AF7.

  Short serials are left alone ("SN4471" stays "SN4471"), so SN4471 and XY4471 are never merged,
  and so are serials with three or more leading letters. Each order still keeps the serial exactly
  as it was typed, and the history screens show it.

  serial_key is calculated from serial_number, so it is dropped and added again with the new rule;
  nothing typed by anyone is changed. The same rule is in src/utils/serial.js and a test checks the
  two agree.
*/

DROP INDEX IF EXISTS idx_service_orders_scba_serial;

ALTER TABLE service_orders DROP COLUMN IF EXISTS serial_key;

ALTER TABLE service_orders
  ADD COLUMN serial_key text
  GENERATED ALWAYS AS (
    NULLIF(
      regexp_replace(
        upper(regexp_replace(COALESCE(serial_number, ''), '[^A-Za-z0-9]', '', 'g')),
        '^[A-Z]{1,2}([0-9][A-Z0-9]{7,})$',
        '\1'
      ),
      ''
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_service_orders_scba_serial
  ON service_orders(serial_key)
  WHERE is_scba AND serial_key IS NOT NULL;
