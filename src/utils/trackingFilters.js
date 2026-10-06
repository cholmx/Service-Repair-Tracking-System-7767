import { STATUS_OPTIONS } from '../constants/statuses'

export const statusLabel = (status) =>
  STATUS_OPTIONS.find((option) => option.value === status)?.label ||
  status.charAt(0).toUpperCase() + status.slice(1)

const matchesSearch = (order, term) => {
  if (!term) return true
  const needle = term.toLowerCase()
  return (
    order.id.includes(term) ||
    [order.customer_name, order.company, order.item_type, order.description, order.serial_number].some(
      (field) => field && field.toLowerCase().includes(needle)
    )
  )
}

const compare = {
  newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  oldest: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  customer: (a, b) => (a.company || a.customer_name).localeCompare(b.company || b.customer_name)
}

// Filters by search text and status, then sorts. Never changes the list it is given.
export const filterAndSortOrders = (orders, { searchTerm = '', statusFilter = 'all', sortBy = 'newest' } = {}) =>
  orders
    .filter((order) => matchesSearch(order, searchTerm) && (statusFilter === 'all' || order.status === statusFilter))
    .sort(compare[sortBy] || (() => 0))
