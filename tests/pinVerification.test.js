import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createDb, readMigration } from './helpers/db'

let db

const verify = async (pin) => {
  const { rows } = await db.query('SELECT verify_pin($1) AS result', [pin])
  return rows[0].result
}

beforeAll(async () => {
  db = await createDb()
}, 60000)

beforeEach(async () => {
  await db.exec('TRUNCATE app_pins, pin_attempts')
  await db.exec(`
    INSERT INTO app_pins (slot, pin_hash) VALUES
      ('primary', extensions.crypt('4821', extensions.gen_salt('bf'))),
      ('secondary', extensions.crypt('7305', extensions.gen_salt('bf')))
  `)
})

describe('verify_pin', () => {
  it('accepts either configured PIN', async () => {
    expect((await verify('4821')).valid).toBe(true)
    expect((await verify('7305')).valid).toBe(true)
  })

  it('rejects wrong, empty and null PINs', async () => {
    expect((await verify('0000')).valid).toBe(false)
    expect((await verify('')).valid).toBe(false)
    expect((await verify(null)).valid).toBe(false)
  })

  it('no longer accepts the old hardcoded or default PINs', async () => {
    expect((await verify('9300')).valid).toBe(false)
    expect((await verify('1234')).valid).toBe(false)
  })

  it('stores hashes, never the PIN itself', async () => {
    const { rows } = await db.query('SELECT pin_hash FROM app_pins')
    for (const row of rows) {
      expect(row.pin_hash).toMatch(/^\$2[aby]\$/)
      expect(row.pin_hash).not.toContain('4821')
    }
  })

  it('reports when no PINs are configured', async () => {
    await db.exec('TRUNCATE app_pins')
    expect(await verify('4821')).toMatchObject({ valid: false, error: expect.stringMatching(/not configured/) })
  })

  it('locks out guessing after 10 failures, even for the right PIN', async () => {
    for (let i = 0; i < 10; i++) {
      expect((await verify('0000')).valid).toBe(false)
    }
    expect(await verify('4821')).toMatchObject({ valid: false, error: expect.stringMatching(/Too many attempts/) })
  })

  it('clears the failure count after a successful login', async () => {
    for (let i = 0; i < 5; i++) await verify('0000')
    expect((await verify('4821')).valid).toBe(true)
    const { rows } = await db.query('SELECT count(*)::int AS n FROM pin_attempts')
    expect(rows[0].n).toBe(0)
  })
})

describe('pin migration', () => {
  it('removes the plaintext PIN row from app_settings', async () => {
    await db.exec(`INSERT INTO app_settings (setting_key, setting_value) VALUES ('app_pin', '1234') ON CONFLICT DO NOTHING`)
    await db.exec(readMigration('20261006130000_pin_verification.sql'))
    const { rows } = await db.query(`SELECT count(*)::int AS n FROM app_settings WHERE setting_key = 'app_pin'`)
    expect(rows[0].n).toBe(0)
  })
})
