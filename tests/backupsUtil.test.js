import { describe, expect, it } from 'vitest'
import { backupFileName, backupHealth, formatBytes } from '../src/utils/backups'

const DAY = 24 * 60 * 60 * 1000
const now = new Date('2026-10-11T12:00:00Z').getTime()
const backup = (source, daysAgo) => ({ source, created_at: new Date(now - daysAgo * DAY).toISOString() })

describe('backupHealth', () => {
  it('is ok when a scheduled backup ran within the last 8 days', () => {
    expect(backupHealth([backup('scheduled', 3), backup('scheduled', 10)], now)).toMatchObject({ status: 'ok', daysAgo: 3 })
    expect(backupHealth([backup('scheduled', 8)], now).status).toBe('ok')
  })

  it('is stale when the last scheduled backup is older than 8 days', () => {
    expect(backupHealth([backup('scheduled', 9)], now)).toMatchObject({ status: 'stale', daysAgo: 9 })
  })

  it('ignores manual backups, which do not prove the schedule works', () => {
    expect(backupHealth([backup('manual', 0), backup('scheduled', 20)], now).status).toBe('stale')
    expect(backupHealth([backup('manual', 0)], now).status).toBe('none')
  })

  it('reports none when there are no backups', () => {
    expect(backupHealth([], now)).toEqual({ status: 'none', lastScheduled: null, daysAgo: null })
  })
})

describe('formatBytes', () => {
  it('uses KB for small files and MB for large ones', () => {
    expect(formatBytes(0)).toBe('0 KB')
    expect(formatBytes(100)).toBe('1 KB')
    expect(formatBytes(150 * 1024)).toBe('150 KB')
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB')
  })
})

describe('backupFileName', () => {
  it('names the file after the day of the backup', () => {
    expect(backupFileName({ created_at: '2026-10-04T09:00:00Z' })).toBe('servicetracker-backup-2026-10-04.json')
  })
})
