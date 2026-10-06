const DAY_MS = 24 * 60 * 60 * 1000

// The weekly job runs every Sunday, so more than 8 days without one means something is wrong.
export const STALE_AFTER_DAYS = 8

export const formatBytes = (bytes) => {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Looks at the list of backups (newest first) and says whether automatic backups are running.
// Returns { status: 'ok' | 'stale' | 'none', lastScheduled, daysAgo }.
export const backupHealth = (backups, now = Date.now()) => {
  const lastScheduled = backups.find((backup) => backup.source === 'scheduled')
  if (!lastScheduled) return { status: 'none', lastScheduled: null, daysAgo: null }

  const daysAgo = Math.floor((now - new Date(lastScheduled.created_at).getTime()) / DAY_MS)
  return { status: daysAgo > STALE_AFTER_DAYS ? 'stale' : 'ok', lastScheduled, daysAgo }
}

export const backupFileName = (backup) =>
  `servicetracker-backup-${new Date(backup.created_at).toISOString().slice(0, 10)}.json`
