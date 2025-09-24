import { useState, useEffect } from 'react'
import noCodeApi from '../lib/nocodeApi'
import orderIdGenerator from '../utils/orderIdGenerator'

export const useServiceOrdersNoCode = () => {
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

  // Load data from NoCode Backend on mount
  useEffect(() => {
    loadServiceOrders()
  }, [])

  const loadServiceOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Loading service orders from NoCode Backend...')

      // Load active service orders (not archived)
      const { data: activeOrders, error: activeError } = await noCodeApi.getActiveServiceOrders()
      
      if (activeError) {
        console.error('Active orders error:', activeError)
        throw activeError
      }

      // Load archived service orders
      const { data: archivedOrders, error: archivedError } = await noCodeApi.getArchivedServiceOrders()
      
      if (archivedError) {
        console.error('Archived orders error:', archivedError)
        throw archivedError
      }

      // Transform data to match expected format
      const transformOrder = (order) => ({
        ...order,
        // Ensure parts and labor are arrays
        parts: Array.isArray(order.parts) ? order.parts : (order.parts ? JSON.parse(order.parts) : []),
        labor: Array.isArray(order.labor) ? order.labor : (order.labor ? JSON.parse(order.labor) : []),
        // Add statusHistory placeholder (NoCode Backend doesn't have this table yet)
        statusHistory: []
      })

      setItems(activeOrders ? activeOrders.map(transformOrder) : [])
      setArchivedItems(archivedOrders ? archivedOrders.map(transformOrder) : [])

      console.log('Service orders loaded successfully:', {
        active: activeOrders?.length || 0,
        archived: archivedOrders?.length || 0
      })

    } catch (err) {
      console.error('Error loading service orders:', err)
      setError(err.message || 'Failed to load service orders')
    } finally {
      setLoading(false)
    }
  }

  // Add a new service order
  const addItem = async (formData) => {
    try {
      setError(null)
      const newOrders = []

      console.log('Adding service orders:', formData)

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
          archived_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Insert service order
        const { data: insertedOrder, error: insertError } = await noCodeApi.createServiceOrder(orderData)

        if (insertError) {
          console.error('Error inserting order:', insertError)
          throw insertError
        }

        const transformedOrder = {
          ...orderData,
          statusHistory: [{
            service_order_id: orderId,
            status: initialStatus,
            notes: item.needsQuote 
              ? `${item.quantity} x ${item.itemType} received and needs quote preparation`
              : `${item.quantity} x ${item.itemType} received and logged into system`,
            created_at: new Date().toISOString()
          }]
        }

        newOrders.push(transformedOrder)
      }

      // Update local state
      setItems(prev => [...newOrders, ...prev])

      console.log('Service orders created successfully:', newOrders.length)
      return { success: true }

    } catch (err) {
      console.error('Error adding service orders:', err)
      setError(err.message || 'Failed to add service order')
      throw err
    }
  }

  // Update an existing service order
  const updateItem = async (id, updates) => {
    try {
      setError(null)
      console.log('Updating service order:', id, updates)

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Remove statusNotes from the main update data (we don't have status history table yet)
      const statusNotes = updateData.statusNotes
      delete updateData.statusNotes

      // Update the service order
      const { data: updatedOrder, error: updateError } = await noCodeApi.updateServiceOrder(id, updateData)

      if (updateError) {
        console.error('Error updating order:', updateError)
        throw updateError
      }

      // Update local state for active items
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updateData }
          
          // Add status history entry locally (since we don't have the table yet)
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
      }))

      // Update local state for archived items
      setArchivedItems(prev => prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updateData }
          
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
      }))

      console.log('Service order updated successfully')

    } catch (err) {
      console.error('Error updating service order:', err)
      setError(err.message || 'Failed to update service order')
      throw err
    }
  }

  // Archive a service order
  const archiveItem = async (id) => {
    try {
      setError(null)
      console.log('Archiving service order:', id)

      const archiveDate = new Date().toISOString()

      // Update the service order to set archived_at
      const { data: archivedOrder, error: updateError } = await noCodeApi.updateServiceOrder(id, {
        status: 'archived',
        archived_at: archiveDate,
        updated_at: archiveDate
      })

      if (updateError) {
        console.error('Error archiving order:', updateError)
        throw updateError
      }

      // Move item from active to archived in local state
      const itemToArchive = items.find(item => item.id === id)
      if (itemToArchive) {
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

        setItems(prev => prev.filter(item => item.id !== id))
        setArchivedItems(prev => [archivedItem, ...prev])
      }

      console.log('Service order archived successfully')

    } catch (err) {
      console.error('Error archiving service order:', err)
      setError(err.message || 'Failed to archive service order')
      throw err
    }
  }

  // Delete an archived service order
  const deleteArchivedItem = async (id) => {
    try {
      setError(null)
      console.log('Deleting archived service order:', id)

      // Delete from NoCode Backend
      const { error: deleteError } = await noCodeApi.deleteServiceOrder(id)

      if (deleteError) {
        console.error('Error deleting archived order:', deleteError)
        throw deleteError
      }

      // Remove from local state
      setArchivedItems(prev => prev.filter(item => item.id !== id))

      console.log('Archived service order deleted successfully')

    } catch (err) {
      console.error('Error deleting archived order:', err)
      setError(err.message || 'Failed to delete archived service order')
      throw err
    }
  }

  // Refresh data from NoCode Backend
  const refresh = async () => {
    await loadServiceOrders()
  }

  // Get order ID generator stats (for debugging/admin purposes)
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