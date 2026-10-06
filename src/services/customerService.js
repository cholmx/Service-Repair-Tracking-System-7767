import supabase from '../lib/supabase'
import { cleanSearchTerm, dedupeCustomers } from '../utils/customers'

const ROWS_TO_SCAN = 100

// Finds customers from past orders whose name, company or phone contains the search text.
export const searchCustomers = async (term) => {
  const clean = cleanSearchTerm(term)
  if (!clean) return []

  const { data, error } = await supabase
    .from('service_orders')
    .select('customer_name, customer_phone, customer_email, company')
    .or(`customer_name.ilike.%${clean}%,company.ilike.%${clean}%,customer_phone.ilike.%${clean}%`)
    .order('created_at', { ascending: false })
    .limit(ROWS_TO_SCAN)

  if (error) throw error
  return dedupeCustomers(data)
}
