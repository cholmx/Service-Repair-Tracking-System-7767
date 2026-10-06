const DAY_MS = 24 * 60 * 60 * 1000

// A repeat repair is a unit that comes back within this many days of a finished repair.
export const REPEAT_WINDOW_DAYS = 90

// Anything shorter than this is too vague to match on.
export const MIN_SERIAL_CHARS = 3

const FINISHED = ['ready', 'completed', 'archived']
const CLOSED = ['completed', 'archived']

// Must match the serial_key column in 20261007010000_serial_key_prefix.sql. Keep letters and digits,
// capitalize, and drop one or two stray letters at the very front when a digit follows and at least
// 8 characters remain (so e00401508eae6af7 and 00401508EAE6AF7 are the same unit, while the short
// SN4471 stays as it is). Returns null when nothing is left.
export const normalizeSerial = (serial) =>
  (serial || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .replace(/^[A-Z]{1,2}([0-9][A-Z0-9]{7,})$/, '$1') || null

export const isOpen = (order) => !CLOSED.includes(order.status)

// When the repair was finished: the last time the order reached ready or completed,
// otherwise the day it came in.
export const repairDate = (order) => {
  const finishedAt = (order.statusHistory || [])
    .filter((entry) => entry.status === 'ready' || entry.status === 'completed')
    .map((entry) => entry.created_at)
    .sort()
    .at(-1)
  return finishedAt || order.created_at
}

const daysBetween = (from, to) => Math.floor((to - new Date(from).getTime()) / DAY_MS)

// Summarizes the other orders for a serial number.
// Returns { total, open, last, daysSinceLast, isRecentRepeat }. `open` are orders still in the shop;
// `last` is the most recently finished repair.
export const summarizeSerialHistory = (orders, { now = Date.now(), windowDays = REPEAT_WINDOW_DAYS } = {}) => {
  const open = orders.filter(isOpen)
  const finished = orders
    .filter((order) => FINISHED.includes(order.status))
    .sort((a, b) => new Date(repairDate(b)) - new Date(repairDate(a)))

  const last = finished[0] || null
  const daysSinceLast = last ? daysBetween(repairDate(last), now) : null

  return {
    total: orders.length,
    open,
    last,
    daysSinceLast,
    isRecentRepeat: last !== null && daysSinceLast <= windowDays
  }
}

// Orders for one unit, newest first, each marked with how long after the previous repair it came back.
export const annotateRepeats = (orders, windowDays = REPEAT_WINDOW_DAYS) => {
  const oldestFirst = [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const annotated = oldestFirst.map((order, index) => {
    const previous = oldestFirst[index - 1]
    const daysAfterPrevious = previous ? daysBetween(repairDate(previous), new Date(order.created_at).getTime()) : null
    return {
      ...order,
      daysAfterPrevious,
      isRepeat: daysAfterPrevious !== null && daysAfterPrevious >= 0 && daysAfterPrevious <= windowDays
    }
  })
  return annotated.reverse()
}

// Collapses search results (one row per order) into one entry per unit, most recently seen first.
export const groupUnits = (rows) => {
  const units = new Map()

  for (const row of rows) {
    if (!row.serial_key) continue
    const unit = units.get(row.serial_key) || {
      key: row.serial_key,
      serial: row.serial_number,
      itemTypes: new Set(),
      owners: new Set(),
      orderCount: 0,
      lastSeen: row.created_at
    }
    unit.orderCount += 1
    unit.itemTypes.add(row.item_type)
    unit.owners.add(row.company || row.customer_name)
    if (new Date(row.created_at) >= new Date(unit.lastSeen)) {
      unit.lastSeen = row.created_at
      unit.serial = row.serial_number
    }
    units.set(row.serial_key, unit)
  }

  return [...units.values()]
    .map((unit) => ({ ...unit, itemTypes: [...unit.itemTypes], owners: [...unit.owners] }))
    .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
}

// Repair history is kept for SCBAs only, so only they get a link to it.
export const scbaHistoryLink = (order) => {
  const key = order.is_scba ? normalizeSerial(order.serial_number) : null
  return key ? `/scba?serial=${encodeURIComponent(key)}` : null
}
