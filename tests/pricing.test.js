import { describe, expect, it } from 'vitest'
import { calculateTotals, formatMoney, toCents } from '../src/utils/pricing'
import {
  LABOR_NUMERIC_FIELDS,
  PARTS_NUMERIC_FIELDS,
  addLine,
  newLabor,
  newPart,
  removeLine,
  toggleWarranty,
  updateLine
} from '../src/utils/lineItems'

describe('toCents', () => {
  it('rounds to whole cents without float drift', () => {
    expect(toCents(0.1 + 0.2)).toBe(30)
    expect(toCents(1.005)).toBe(101)
    expect(toCents('19.99')).toBe(1999)
    expect(toCents('')).toBe(0)
    expect(toCents(undefined)).toBe(0)
  })
})

describe('calculateTotals', () => {
  it('returns zeros for an empty order', () => {
    expect(calculateTotals()).toEqual({ partsTotal: 0, laborTotal: 0, subtotal: 0, tax: 0, total: 0 })
  })

  it('adds parts and labor and applies tax', () => {
    const totals = calculateTotals({
      parts: [{ quantity: 2, price: 10.25 }],
      labor: [{ hours: 1.5, rate: 80 }],
      taxRate: 8.25
    })
    expect(totals).toEqual({ partsTotal: 20.5, laborTotal: 120, subtotal: 140.5, tax: 11.59, total: 152.09 })
  })

  it('does not charge for warranty lines', () => {
    const totals = calculateTotals({
      parts: [
        { quantity: 1, price: 50, isWarranty: true },
        { quantity: 1, price: 5 }
      ],
      labor: [{ hours: 4, rate: 90, isWarranty: true }],
      taxRate: 10
    })
    expect(totals).toEqual({ partsTotal: 5, laborTotal: 0, subtotal: 5, tax: 0.5, total: 5.5 })
  })

  it('stays exact where plain floats would drift', () => {
    expect(calculateTotals({ parts: [{ quantity: 3, price: 0.1 }] }).total).toBe(0.3)
    expect(calculateTotals({ parts: [{ quantity: 1, price: 0.1 }, { quantity: 1, price: 0.2 }] }).total).toBe(0.3)
  })

  it('treats blank or invalid numbers as zero', () => {
    const totals = calculateTotals({ parts: [{ quantity: '', price: 'abc' }], taxRate: '' })
    expect(totals.total).toBe(0)
  })

  it('rounds each line to the cent before summing', () => {
    // 3 x $0.333 -> 3 x 33 cents (0.333 rounds to 33c) = 99c
    expect(calculateTotals({ parts: [{ quantity: 3, price: 0.333 }] }).partsTotal).toBe(0.99)
  })
})

describe('formatMoney', () => {
  it('formats dollars with two decimals', () => {
    expect(formatMoney(5)).toBe('$5.00')
    expect(formatMoney(undefined)).toBe('$0.00')
    expect(formatMoney('12.5')).toBe('$12.50')
  })
})

describe('line item helpers', () => {
  it('adds and removes lines without mutating the input', () => {
    const lines = [newPart()]
    const added = addLine(lines, newPart())
    expect(added).toHaveLength(2)
    expect(lines).toHaveLength(1)
    expect(removeLine(added, 0)).toHaveLength(1)
  })

  it('parses numeric fields and leaves text alone', () => {
    const lines = [newPart()]
    expect(updateLine(lines, 0, 'quantity', '3', PARTS_NUMERIC_FIELDS)[0].quantity).toBe(3)
    expect(updateLine(lines, 0, 'price', 'oops', PARTS_NUMERIC_FIELDS)[0].price).toBe(0)
    expect(updateLine(lines, 0, 'description', 'Valve', PARTS_NUMERIC_FIELDS)[0].description).toBe('Valve')
  })

  it('only edits the requested line', () => {
    const lines = [newLabor(), newLabor()]
    const updated = updateLine(lines, 1, 'hours', '2.5', LABOR_NUMERIC_FIELDS)
    expect(updated[0].hours).toBe(1)
    expect(updated[1].hours).toBe(2.5)
  })

  it('zeroes the rate when warranty is switched on', () => {
    const lines = [{ ...newLabor(), rate: 85 }]
    const warranty = toggleWarranty(lines, 0, 'rate')
    expect(warranty[0]).toMatchObject({ isWarranty: true, rate: 0 })
    expect(toggleWarranty(warranty, 0, 'rate')[0].isWarranty).toBe(false)
  })
})
