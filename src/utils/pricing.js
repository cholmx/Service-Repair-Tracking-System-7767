// Money math in integer cents so totals never pick up floating point drift.
// The database recomputes totals with exact NUMERIC math on every write
// (see supabase/migrations/20261006120000_order_functions.sql); this mirrors
// that logic so the edit screen can show the same numbers before saving.

const round = (value) => Math.round(Number(value.toPrecision(12)))

export const toCents = (dollars) => round((Number(dollars) || 0) * 100)

export const fromCents = (cents) => cents / 100

export const formatMoney = (dollars) => `$${(Number(dollars) || 0).toFixed(2)}`

const lineTotalCents = (lines, quantityKey, rateKey) =>
  (lines || []).reduce((sum, line) => {
    if (line.isWarranty) return sum
    const quantity = Number(line[quantityKey]) || 0
    return sum + round(quantity * toCents(line[rateKey]))
  }, 0)

export const calculateTotals = ({ parts = [], labor = [], taxRate = 0 } = {}) => {
  const partsTotal = lineTotalCents(parts, 'quantity', 'price')
  const laborTotal = lineTotalCents(labor, 'hours', 'rate')
  const subtotal = partsTotal + laborTotal
  const tax = round((subtotal * (Number(taxRate) || 0)) / 100)

  return {
    partsTotal: fromCents(partsTotal),
    laborTotal: fromCents(laborTotal),
    subtotal: fromCents(subtotal),
    tax: fromCents(tax),
    total: fromCents(subtotal + tax)
  }
}
