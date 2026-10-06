const digits = (value) => (value || '').replace(/\D/g, '')

// The same person can be typed slightly differently each visit, so match on the phone number
// when there is one and on the name otherwise.
const customerKey = (row) => digits(row.customer_phone) || `name:${(row.customer_name || '').trim().toLowerCase()}`

// Collapses past orders into one entry per customer. Rows should be newest first, so the most
// recent email and company win.
export const dedupeCustomers = (rows, limit = 6) => {
  const byKey = new Map()

  for (const row of rows) {
    const key = customerKey(row)
    const existing = byKey.get(key)
    if (existing) {
      existing.orderCount += 1
      existing.email = existing.email || row.customer_email || ''
      existing.company = existing.company || row.company || ''
    } else {
      byKey.set(key, {
        name: (row.customer_name || '').trim(),
        phone: (row.customer_phone || '').trim(),
        email: row.customer_email || '',
        company: row.company || '',
        orderCount: 1
      })
    }
  }

  return [...byKey.values()].slice(0, limit)
}

// Characters that have a meaning inside a PostgREST filter string.
export const cleanSearchTerm = (term) => term.replace(/[,()%*\\]/g, ' ').replace(/\s+/g, ' ').trim()
