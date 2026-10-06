import supabase from '../lib/supabase'

const PAGE_SIZE = 1000

const byCreatedAt = (a, b) => new Date(a.created_at) - new Date(b.created_at)

// Orders come back with their history nested under status_history; the UI uses statusHistory.
export const normalizeOrder = ({ status_history, ...order }) => ({
  ...order,
  statusHistory: [...(status_history || [])].sort(byCreatedAt)
})

// Supabase returns at most 1000 rows per request, so page through larger tables.
const fetchAll = async (buildQuery) => {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE_SIZE) return rows
  }
}

export const fetchActiveOrders = async () => {
  const rows = await fetchAll(() =>
    supabase
      .from('service_orders')
      .select('*, status_history(*)')
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .order('id')
  )
  return rows.map(normalizeOrder)
}

export const fetchArchivedOrders = async () => {
  const rows = await fetchAll(() =>
    supabase
      .from('service_orders')
      .select('*, status_history(*)')
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
      .order('id')
  )
  return rows.map(normalizeOrder)
}

// The database assigns the ids and writes the orders and their first history rows in one transaction.
export const createOrders = async (formData) => {
  const payload = {
    customer_name: formData.customerName,
    customer_phone: formData.customerPhone,
    customer_email: formData.customerEmail || null,
    company: formData.company || null,
    urgency: formData.urgency,
    expected_completion: formData.expectedCompletion || null,
    items: formData.items.map((item) => ({
      item_type: item.itemType,
      serial_number: item.serialNumber || null,
      quantity: item.quantity,
      description: item.description,
      needs_quote: Boolean(item.needsQuote),
      is_scba: Boolean(item.isScba)
    }))
  }

  const { data, error } = await supabase.rpc('create_service_orders', { p_order: payload })
  if (error) throw error
  return data.map(normalizeOrder)
}

// Updates the order and, when a status is included, records the history row in one transaction.
// Totals are computed by the database from parts, labor and tax_rate.
export const updateOrder = async (id, updates, notes = null) => {
  const { data, error } = await supabase.rpc('update_service_order', {
    p_id: id,
    p_updates: updates,
    p_notes: notes
  })
  if (error) throw error
  return normalizeOrder(data)
}

export const deleteOrder = async (id) => {
  const { error } = await supabase.from('service_orders').delete().eq('id', id)
  if (error) throw error
}
