import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { PGlite } from '@electric-sql/pglite'

const migrationsDir = join(import.meta.dirname, '..', 'supabase', 'migrations')
const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map((file) => readFileSync(join(migrationsDir, file), 'utf8'))

let db

const create = async (order) => {
  const { rows } = await db.query('SELECT create_service_orders($1::jsonb) AS result', [JSON.stringify(order)])
  return rows[0].result
}

const update = async (id, updates, notes = null) => {
  const { rows } = await db.query('SELECT update_service_order($1, $2::jsonb, $3) AS result', [
    id,
    JSON.stringify(updates),
    notes
  ])
  return rows[0].result
}

const baseOrder = (items) => ({
  customer_name: 'Pat Smith',
  customer_phone: '555-0100',
  urgency: 'normal',
  items
})

const widget = { item_type: 'Widget', quantity: 1, description: 'Broken' }

beforeAll(async () => {
  db = new PGlite()
  for (const sql of migrations) {
    await db.exec(sql)
  }
}, 60000)

beforeEach(async () => {
  await db.exec('TRUNCATE status_history, service_orders CASCADE')
})

describe('migrations', () => {
  it('can be re-run without losing data', async () => {
    await create(baseOrder([widget]))
    for (const sql of migrations) {
      await db.exec(sql)
    }
    const { rows } = await db.query('SELECT count(*)::int AS n FROM service_orders')
    expect(rows[0].n).toBe(1)
  })
})

describe('create_service_orders', () => {
  it('creates an order with a 3 digit id and its first history row', async () => {
    const [order] = await create(baseOrder([widget]))
    expect(order.id).toMatch(/^[1-9]\d{2}$/)
    expect(Number(order.id)).toBeGreaterThanOrEqual(101)
    expect(order.status).toBe('received')
    expect(order.status_history).toHaveLength(1)
    expect(order.status_history[0].notes).toBe('1 x Widget received and logged into system')
  })

  it('starts quote items in needs-quote', async () => {
    const [order] = await create(baseOrder([{ ...widget, needs_quote: true }]))
    expect(order.status).toBe('needs-quote')
    expect(order.status_history[0].notes).toContain('needs quote preparation')
  })

  it('assigns distinct ids to every item in one intake', async () => {
    const orders = await create(baseOrder(Array.from({ length: 25 }, () => widget)))
    expect(new Set(orders.map((o) => o.id)).size).toBe(25)
  })

  it('never reuses an id that exists, even across many intakes', async () => {
    const seen = new Set()
    for (let i = 0; i < 20; i++) {
      for (const order of await create(baseOrder([widget, widget]))) {
        expect(seen.has(order.id)).toBe(false)
        seen.add(order.id)
      }
    }
  })

  it('rolls over to 4 digit ids when 101-999 are all taken', async () => {
    await db.exec(`
      INSERT INTO service_orders (id, customer_name, customer_phone, item_type, description)
      SELECT n::text, 'x', 'x', 'x', 'x' FROM generate_series(101, 999) n
    `)
    const [order] = await create(baseOrder([widget]))
    expect(order.id).toMatch(/^\d{4}$/)
  })

  it('writes nothing when any item in the intake is invalid', async () => {
    await expect(
      create(baseOrder([widget, { quantity: 1, description: 'no item type' }]))
    ).rejects.toThrow()
    const orders = await db.query('SELECT count(*)::int AS n FROM service_orders')
    const history = await db.query('SELECT count(*)::int AS n FROM status_history')
    expect(orders.rows[0].n).toBe(0)
    expect(history.rows[0].n).toBe(0)
  })

  it('rejects an intake with no items', async () => {
    await expect(create(baseOrder([]))).rejects.toThrow(/At least one item/)
  })
})

describe('update_service_order', () => {
  it('changes only the supplied keys', async () => {
    const [order] = await create({ ...baseOrder([widget]), company: 'Acme' })
    const updated = await update(order.id, { customer_name: 'Sam Jones' })
    expect(updated.customer_name).toBe('Sam Jones')
    expect(updated.company).toBe('Acme')
    expect(updated.customer_phone).toBe('555-0100')
    expect(updated.status_history).toHaveLength(1)
  })

  it('records a history row with notes when a status is supplied', async () => {
    const [order] = await create(baseOrder([widget]))
    const updated = await update(order.id, { status: 'in-progress' }, 'Started work')
    expect(updated.status).toBe('in-progress')
    expect(updated.status_history).toHaveLength(2)
    expect(updated.status_history[1]).toMatchObject({ status: 'in-progress', notes: 'Started work' })
  })

  it('clears nullable fields when given an empty value', async () => {
    const [order] = await create({ ...baseOrder([widget]), company: 'Acme' })
    const updated = await update(order.id, { company: '' })
    expect(updated.company).toBeNull()
  })

  it('stamps archived_at when archiving', async () => {
    const [order] = await create(baseOrder([widget]))
    const archived = await update(order.id, { status: 'archived' }, 'Service order archived')
    expect(archived.archived_at).not.toBeNull()
    const restored = await update(order.id, { status: 'completed', archived_at: null }, 'Restored')
    expect(restored.archived_at).toBeNull()
  })

  it('fails for an unknown order', async () => {
    await expect(update('000', { status: 'ready' })).rejects.toThrow(/not found/)
  })
})

describe('totals trigger', () => {
  it('computes totals from parts and labor and skips warranty lines', async () => {
    const [order] = await create(baseOrder([widget]))
    const updated = await update(order.id, {
      parts: [
        { description: 'Valve', quantity: 2, price: 10.25, isWarranty: false },
        { description: 'Seal', quantity: 1, price: 99, isWarranty: true }
      ],
      labor: [
        { description: 'Install', hours: 1.5, rate: 80, isWarranty: false },
        { description: 'Test', hours: 1, rate: 80, isWarranty: true }
      ],
      tax_rate: 8.25
    })
    expect(Number(updated.parts_total)).toBe(20.5)
    expect(Number(updated.labor_total)).toBe(120)
    expect(Number(updated.subtotal)).toBe(140.5)
    expect(Number(updated.tax)).toBe(11.59)
    expect(Number(updated.total)).toBe(152.09)
  })

  it('avoids floating point drift', async () => {
    const [order] = await create(baseOrder([widget]))
    const updated = await update(order.id, {
      parts: [{ description: 'Cheap part', quantity: 3, price: 0.1 }],
      labor: [],
      tax_rate: 0
    })
    expect(Number(updated.parts_total)).toBe(0.3)
    expect(Number(updated.total)).toBe(0.3)
  })

  it('overrides totals supplied directly by a client', async () => {
    await db.exec(`
      INSERT INTO service_orders (id, customer_name, customer_phone, item_type, description, total, parts)
      VALUES ('500', 'x', 'x', 'x', 'x', 9999, '[{"quantity": 1, "price": 5}]')
    `)
    const { rows } = await db.query(`SELECT total FROM service_orders WHERE id = '500'`)
    expect(Number(rows[0].total)).toBe(5)
  })

  it('handles empty and malformed line item JSON', async () => {
    await db.exec(`
      INSERT INTO service_orders (id, customer_name, customer_phone, item_type, description, parts, labor)
      VALUES ('501', 'x', 'x', 'x', 'x', '{}', 'null')
    `)
    const { rows } = await db.query(`SELECT total FROM service_orders WHERE id = '501'`)
    expect(Number(rows[0].total)).toBe(0)
  })
})
