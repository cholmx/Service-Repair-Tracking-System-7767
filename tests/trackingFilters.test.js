import { describe, expect, it } from 'vitest'
import { filterAndSortOrders, statusLabel } from '../src/utils/trackingFilters'

const order = (overrides) => ({
  id: '100',
  customer_name: 'Pat Smith',
  company: null,
  item_type: 'Widget',
  description: 'Broken hose',
  serial_number: null,
  status: 'received',
  created_at: '2026-10-01T10:00:00Z',
  ...overrides
})

const orders = [
  order({ id: '101', customer_name: 'Zed Adams', created_at: '2026-10-03T10:00:00Z' }),
  order({ id: '202', customer_name: 'Amy Lee', company: 'Roy Fire Co', serial_number: 'SN-4471', status: 'ready', created_at: '2026-10-01T10:00:00Z' }),
  order({ id: '303', customer_name: 'Bob Cole', item_type: 'SCBA', status: 'ready', created_at: '2026-10-02T10:00:00Z' })
]

const ids = (list) => list.map((o) => o.id)

describe('filterAndSortOrders', () => {
  it('sorts newest first by default and oldest on request', () => {
    expect(ids(filterAndSortOrders(orders))).toEqual(['101', '303', '202'])
    expect(ids(filterAndSortOrders(orders, { sortBy: 'oldest' }))).toEqual(['202', '303', '101'])
  })

  it('sorts by company, falling back to the customer name', () => {
    expect(ids(filterAndSortOrders(orders, { sortBy: 'customer' }))).toEqual(['303', '202', '101'])
  })

  it('searches customer, company, item, description, serial and id, ignoring case', () => {
    expect(ids(filterAndSortOrders(orders, { searchTerm: 'zed' }))).toEqual(['101'])
    expect(ids(filterAndSortOrders(orders, { searchTerm: 'ROY FIRE' }))).toEqual(['202'])
    expect(ids(filterAndSortOrders(orders, { searchTerm: 'scba' }))).toEqual(['303'])
    expect(ids(filterAndSortOrders(orders, { searchTerm: 'sn-44' }))).toEqual(['202'])
    expect(ids(filterAndSortOrders(orders, { searchTerm: '303' }))).toEqual(['303'])
    expect(filterAndSortOrders(orders, { searchTerm: 'nothing matches' })).toEqual([])
  })

  it('filters by status and combines it with search', () => {
    expect(ids(filterAndSortOrders(orders, { statusFilter: 'ready' }))).toEqual(['303', '202'])
    expect(ids(filterAndSortOrders(orders, { statusFilter: 'ready', searchTerm: 'amy' }))).toEqual(['202'])
  })

  it('does not change the list it is given', () => {
    const copy = [...orders]
    filterAndSortOrders(orders, { sortBy: 'oldest' })
    expect(orders).toEqual(copy)
  })
})

describe('statusLabel', () => {
  it('uses the display names and capitalizes unknown statuses', () => {
    expect(statusLabel('waiting-parts')).toBe('Waiting on Parts')
    expect(statusLabel('ready')).toBe('Ready for Pickup or Delivery')
    expect(statusLabel('mystery')).toBe('Mystery')
  })
})
