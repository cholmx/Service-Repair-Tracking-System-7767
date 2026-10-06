/*
  # Weekly backup schedule

  Runs _create_backup('scheduled') every Sunday at 09:00 UTC (about 4 or 5 in the morning in the
  US) using pg_cron, which Supabase provides. Safe to run again: the job is replaced, not duplicated.

  If pg_cron is not available this stops with an error rather than quietly doing nothing, because
  a backup that never runs is worse than a migration that fails. The manual "Back up now" button
  still works, and Settings warns when no automatic backup has run for over a week.
*/

DO $$
BEGIN
  IF to_regnamespace('cron') IS NULL THEN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
      CREATE EXTENSION IF NOT EXISTS pg_cron;
    ELSE
      RAISE EXCEPTION 'pg_cron is not available in this database. Enable the pg_cron extension (Supabase dashboard, Database, Extensions) and run this migration again.';
    END IF;
  END IF;

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'weekly-service-order-backup';
  PERFORM cron.schedule('weekly-service-order-backup', '0 9 * * 0', 'SELECT public._create_backup(''scheduled'')');
END;
$$;
