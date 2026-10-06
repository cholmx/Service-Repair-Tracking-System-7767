import { describe, expect, it } from 'vitest'
import { MAX_IMPORT_ORDERS, parseImportFile } from '../src/services/importSchema'

const order = (overrides = {}) => ({
  id: '607',
  customer_name: 'Pat Smith',
  customer_phone: '555-0100',
  customer_email: null,
  company: 'Acme',
  item_type: 'Widget',
  quantity: 1,
  description: 'Broken',
  urgency: 'normal',
  expected_completion: null,
  status: 'received',
  parts: [],
  labor: [],
  tax_rate: 0,
  archived_at: null,
  created_at: '2025-11-11T16:40:31.783649+00:00',
  statusHistory: [
    {
      id: '5571116f-0bc8-4b28-8f47-542cd9772aa8',
      status: 'received',
      notes: 'logged',
      created_at: '2025-11-11T16:40:31.783649+00:00',
      service_order_id: '607'
    }
  ],
  ...overrides
})

const file = (data) => JSON.stringify({ version: '1.0', data })

describe('parseImportFile', () => {
  it('accepts a normal export and normalizes rows', () => {
    const { orders, errors } = parseImportFile(file([order()]))
    expect(errors).toEqual([])
    expect(orders).toHaveLength(1)
    expect(orders[0]).toMatchObject({ id: '607', company: 'Acme', serial_number: null, history: [{ status: 'received' }] })
    expect(orders[0].statusHistory).toBeUndefined()
  })

  it('accepts a bare array and the older status_history key', () => {
    const row = order({ statusHistory: undefined, status_history: order().statusHistory })
    const { orders } = parseImportFile(JSON.stringify([row]))
    expect(orders[0].history).toHaveLength(1)
  })

  it('rejects files that are not usable at all', () => {
    expect(parseImportFile('nope').fileError).toMatch(/not valid JSON/)
    expect(parseImportFile('{"data": 5}').fileError).toMatch(/"data" list/)
    expect(parseImportFile(file([])).fileError).toMatch(/does not contain/)
    const tooMany = Array.from({ length: MAX_IMPORT_ORDERS + 1 }, (_, i) => order({ id: String(i) }))
    expect(parseImportFile(file(tooMany)).fileError).toMatch(/limit/)
  })

  it('reports each bad row without blocking the good ones', () => {
    const { orders, errors } = parseImportFile(
      file([
        order({ id: '1' }),
        order({ id: '2', customer_name: '' }),
        order({ id: '3', status: 'exploded' }),
        order({ id: '4', quantity: 0 }),
        order({ id: '5', expected_completion: 'tomorrow' })
      ])
    )
    expect(orders.map((o) => o.id)).toEqual(['1'])
    expect(errors.map((e) => e.id)).toEqual(['2', '3', '4', '5'])
    expect(errors[0].messages[0]).toMatch(/customer_name/)
  })

  it('rejects duplicate ids inside the file', () => {
    const { orders, errors } = parseImportFile(file([order(), order()]))
    expect(orders).toHaveLength(1)
    expect(errors[0].messages[0]).toMatch(/more than once/)
  })

  it('rejects unsafe ids and bad line items', () => {
    const { errors } = parseImportFile(
      file([order({ id: "1'; DROP TABLE x" }), order({ id: '8', parts: [{ description: 'x', quantity: -1, price: 2 }] })])
    )
    expect(errors).toHaveLength(2)
  })

  it('treats numeric ids and missing optional fields leniently', () => {
    const { orders } = parseImportFile(file([order({ id: 607, customer_email: undefined, urgency: null, tax_rate: null })]))
    expect(orders[0]).toMatchObject({ id: '607', customer_email: null, urgency: 'normal', tax_rate: 0 })
  })

  it('keeps the SCBA flag, and guesses it for older files that lack it', () => {
    const { orders } = parseImportFile(
      file([
        order({ id: '1', item_type: 'ALTAIR 4X', is_scba: true }),
        order({ id: '2', item_type: 'G1 SCBA' }),
        order({ id: '3', item_type: 'ALTAIR 4X' }),
        order({ id: '4', item_type: 'G1 SCBA', is_scba: false })
      ])
    )
    expect(orders.map((o) => o.is_scba)).toEqual([true, true, false, false])
  })

  it('ignores totals carried in the file', () => {
    const { orders } = parseImportFile(file([order({ total: 99999, parts_total: 5 })]))
    expect(orders[0].total).toBeUndefined()
    expect(orders[0].parts_total).toBeUndefined()
  })
})
