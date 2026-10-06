/*
  # Match serial numbers however they were typed

  serial_key is the serial number with everything except letters and digits removed, in capitals,
  so "sn-4471", "SN 4471" and "SN4471" all become "SN4471". It is calculated by the database
  from serial_number, so it can never drift out of date. It is NULL when there is no serial number.

  The same rule is written in JavaScript in src/utils/serial.js, and a test checks the two agree.
*/

ALTER TABLE service_orders
  ADD COLUMN IF NOT EXISTS serial_key text
  GENERATED ALWAYS AS (
    NULLIF(upper(regexp_replace(COALESCE(serial_number, ''), '[^A-Za-z0-9]', '', 'g')), '')
  ) STORED;
