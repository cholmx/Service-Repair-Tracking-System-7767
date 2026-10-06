import { beforeAll, describe, expect, it } from 'vitest'
import { createDb } from './helpers/db'
import {
  REPEAT_WINDOW_DAYS,
  annotateRepeats,
  scbaHistoryLink,
  groupUnits,
  isOpen,
  normalizeSerial,
  repairDate,
  summarizeSerialHistory
} from '../src/utils/serial'

const DAY = 24 * 60 * 60 * 1000
const now = new Date('2026-10-11T12:00:00Z').getTime()
const daysAgo = (n) => new Date(now - n * DAY).toISOString()

const order = (id, status, createdDaysAgo, extra = {}) => ({
  id,
  status,
  created_at: daysAgo(createdDaysAgo),
  statusHistory: [],
  ...extra
})

describe('normalizeSerial', () => {
  it('ignores case, spaces and punctuation', () => {
    expect(normalizeSerial('sn-4471')).toBe('SN4471')
    expect(normalizeSerial(' SN 4471 ')).toBe('SN4471')
    expect(normalizeSerial('SN/4471.')).toBe('SN4471')
  })

  it('returns null when nothing is left', () => {
    expect(normalizeSerial('')).toBeNull()
    expect(normalizeSerial('  - ')).toBeNull()
    expect(normalizeSerial(null)).toBeNull()
    expect(normalizeSerial(undefined)).toBeNull()
  })
})

describe('serial_key in the database', () => {
  let db
  beforeAll(async () => {
    db = await createDb()
  }, 60000)

  const key = async (serial) => {
    await db.exec('TRUNCATE status_history, service_orders CASCADE')
    await db.query(
      `INSERT INTO service_orders (id, customer_name, customer_phone, item_type, description, serial_number)
       VALUES ('1', 'x', 'x', 'x', 'x', $1)`,
      [serial]
    )
    return (await db.query(`SELECT serial_key FROM service_orders WHERE id = '1'`)).rows[0].serial_key
  }

  it('agrees with normalizeSerial for every kind of input', async () => {
    const samples = ['sn-4471', ' SN 4471 ', 'SN/4471.', 'abc 123 def', '000123', 'a-b_c.d e', '12 34', '', '   ', '--', null]
    for (const sample of samples) {
      expect(await key(sample)).toBe(normalizeSerial(sample))
    }
  })

  it('follows changes to the serial number', async () => {
    await key('SN-1')
    await db.exec(`UPDATE service_orders SET serial_number = 'new 22' WHERE id = '1'`)
    expect((await db.query(`SELECT serial_key FROM service_orders WHERE id = '1'`)).rows[0].serial_key).toBe('NEW22')
  })

  it('does not get in the way of the order functions or backups', async () => {
    await db.exec('TRUNCATE status_history, service_orders CASCADE')
    const { rows } = await db.query(
      `SELECT create_service_orders($1::jsonb) AS result`,
      [JSON.stringify({ customer_name: 'A', customer_phone: '1', items: [{ item_type: 'W', description: 'd', serial_number: 'sn-9' }] })]
    )
    expect(rows[0].result[0].serial_key).toBe('SN9')
    await db.query('SELECT create_backup()')
    const backup = (await db.query('SELECT data FROM service_order_backups')).rows[0].data
    const restored = await db.query('SELECT import_service_orders($1::jsonb) AS result', [JSON.stringify(backup.data)])
    expect(restored.rows[0].result.updated).toBe(1)
  })
})

describe('repairDate and isOpen', () => {
  it('uses the last time the order was ready or completed, else the intake date', () => {
    const finished = order('1', 'completed', 100, {
      statusHistory: [
        { status: 'received', created_at: daysAgo(100) },
        { status: 'ready', created_at: daysAgo(80) },
        { status: 'completed', created_at: daysAgo(79) }
      ]
    })
    expect(repairDate(finished)).toBe(daysAgo(79))
    expect(repairDate(order('2', 'in-progress', 5))).toBe(daysAgo(5))
  })

  it('treats completed and archived as closed', () => {
    expect(isOpen(order('1', 'ready', 1))).toBe(true)
    expect(isOpen(order('1', 'waiting-parts', 1))).toBe(true)
    expect(isOpen(order('1', 'completed', 1))).toBe(false)
    expect(isOpen(order('1', 'archived', 1))).toBe(false)
  })
})

