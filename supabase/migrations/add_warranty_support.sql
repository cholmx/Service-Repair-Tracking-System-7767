-- Add warranty support to existing service orders
-- This migration adds support for warranty flags in parts and labor JSON fields

-- Note: Since parts and labor are stored as JSONB, we don't need to modify the table structure
-- The warranty information will be stored within the JSON objects as:
-- parts: [{"description": "Part name", "quantity": 1, "price": 0, "isWarranty": true}, ...]
-- labor: [{"description": "Labor desc", "hours": 1, "rate": 0, "isWarranty": true}, ...]

-- This is just a documentation file to track the warranty feature addition
-- The actual data structure supports warranty flags through the existing JSONB fields

-- Example of how warranty items are stored:
-- Parts with warranty:
-- {
--   "description": "Replacement Screen",
--   "quantity": 1,
--   "price": 0,
--   "isWarranty": true
-- }

-- Labor with warranty:
-- {
--   "description": "Screen Installation",
--   "hours": 2,
--   "rate": 0,
--   "isWarranty": true
-- }

-- When isWarranty is true, the price/rate should be 0 and not included in totals
-- When isWarranty is false or undefined, normal pricing applies