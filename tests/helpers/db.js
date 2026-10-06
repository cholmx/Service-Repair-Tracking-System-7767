import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

export const migrationsDir = join(import.meta.dirname, '..', '..', 'supabase', 'migrations')

export const readMigration = (file) => readFileSync(join(migrationsDir, file), 'utf8')

export const migrations = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()
  .map(readMigration)

// A tiny stand-in for pg_cron so the schedule migration can run: it records jobs in cron.job.
export const fakeCronSql = `
  CREATE SCHEMA cron;
  CREATE TABLE cron.job (jobid serial PRIMARY KEY, jobname text, schedule text, command text);
  CREATE FUNCTION cron.schedule(p_name text, p_schedule text, p_command text) RETURNS bigint
    LANGUAGE sql AS $$ INSERT INTO cron.job (jobname, schedule, command) VALUES (p_name, p_schedule, p_command) RETURNING jobid::bigint $$;
  CREATE FUNCTION cron.unschedule(p_id bigint) RETURNS boolean
    LANGUAGE sql AS $$ DELETE FROM cron.job WHERE jobid = p_id RETURNING true $$;
`

// An in-memory Postgres with every migration applied, mirroring Supabase's layout
// (extensions live in the "extensions" schema).
export const createDb = async ({ before } = {}) => {
  const db = new PGlite()
  await db.exec('CREATE SCHEMA IF NOT EXISTS extensions')
  await db.exec(fakeCronSql)
  if (before) await db.exec(before)
  for (const sql of migrations) {
    await db.exec(sql)
  }
  return db
}
