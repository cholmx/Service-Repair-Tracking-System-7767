import supabase from '../lib/supabase'

const CHUNK_SIZE = 200

const ORDER_COLUMNS = [
  'id',
  'customer_name',
  'customer_phone',
  'customer_email',
  'company',
  'item_type',
  'serial_number',
  'quantity',
  'description',
  'urgency',
  'expected_completion',
  'status',
  'parts',
  'labor',
  'tax_rate',
  'archived_at',
  'created_at'
]

// Shapes an order loaded in the app into the row import_service_orders() expects.
export const orderToImportRow = (order) => {
  const row = Object.fromEntries(ORDER_COLUMNS.map((column) => [column, order[column] ?? null]))
  row.history = (order.statusHistory || []).map(({ id, status, notes, created_at }) => ({
    id,
    status,
    notes,
    created_at
  }))
  return row
}

// Returns the set of ids from the list that already exist, so the user can see what an import overwrites.
export const findExistingIds = async (ids) => {
  const existing = new Set()
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const { data, error } = await supabase
      .from('service_orders')
      .select('id')
      .in('id', ids.slice(i, i + CHUNK_SIZE))
    if (error) throw error
    data.forEach((row) => existing.add(row.id))
  }
  return existing
}

export const importOrders = async (orders) => {
  const { data, error } = await supabase.rpc('import_service_orders', { p_orders: orders })
  if (error) throw error
  return data
}
