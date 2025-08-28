import { useState, useEffect } from 'react'
import orderIdGenerator from '../utils/orderIdGenerator'

export const useServiceOrders = () => {
  const [items, setItems] = useState([])
  const [archivedItems, setArchivedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load data from localStorage on mount
  useEffect(() => {
    loadServiceOrders()
  }, [])

  const loadServiceOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load from localStorage
      const activeOrdersData = localStorage.getItem('serviceTracker_activeOrders')
      const archivedOrdersData = localStorage.getItem('serviceTracker_archivedOrders')

      const activeOrders = activeOrdersData ? JSON.parse(activeOrdersData) : []
      const archivedOrders = archivedOrdersData ? JSON.parse(archivedOrdersData) : []

      // Transform data to ensure statusHistory exists
      const transformOrder = (order) => ({
        ...order,
        statusHistory: order.statusHistory || []
      })

      setItems(activeOrders.map(transformOrder))
      setArchivedItems(archivedOrders.map(transformOrder))
    } catch (err) {
      console.error('Error loading service orders:', err)
      setError('Failed to load service orders from local storage')
    } finally {
      setLoading(false)
    }
  }

  const saveToLocalStorage = (activeOrders, archivedOrders) => {
    try {
      localStorage.setItem('serviceTracker_activeOrders', JSON.stringify(activeOrders))
      localStorage.setItem('serviceTracker_archivedOrders', JSON.stringify(archivedOrders))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      setError('Failed to save data to local storage')
    }
  }

  // Add a new service order
  const addItem = async (formData) => {
    try {
      setError(null)
      const newOrders = []

      // Create service orders for each item
      for (const item of formData.items) {
        // Generate unique order ID using our generator
        const orderId = orderIdGenerator.generateOrderId()

        // Determine initial status based on needsQuote flag
        const initialStatus = item.needsQuote ? 'needs-quote' : 'received'

        const orderData = {
          id: orderId,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail || null,
          company: formData.company || null,
          item_type: item.itemType,
          serial_number: item.serialNumber || null,
          quantity: item.quantity,
          description: item.description,
          urgency: formData.urgency,
          expected_completion: formData.expectedCompletion || null,
          status: initialStatus,
          parts: [],
          labor: [],
          parts_total: 0,
          labor_total: 0,
          tax_rate: 0,
          tax: 0,
          subtotal: 0,
          total: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          statusHistory: [{
            service_order_id: orderId,
            status: initialStatus,
            notes: item.needsQuote 
              ? `${item.quantity} x ${item.itemType} received and needs quote preparation`
              : `${item.quantity} x ${item.itemType} received and logged into system`,
            created_at: new Date().toISOString()
          }]
        }

        newOrders.push(orderData)
      }

      // Update local state
      const updatedItems = [...newOrders, ...items]
      setItems(updatedItems)
      
      // Save to localStorage
      saveToLocalStorage(updatedItems, archivedItems)

      return { success: true }
    } catch (err) {
      console.error('Error adding service orders:', err)
      setError('Failed to add service order')
      throw err
    }
  }

  // Update an existing service order
  const updateItem = async (id, updates) => {
    try {
      setError(null)
      
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Remove statusNotes from the main update data
      const statusNotes = updateData.statusNotes
      delete updateData.statusNotes

      // Update active items
      const updatedItems = items.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updateData }
          
          // Add status history entry if status changed
          if (updates.status) {
            updated.statusHistory = [
              ...(item.statusHistory || []),
              {
                service_order_id: id,
                status: updates.status,
                notes: statusNotes || '',
                created_at: new Date().toISOString()
              }
            ]
          }
          return updated
        }
        return item
      })

      // Update archived items
      const updatedArchivedItems = archivedItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updateData }
          
          // Add status history entry if status changed
          if (updates.status) {
            updated.statusHistory = [
              ...(item.statusHistory || []),
              {
                service_order_id: id,
                status: updates.status,
                notes: statusNotes || '',
                created_at: new Date().toISOString()
              }
            ]
          }
          return updated
        }
        return item
      })

      setItems(updatedItems)
      setArchivedItems(updatedArchivedItems)
      
      // Save to localStorage
      saveToLocalStorage(updatedItems, updatedArchivedItems)
    } catch (err) {
      console.error('Error updating service order:', err)
      setError('Failed to update service order')
      throw err
    }
  }

  // Archive a service order
  const archiveItem = async (id) => {
    try {
      setError(null)
      const archiveDate = new Date().toISOString()

      // Find the item to archive
      const itemToArchive = items.find(item => item.id === id)
      if (!itemToArchive) return

      // Update the item with archive data
      const archivedItem = {
        ...itemToArchive,
        status: 'archived',
        archived_at: archiveDate,
        updated_at: archiveDate,
        statusHistory: [
          ...(itemToArchive.statusHistory || []),
          {
            service_order_id: id,
            status: 'archived',
            notes: 'Service order archived',
            created_at: archiveDate
          }
        ]
      }

      // Remove from active items and add to archived
      const updatedItems = items.filter(item => item.id !== id)
      const updatedArchivedItems = [archivedItem, ...archivedItems]

      setItems(updatedItems)
      setArchivedItems(updatedArchivedItems)
      
      // Save to localStorage
      saveToLocalStorage(updatedItems, updatedArchivedItems)
    } catch (err) {
      console.error('Error archiving service order:', err)
      setError('Failed to archive service order')
      throw err
    }
  }

  // Delete an archived service order
  const deleteArchivedItem = async (id) => {
    try {
      setError(null)
      
      // Remove from archived items
      const updatedArchivedItems = archivedItems.filter(item => item.id !== id)
      setArchivedItems(updatedArchivedItems)
      
      // Save to localStorage
      saveToLocalStorage(items, updatedArchivedItems)
    } catch (err) {
      console.error('Error deleting archived order:', err)
      setError('Failed to delete archived service order')
      throw err
    }
  }

  // Refresh data
  const refresh = async () => {
    await loadServiceOrders()
  }

  // Get order ID generator stats
  const getOrderIdStats = () => {
    return orderIdGenerator.getStats()
  }

  return {
    items,
    archivedItems,
    loading,
    error,
    isOnline,
    addItem,
    updateItem,
    archiveItem,
    deleteArchivedItem,
    refresh,
    getOrderIdStats
  }
}