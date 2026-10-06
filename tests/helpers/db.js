import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'

export const migrationsDir = join(import.meta.dirname, '..', '..', 'supabase', 'migrations')

export const readMigration = (file) => readFileSync(join(migrationsDir, file), 'utf8')

export const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map(readMigration)

// An in-memory Postgres with every migration applied, mirroring Supabase's
// layout (extensions live in the "extensions" schema).
export const createDb = async () => {
  const db = new PGlite({ extensions: { pgcrypto } })
  await db.exec('CREATE SCHEMA IF NOT EXISTS extensions')
  for (const sql of migrations) {
    await db.exec(sql)
  }
  return db
}
