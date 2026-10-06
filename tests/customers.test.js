import { describe, expect, it } from 'vitest'
import { cleanSearchTerm, dedupeCustomers } from '../src/utils/customers'

const row = (overrides) => ({
  customer_name: 'Lee Roy',
  customer_phone: '(555) 010-1234',
  customer_email: null,
  company: null,
  ...overrides
})

describe('dedupeCustomers', () => {
  it('collapses repeat visits by phone number however it was typed', () => {
    const result = dedupeCustomers([
      row({ customer_phone: '555-010-1234' }),
      row({ customer_phone: '5550101234' }),
      row({ customer_phone: '+1 (555) 010-1234' }),
      row({ customer_name: 'Someone Else', customer_phone: '555-999-0000' })
    ])
    expect(result).toHaveLength(3)
    expect(result[0].orderCount).toBe(2)
  })

  it('keeps the newest values and fills gaps from older orders', () => {
    const [customer] = dedupeCustomers([
      row({ customer_email: null, company: 'Roy Fire Co' }),
      row({ customer_email: 'lee@example.com', company: 'Old Name Co' })
    ])
    expect(customer).toMatchObject({ email: 'lee@example.com', company: 'Roy Fire Co', orderCount: 2 })
  })

  it('matches on name when there is no phone number', () => {
    const result = dedupeCustomers([
      row({ customer_phone: '' }),
      row({ customer_phone: null, customer_name: ' lee roy ' })
    ])
    expect(result).toHaveLength(1)
  })

  it('limits the number of suggestions', () => {
    const rows = Array.from({ length: 20 }, (_, i) => row({ customer_name: `P${i}`, customer_phone: `555000${i}` }))
    expect(dedupeCustomers(rows)).toHaveLength(6)
    expect(dedupeCustomers(rows, 3)).toHaveLength(3)
  })
})

describe('cleanSearchTerm', () => {
  it('removes characters that would change the meaning of a filter', () => {
    expect(cleanSearchTerm('a,b)c(d%e*f\\g')).toBe('a b c d e f g')
    expect(cleanSearchTerm('  Roy   Fire ')).toBe('Roy Fire')
    expect(cleanSearchTerm('%%%')).toBe('')
  })
})
