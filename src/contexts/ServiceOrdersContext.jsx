import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import supabase from '../lib/supabase'
import { describeError } from '../utils/errors'
import {
  createOrders,
  deleteOrder,
  fetchActiveOrders,
  fetchArchivedOrders,
  updateOrder
} from '../services/orderService'
import { importOrders, orderToImportRow } from '../services/importService'

export const ServiceOrdersContext = createContext(null)

const REFETCH_AFTER_HIDDEN_MS = 30 * 1000
const REALTIME_DEBOUNCE_MS = 1000
const POLL_INTERVAL_MS = 60 * 1000

// Runs a database call and rethrows failures as errors with a readable message.
const friendly = async (call) => {
  try {
    return await call()
  } catch (err) {
    console.error(err)
    throw new Error(describeError(err))
  }
}

const sortBy = (list, key) => [...list].sort((a, b) => new Date(b[key]) - new Date(a[key]))

const withoutOrder = (list, id) => list.filter((item) => item.id !== id)

export const ServiceOrdersProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const [archivedItems, setArchivedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [archivedLoading, setArchivedLoading] = useState(false)
  const [archivedLoaded, setArchivedLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const archivedLoadedRef = useRef(false)
  const [liveStatus, setLiveStatus] = useState('CONNECTING')
  const hiddenAtRef = useRef(null)

  const loadActive = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const orders = await fetchActiveOrders()
      setItems(orders)
      setError(null)
    } catch (err) {
      console.error('Error loading service orders:', err)
      if (!silent) setError(describeError(err))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  // Archived orders are only fetched when a page needs them.
  const loadArchived = useCallback(async ({ force = false } = {}) => {
    if (archivedLoadedRef.current && !force) return
    try {
      setArchivedLoading(true)
      const orders = await fetchArchivedOrders()
      setArchivedItems(orders)
      archivedLoadedRef.current = true
      setArchivedLoaded(true)
    } catch (err) {
      console.error('Error loading archived service orders:', err)
      throw new Error(describeError(err))
    } finally {
      setArchivedLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await loadActive({ silent: true })
    if (archivedLoadedRef.current) await loadArchived({ force: true })
  }, [loadActive, loadArchived])

  useEffect(() => {
    loadActive()
  }, [loadActive])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      refresh().catch(() => {})
    }
    const handleOffline = () => setIsOnline(false)
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now()
      } else if (hiddenAtRef.current && Date.now() - hiddenAtRef.current > REFETCH_AFTER_HIDDEN_MS) {
        hiddenAtRef.current = null
        refresh().catch(() => {})
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [refresh])

  // Live updates: when another device changes an order, refetch shortly after. This needs the
  // tables in the supabase_realtime publication (see the enable_realtime migration). Without it
  // the subscription stays quiet and the polling below keeps the screen fresh instead.
  useEffect(() => {
    let timer
    const scheduleRefresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => refresh().catch(() => {}), REALTIME_DEBOUNCE_MS)
    }

    const channel = supabase
      .channel('service-orders-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'status_history' }, scheduleRefresh)
      .subscribe((status) => setLiveStatus(status))

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [refresh])

  useEffect(() => {
    if (liveStatus === 'SUBSCRIBED') return undefined
    const interval = setInterval(() => {
      if (!document.hidden && navigator.onLine) refresh().catch(() => {})
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [liveStatus, refresh])

  // Puts an order returned by the database into the right list.
  const applyOrder = useCallback((order) => {
    setItems((prev) => {
      const rest = withoutOrder(prev, order.id)
      return order.archived_at ? rest : sortBy([order, ...rest], 'created_at')
    })
    if (archivedLoadedRef.current) {
      setArchivedItems((prev) => {
        const rest = withoutOrder(prev, order.id)
        return order.archived_at ? sortBy([order, ...rest], 'archived_at') : rest
      })
    }
  }, [])

  const addItem = useCallback(async (formData) => {
    const orders = await friendly(() => createOrders(formData))
    orders.forEach(applyOrder)
    return { success: true, orders }
  }, [applyOrder])

  const updateItem = useCallback(async (id, updates) => {
    const { statusNotes, ...fields } = updates
    const order = await friendly(() => updateOrder(id, fields, statusNotes))
    applyOrder(order)
    return order
  }, [applyOrder])

  const archiveItem = useCallback(async (id) => {
    const order = await friendly(() => updateOrder(id, { status: 'archived' }, 'Service order archived'))
    applyOrder(order)
    return order
  }, [applyOrder])

  const restoreItem = useCallback(async (id, status) => {
    const order = await friendly(() => updateOrder(id, { status, archived_at: null }, 'Restored from archive'))
    applyOrder(order)
    return order
  }, [applyOrder])

  const deleteArchivedItem = useCallback(async (id) => {
    await friendly(() => deleteOrder(id))
    setArchivedItems((prev) => withoutOrder(prev, id))
  }, [])

  const restoreDeletedItem = useCallback(async (order) => {
    await friendly(() => importOrders([orderToImportRow(order)]))
    await refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      items,
      archivedItems,
      loading,
      archivedLoading,
      archivedLoaded,
      error,
      isOnline,
      isLive: liveStatus === 'SUBSCRIBED',
      retry: loadActive,
      loadArchived,
      addItem,
      updateItem,
      archiveItem,
      restoreItem,
      deleteArchivedItem,
      restoreDeletedItem,
      refresh
    }),
    [
      items,
      archivedItems,
      loading,
      archivedLoading,
      archivedLoaded,
      error,
      isOnline,
      liveStatus,
      loadActive,
      loadArchived,
      addItem,
      updateItem,
      archiveItem,
      restoreItem,
      deleteArchivedItem,
      restoreDeletedItem,
      refresh
    ]
  )

  return <ServiceOrdersContext.Provider value={value}>{children}</ServiceOrdersContext.Provider>
}
