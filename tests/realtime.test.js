import { describe, expect, it } from 'vitest'
import { createDb, readMigration } from './helpers/db'

const published = async (db) => {
  const { rows } = await db.query(
    `SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename`
  )
  return rows.map((row) => row.tablename)
}

describe('enable_realtime migration', () => {
  it('adds both tables to the realtime publication', async () => {
    const db = await createDb({ before: 'CREATE PUBLICATION supabase_realtime' })
    expect(await published(db)).toEqual(['service_orders', 'status_history'])
  }, 60000)

  it('can be run again without error', async () => {
    const db = await createDb({ before: 'CREATE PUBLICATION supabase_realtime' })
    await db.exec(readMigration('20261006140000_enable_realtime.sql'))
    expect(await published(db)).toEqual(['service_orders', 'status_history'])
  }, 60000)

  it('does nothing where there is no realtime publication', async () => {
    const db = await createDb()
    const { rows } = await db.query(`SELECT count(*)::int AS n FROM pg_publication WHERE pubname = 'supabase_realtime'`)
    expect(rows[0].n).toBe(0)
  }, 60000)
})
