import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  const hiddenAtRef = useRef(null)

  const loadActive = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const orders = await fetchActiveOrders()
      setItems(orders)
      setError(null)
    } catch (err) {
      console.error('Error loading service orders:', err)
      if (!silent) setError(err.message || 'Failed to load service orders')
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
      throw err
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
    const handleOnline = () => setIsOnline(true)
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
    const orders = await createOrders(formData)
    orders.forEach(applyOrder)
    return { success: true, orders }
  }, [applyOrder])

  const updateItem = useCallback(async (id, updates) => {
    const { statusNotes, ...fields } = updates
    const order = await updateOrder(id, fields, statusNotes)
    applyOrder(order)
    return order
  }, [applyOrder])

  const archiveItem = useCallback(async (id) => {
    const order = await updateOrder(id, { status: 'archived' }, 'Service order archived')
    applyOrder(order)
    return order
  }, [applyOrder])

  const restoreItem = useCallback(async (id, status) => {
    const order = await updateOrder(id, { status, archived_at: null }, 'Restored from archive')
    applyOrder(order)
    return order
  }, [applyOrder])

  const deleteArchivedItem = useCallback(async (id) => {
    await deleteOrder(id)
    setArchivedItems((prev) => withoutOrder(prev, id))
  }, [])

  const restoreDeletedItem = useCallback(async (order) => {
    await importOrders([orderToImportRow(order)])
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
