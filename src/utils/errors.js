// Turns whatever a Supabase call threw into a sentence a shop user can act on.

const MIGRATION_CODES = ['PGRST202', '42883', 'PGRST204', '42703', 'PGRST205', '42P01']

export const describeError = (error, online = typeof navigator === 'undefined' ? true : navigator.onLine) => {
  if (!online) {
    return 'You are offline. Reconnect and try again.'
  }

  const name = error?.name || ''
  const message = String(error?.message || '')

  if (name === 'TimeoutError' || name === 'AbortError' || /timed? ?out|aborted/i.test(message)) {
    return 'The server took too long to respond. Please try again.'
  }

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(message)) {
    return "Can't reach the server. Check your connection and try again."
  }

  if (MIGRATION_CODES.includes(error?.code)) {
    return 'The database is missing a required update. Ask your administrator to apply the latest migrations.'
  }

  return message || 'Something went wrong. Please try again.'
}