describe('summarizeSerialHistory', () => {
  const finishedOrder = (id, finishedDaysAgo) =>
    order(id, 'archived', finishedDaysAgo + 5, { statusHistory: [{ status: 'ready', created_at: daysAgo(finishedDaysAgo) }] })

  it('reports nothing for a serial we have not seen', () => {
    expect(summarizeSerialHistory([], { now })).toEqual({ total: 0, open: [], last: null, daysSinceLast: null, isRecentRepeat: false })
  })

  it('flags a unit that comes back within 90 days of a finished repair', () => {
    const summary = summarizeSerialHistory([finishedOrder('a', 41), finishedOrder('b', 400)], { now })
    expect(summary).toMatchObject({ total: 2, daysSinceLast: 41, isRecentRepeat: true })
    expect(summary.last.id).toBe('a')
  })

  it('does not flag an old repair', () => {
    const summary = summarizeSerialHistory([finishedOrder('a', REPEAT_WINDOW_DAYS + 1)], { now })
    expect(summary.isRecentRepeat).toBe(false)
    expect(summarizeSerialHistory([finishedOrder('a', REPEAT_WINDOW_DAYS)], { now }).isRecentRepeat).toBe(true)
  })

  it('lists orders that are still in the shop', () => {
    const summary = summarizeSerialHistory([order('open1', 'in-progress', 3), order('open2', 'ready', 1), finishedOrder('done', 200)], { now })
    expect(summary.open.map((o) => o.id).sort()).toEqual(['open1', 'open2'])
    expect(summary.last.id).toBe('open2')
  })

  it('does not count an order that is still being worked on as a finished repair', () => {
    const summary = summarizeSerialHistory([order('open', 'in-progress', 3)], { now })
    expect(summary.last).toBeNull()
    expect(summary.isRecentRepeat).toBe(false)
  })
})

describe('annotateRepeats', () => {
  it('marks orders that came back soon after the previous repair, newest first', () => {
    const orders = [
      order('first', 'completed', 300, { statusHistory: [{ status: 'completed', created_at: daysAgo(295) }] }),
      order('second', 'completed', 250, { statusHistory: [{ status: 'completed', created_at: daysAgo(240) }] }),
      order('third', 'received', 200)
    ]
    const result = annotateRepeats(orders)
    expect(result.map((o) => o.id)).toEqual(['third', 'second', 'first'])
    expect(result.find((o) => o.id === 'first')).toMatchObject({ isRepeat: false, daysAfterPrevious: null })
    expect(result.find((o) => o.id === 'second')).toMatchObject({ isRepeat: true, daysAfterPrevious: 45 })
    expect(result.find((o) => o.id === 'third')).toMatchObject({ isRepeat: true, daysAfterPrevious: 40 })
  })

  it('does not mark a return after a long gap', () => {
    const orders = [order('a', 'completed', 500, { statusHistory: [{ status: 'completed', created_at: daysAgo(490) }] }), order('b', 'received', 100)]
    expect(annotateRepeats(orders)[0]).toMatchObject({ id: 'b', isRepeat: false, daysAfterPrevious: 390 })
  })
})

describe('groupUnits', () => {
  const row = (key, serial, createdDaysAgo, extra = {}) => ({
    serial_key: key,
    serial_number: serial,
    item_type: 'SCBA',
    customer_name: 'Lee',
    company: null,
    created_at: daysAgo(createdDaysAgo),
    ...extra
  })

  it('groups orders by normalized serial, newest unit first, using the latest spelling', () => {
    const units = groupUnits([row('SN1', 'sn-1', 30), row('SN2', 'SN-2', 5), row('SN1', 'SN 1', 10), row(null, null, 1)])
    expect(units.map((u) => u.key)).toEqual(['SN2', 'SN1'])
    expect(units[1]).toMatchObject({ orderCount: 2, serial: 'SN 1' })
  })

  it('lists the item types and owners seen for a unit', () => {
    const [unit] = groupUnits([row('SN1', 'SN1', 30, { item_type: 'Mask', company: 'Roy Fire Co' }), row('SN1', 'SN1', 5, { item_type: 'SCBA' })])
    expect(unit.itemTypes.sort()).toEqual(['Mask', 'SCBA'])
    expect(unit.owners.sort()).toEqual(['Lee', 'Roy Fire Co'])
  })
})

describe('scbaHistoryLink', () => {
  it('links SCBAs by normalized serial and gives nothing for anything else', () => {
    expect(scbaHistoryLink({ is_scba: true, serial_number: 'sn 4471' })).toBe('/scba?serial=SN4471')
    expect(scbaHistoryLink({ is_scba: false, serial_number: 'sn 4471' })).toBeNull()
    expect(scbaHistoryLink({ is_scba: true, serial_number: '' })).toBeNull()
    expect(scbaHistoryLink({ is_scba: true })).toBeNull()
  })
})
