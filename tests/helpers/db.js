import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

export const migrationsDir = join(import.meta.dirname, '..', '..', 'supabase', 'migrations')

export const readMigration = (file) => readFileSync(join(migrationsDir, file), 'utf8')

export const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map(readMigration)

// An in-memory Postgres with every migration applied, mirroring Supabase's
// layout (extensions live in the "extensions" schema).
export const createDb = async ({ before } = {}) => {
  const db = new PGlite()
  await db.exec('CREATE SCHEMA IF NOT EXISTS extensions')
  if (before) await db.exec(before)
  for (const sql of migrations) {
    await db.exec(sql)
  }
  return db
}
