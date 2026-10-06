import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createDb, readMigration } from './helpers/db'
import { parseImportFile } from '../src/services/importSchema'

let db

const q = async (sql, params) => (await db.query(sql, params)).rows

const order = async (id) => {
  await db.exec(`
    INSERT INTO service_orders (id, customer_name, customer_phone, item_type, description, parts)
    VALUES ('${id}', 'Pat ${id}', '555-0100', 'Widget', 'Broken', '[{"description":"Valve","quantity":2,"price":10}]')
  `)
  await db.exec(`INSERT INTO status_history (service_order_id, status, notes) VALUES ('${id}', 'received', 'Logged')`)
}

const backupNow = async () => (await q('SELECT create_backup() AS result'))[0].result

beforeAll(async () => {
  db = await createDb({ before: 'CREATE ROLE anon; CREATE ROLE authenticated' })
}, 60000)

beforeEach(async () => {
  await db.exec('TRUNCATE service_order_backups, status_history, service_orders CASCADE')
})

describe('create_backup', () => {
  it('snapshots every order with its history in the export format', async () => {
    await order('101')
    await order('102')
    await db.exec(`UPDATE service_orders SET status = 'archived', archived_at = now() WHERE id = '102'`)
    const result = await backupNow()
    expect(result.order_count).toBe(2)

    const [row] = await q('SELECT source, order_count, history_count, size_bytes, data FROM service_order_backups')
    expect(row).toMatchObject({ source: 'manual', order_count: 2, history_count: 2 })
    expect(row.size_bytes).toBeGreaterThan(100)
    expect(row.data.recordCount).toBe(2)
    expect(row.data.data.map((o) => o.id)).toEqual(['101', '102'])
    expect(row.data.data[0].statusHistory).toHaveLength(1)
    expect(Number(row.data.data[0].parts_total)).toBe(20)
  })

  it('produces a file the import screen accepts', async () => {
    await order('101')
    await backupNow()
    const [{ data }] = await q('SELECT data FROM service_order_backups')
    const parsed = parseImportFile(JSON.stringify(data))
    expect(parsed.errors).toEqual([])
    expect(parsed.orders).toHaveLength(1)
    expect(parsed.orders[0].history).toHaveLength(1)
  })

  it('can restore deleted orders through the import function', async () => {
    await order('101')
    await order('102')
    await backupNow()
    await db.exec(`DELETE FROM service_orders WHERE id = '101'`)
    await db.exec(`UPDATE service_orders SET customer_name = 'Changed' WHERE id = '102'`)

    const [{ data }] = await q('SELECT data FROM service_order_backups')
    const { orders } = parseImportFile(JSON.stringify(data))
    const [{ result }] = await q('SELECT import_service_orders($1::jsonb) AS result', [JSON.stringify(orders)])

    expect(result).toMatchObject({ created: 1, updated: 1 })
    const names = await q('SELECT id, customer_name FROM service_orders ORDER BY id')
    expect(names).toEqual([
      { id: '101', customer_name: 'Pat 101' },
      { id: '102', customer_name: 'Pat 102' }
    ])
    const history = await q('SELECT count(*)::int AS n FROM status_history')
    expect(history[0].n).toBe(2)
  })

  it('works with no orders at all', async () => {
    const result = await backupNow()
    expect(result.order_count).toBe(0)
    const [{ data }] = await q('SELECT data FROM service_order_backups')
    expect(data.data).toEqual([])
  })
})

describe('retention', () => {
  const addOld = (source, count) =>
    db.exec(`
      INSERT INTO service_order_backups (source, order_count, history_count, size_bytes, data, created_at)
      SELECT '${source}', 0, 0, 2, '{}', now() - (n || ' days')::interval
      FROM generate_series(1, ${count}) n
    `)

  it('keeps the newest 12 scheduled backups', async () => {
    await addOld('scheduled', 14)
    await q(`SELECT _create_backup('scheduled')`)
    const [{ n, oldest }] = await q(`SELECT count(*)::int AS n, min(created_at) AS oldest FROM service_order_backups WHERE source = 'scheduled'`)
    expect(n).toBe(12)
    // 14 old ones plus the new one is 15. The 3 oldest (14, 13 and 12 days ago) are gone.
    expect(new Date(oldest).getTime()).toBeGreaterThan(Date.now() - 12 * 24 * 3600 * 1000)
  })

  it('counts manual and scheduled backups separately', async () => {
    await addOld('scheduled', 12)
    for (let i = 0; i < 8; i++) await backupNow()
    const counts = await q('SELECT source, count(*)::int AS n FROM service_order_backups GROUP BY source ORDER BY source')
    expect(counts).toEqual([
      { source: 'manual', n: 5 },
      { source: 'scheduled', n: 12 }
    ])
  })

  it('rejects unknown sources', async () => {
    await expect(q(`SELECT _create_backup('hacked')`)).rejects.toThrow(/Unknown backup source/)
  })
})

describe('access', () => {
  it('lets the app press the button but not run the scheduled job', async () => {
    const [{ run, now }] = await q(`
      SELECT has_function_privilege('anon', '_create_backup(text)', 'execute') AS run,
             has_function_privilege('anon', 'create_backup()', 'execute') AS now
    `)
    expect(run).toBe(false)
    expect(now).toBe(true)
  })
})

describe('weekly schedule migration', () => {
  it('schedules one job for Sunday morning', async () => {
    const jobs = await q('SELECT jobname, schedule, command FROM cron.job')
    expect(jobs).toEqual([
      { jobname: 'weekly-service-order-backup', schedule: '0 9 * * 0', command: `SELECT public._create_backup('scheduled')` }
    ])
  })

  it('replaces the job instead of duplicating it when run again', async () => {
    await db.exec(readMigration('20261006150100_schedule_weekly_backup.sql'))
    await db.exec(readMigration('20261006150100_schedule_weekly_backup.sql'))
    const [{ n }] = await q('SELECT count(*)::int AS n FROM cron.job')
    expect(n).toBe(1)
  })

  it('stops with a clear error when pg_cron is not available', async () => {
    const bare = await createDb()
    await bare.exec('DROP SCHEMA cron CASCADE')
    await expect(bare.exec(readMigration('20261006150100_schedule_weekly_backup.sql'))).rejects.toThrow(/pg_cron is not available/)
  }, 60000)
})
