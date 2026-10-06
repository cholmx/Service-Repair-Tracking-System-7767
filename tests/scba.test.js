import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createDb, readMigration } from './helpers/db'
import { looksLikeScba } from '../src/utils/scba'
import { parseImportFile } from '../src/services/importSchema'

// Item types as they appear in the shop's real orders
const SCBA = [
  'G1 SCBA', 'FIREHAWK SCBA', 'SCBA - FIREHAWK', 'G1 SBCA', 'MSA M7 SCBA', 'XR SCBA', 'G1 - SCBA',
  'G1 SCBA with Cylinder', 'FIRE HAWK', 'FIREHAWK', 'Fire Hawk Facepiece (QTY 2)', 'G1 FACEPIECE',
  'G1 FACE PIECE', 'FIREHAWK 10047529 - REGULATOR', 'SCBA and Cylinder', 'MSA G1 SCBA', 'scba - firehawk'
]
const NOT_SCBA = [
  'ALTAIR 4X', 'ALTAIR 5X', 'Altair 4XR', 'MSA ALTAIR 5X', 'MSA - ALTAIR 4X - 00275845 E22EO', 'ALTAIR 4 XR',
  'Face Piece', 'FACE PIECE WITH BAG', 'Cylinder', 'CYLINDER 4500 PSI', 'RESCUE BOTTLE', 'Rit Pack', 'SENSIT',
  'Akron 1720 Assault Nozzle', 'ULTRA ELITE LENS (QTY 11)', '1', 'asdf', '', null, undefined
]

describe('looksLikeScba', () => {
  it('recognizes the ways SCBAs are written in the shop', () => {
    for (const type of SCBA) expect(looksLikeScba(type), type).toBe(true)
  })

  it('leaves gas detectors and loose parts alone', () => {
    for (const type of NOT_SCBA) expect(looksLikeScba(type), String(type)).toBe(false)
  })
})

describe('is_scba in the database', () => {
  let db
  const q = async (sql, params) => (await db.query(sql, params)).rows

  beforeAll(async () => {
    db = await createDb()
  }, 60000)

  beforeEach(async () => {
    await db.exec('TRUNCATE service_order_backups, status_history, service_orders CASCADE')
  })

  const insert = (id, itemType) =>
    db.query(
      `INSERT INTO service_orders (id, customer_name, customer_phone, item_type, description, serial_number)
       VALUES ($1, 'x', 'x', $2, 'x', 'SN-' || $1)`,
      [id, itemType]
    )

  it('guesses the same way the JavaScript does', async () => {
    for (const type of [...SCBA, ...NOT_SCBA.filter((t) => t !== undefined)]) {
      const [{ guess }] = await q('SELECT looks_like_scba($1) AS guess', [type])
      expect(guess, String(type)).toBe(looksLikeScba(type))
    }
  })

  it('defaults to not an SCBA for rows that do not say', async () => {
    await insert('1', 'G1 SCBA')
    expect((await q(`SELECT is_scba FROM service_orders WHERE id = '1'`))[0].is_scba).toBe(false)
  })

  it('create_service_orders uses the flag from the form, or guesses from the item type', async () => {
    const make = async (items) =>
      (await q('SELECT create_service_orders($1::jsonb) AS result', [JSON.stringify({ customer_name: 'A', customer_phone: '1', items })]))[0].result
    const [guessed, notGuessed, forcedOn, forcedOff] = await make([
      { item_type: 'FIREHAWK', description: 'd' },
      { item_type: 'ALTAIR 4X', description: 'd' },
      { item_type: 'ALTAIR 4X', description: 'd', is_scba: true },
      { item_type: 'G1 SCBA', description: 'd', is_scba: false }
    ])
    expect([guessed.is_scba, notGuessed.is_scba, forcedOn.is_scba, forcedOff.is_scba]).toEqual([true, false, true, false])
  })

  it('update_service_order changes the flag only when asked', async () => {
    const [{ result: created }] = await q('SELECT create_service_orders($1::jsonb) AS result', [
      JSON.stringify({ customer_name: 'A', customer_phone: '1', items: [{ item_type: 'G1 SCBA', description: 'd' }] })
    ])
    const id = created[0].id
    const edit = async (updates) => (await q('SELECT update_service_order($1, $2::jsonb) AS result', [id, JSON.stringify(updates)]))[0].result
    expect((await edit({ customer_name: 'B' })).is_scba).toBe(true)
    expect((await edit({ is_scba: false })).is_scba).toBe(false)
    expect((await edit({ company: 'Acme' })).is_scba).toBe(false)
    expect((await edit({ is_scba: true })).is_scba).toBe(true)
  })

  it('survives a backup and restore, and an import without the flag guesses it', async () => {
    const [{ result: created }] = await q('SELECT create_service_orders($1::jsonb) AS result', [
      JSON.stringify({ customer_name: 'A', customer_phone: '1', items: [{ item_type: 'ALTAIR 4X', description: 'd', is_scba: true }] })
    ])
    await q('SELECT create_backup()')
    await db.exec('TRUNCATE status_history, service_orders CASCADE')

    const [{ data }] = await q('SELECT data FROM service_order_backups')
    const { orders } = parseImportFile(JSON.stringify(data))
    await q('SELECT import_service_orders($1::jsonb) AS result', [JSON.stringify(orders)])
    expect((await q('SELECT is_scba FROM service_orders WHERE id = $1', [created[0].id]))[0].is_scba).toBe(true)

    await db.exec('TRUNCATE status_history, service_orders CASCADE')
    const oldFile = [{ id: '700', customer_name: 'A', customer_phone: '1', item_type: 'FIREHAWK', description: 'd', status: 'received' }]
    await q('SELECT import_service_orders($1::jsonb) AS result', [JSON.stringify(oldFile)])
    expect((await q(`SELECT is_scba FROM service_orders WHERE id = '700'`))[0].is_scba).toBe(true)
  })

  it('flags existing orders once, when the column is added, and never again', async () => {
    // Rebuild the situation: a table that has orders but no flag yet
    const old = await createDb()
    await old.exec('DROP INDEX idx_service_orders_scba_serial; ALTER TABLE service_orders DROP COLUMN is_scba')
    await old.exec(`
      INSERT INTO service_orders (id, customer_name, customer_phone, item_type, description)
      VALUES ('1', 'x', 'x', 'FIREHAWK SCBA', 'x'), ('2', 'x', 'x', 'ALTAIR 4X', 'x')
    `)
    await old.exec(readMigration('20261007000100_scba_flag.sql'))
    const flags = (await old.query('SELECT id, is_scba FROM service_orders ORDER BY id')).rows
    expect(flags).toEqual([{ id: '1', is_scba: true }, { id: '2', is_scba: false }])

    // The shop corrects one, then the migration runs again: the correction stays
    await old.exec(`UPDATE service_orders SET is_scba = true WHERE id = '2'; UPDATE service_orders SET is_scba = false WHERE id = '1'`)
    await old.exec(readMigration('20261007000100_scba_flag.sql'))
    const after = (await old.query('SELECT id, is_scba FROM service_orders ORDER BY id')).rows
    expect(after).toEqual([{ id: '1', is_scba: false }, { id: '2', is_scba: true }])
  }, 120000)

  it('has an index for SCBA serial lookups', async () => {
    expect(await q(`SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_orders_scba_serial'`)).toHaveLength(1)
  })
})
