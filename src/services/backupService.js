import supabase from '../lib/supabase'

// The list leaves out the snapshot itself, which can be large.
export const listBackups = async () => {
  const { data, error } = await supabase
    .from('service_order_backups')
    .select('id, created_at, source, order_count, history_count, size_bytes')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// The snapshot is in the same format the Settings export produces.
export const getBackupFile = async (id) => {
  const { data, error } = await supabase.from('service_order_backups').select('data').eq('id', id)
  if (error) throw error
  if (!data.length) throw new Error('That backup no longer exists.')
  return data[0].data
}

export const createBackup = async () => {
  const { data, error } = await supabase.rpc('create_backup')
  if (error) throw error
  return data
}
