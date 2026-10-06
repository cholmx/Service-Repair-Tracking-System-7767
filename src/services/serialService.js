import supabase from '../lib/supabase'
import { normalizeOrder } from './orderService'

// Repair history is kept for SCBAs only, so every lookup is limited to orders flagged as SCBAs.

// Every order for one SCBA serial (given as a normalized key), newest first, archived ones included.
export const fetchSerialHistory = async (serialKey) => {
  const { data, error } = await supabase
    .from('service_orders')
    .select('*, status_history(*)')
    .eq('is_scba', true)
    .eq('serial_key', serialKey)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(normalizeOrder)
}

// One row per order whose serial contains the search text. The caller groups them into units.
export const searchScbaSerials = async (serialKey) => {
  const { data, error } = await supabase
    .from('service_orders')
    .select('id, serial_number, serial_key, item_type, customer_name, company, status, created_at')
    .eq('is_scba', true)
    .ilike('serial_key', `%${serialKey}%`)
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) throw error
  return data
}
