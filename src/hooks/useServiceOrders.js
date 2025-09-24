import { useState, useEffect } from 'react'
import nocodeBackend from '../lib/nocodeBackend'
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

  // Load data from NoCode Backend on mount
  useEffect(() => {
    loadServiceOrders()
  }, [])

  const loadServiceOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Loading service orders from NoCode Backend...')

      // Load all service orders first
      const { data: allOrders, error: ordersError } = await nocodeBackend
        .from('service_orders_public_st847291')
        .select('*')
        .execute()

      if (ordersError) {
        console.error("Orders error:", ordersError)
        throw ordersError
      }

      console.log('Loaded orders:', allOrders)

      // Separate active and archived orders
      const activeOrders = (allOrders || []).filter(order => !order.archived_at)
      const archivedOrders = (allOrders || []).filter(order => order.archived_at)

      // Load status history for each order (if status history table exists)
      const loadStatusHistory = async (orders) => {
        return Promise.all(
          orders.map(async (order) => {
            try {
              // Use the correct ID field (service_id or id)
              const orderId = order.service_id || order.id
              const { data: history } = await nocodeBackend
                .from('status_history_public_st847291')
                .select('*')
                .eq('service_order_id', orderId)
                .execute()
              
              return {
                ...order,
                // Ensure we have a consistent ID field
                id: orderId,
                statusHistory: history || []
              }
            } catch (error) {
              console.error(`Error loading history for order ${order.id}:`, error)
              return {
                ...order,
                id: order.service_id || order.id,
                statusHistory: []
              }
            }
          })
        )
      }

      // Transform data to match expected format
      const activeOrdersWithHistory = await loadStatusHistory(activeOrders)
      const archivedOrdersWithHistory = await loadStatusHistory(archivedOrders)

      // Sort by creation date (newest first)
      activeOrdersWithHistory.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      archivedOrdersWithHistory.sort((a, b) => new Date(b.archived_at || b.created_at) - new Date(a.archived_at || a.created_at))

      setItems(activeOrdersWithHistory)
      setArchivedItems(archivedOrdersWithHistory)

      console.log('Service orders loaded:', {
        active: activeOrdersWithHistory.length,
        archived: archivedOrdersWithHistory.length
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
          service_id: orderId, // Use service_id as per API schema
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
          parts: JSON.stringify([]), // Store as JSON string
          labor: JSON.stringify([]), // Store as JSON string
          parts_total: 0,
          labor_total: 0,
          tax_rate: 0,
          tax: 0,
          subtotal: 0,
          total: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log('Creating order:', orderData)

        // Insert service order
        const { data: insertedOrder, error: insertError } = await nocodeBackend
          .from('service_orders_public_st847291')
          .insert([orderData])
          .select()
          .single()
          .execute()

        if (insertError) {
          console.error('Error inserting order:', insertError)
          throw insertError
        }

        console.log('Order created:', insertedOrder)

        // Add initial status history entry (if status history table exists)
        const statusNotes = item.needsQuote 
          ? `${item.quantity} x ${item.itemType} received and needs quote preparation`
          : `${item.quantity} x ${item.itemType} received and logged into system`

        try {
          const statusHistoryEntry = {
            service_order_id: orderId,
            status: initialStatus,
            notes: statusNotes,
            created_at: new Date().toISOString()
          }

          console.log('Creating status history entry:', statusHistoryEntry)

          const { error: statusError } = await nocodeBackend
            .from('status_history_public_st847291')
            .insert([statusHistoryEntry])
            .execute()

          if (statusError) {
            console.warn('Status history creation failed (table may not exist):', statusError)
          }
        } catch (statusErr) {
          console.warn('Status history not available:', statusErr)
        }

        newOrders.push({
          ...insertedOrder,
          id: orderId,
          parts: [],
          labor: [],
          statusHistory: [{
            service_order_id: orderId,
            status: initialStatus,
            notes: statusNotes,
            created_at: new Date().toISOString()
          }]
        })
      }

      // Update local state
      setItems(prev => [...newOrders, ...prev])
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
      
      console.log('Updating item:', id, updates)

      // Prepare update data
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Handle JSON fields
      if (updateData.parts && Array.isArray(updateData.parts)) {
        updateData.parts = JSON.stringify(updateData.parts)
      }
      if (updateData.labor && Array.isArray(updateData.labor)) {
        updateData.labor = JSON.stringify(updateData.labor)
      }

      // Remove statusNotes from the main update data
      const statusNotes = updateData.statusNotes
      delete updateData.statusNotes

      console.log('Update payload:', updateData)

      // Update the service order using service_id
      const { data: updatedOrder, error: updateError } = await nocodeBackend
        .from('service_orders_public_st847291')
        .update(updateData)
        .eq('service_id', id)
        .select()
        .single()
        .execute()

      if (updateError) {
        console.error('Error updating order:', updateError)
        throw updateError
      }

      console.log('Order updated:', updatedOrder)

      // Add status history entry if status changed
      if (updates.status) {
        try {
          const statusHistoryEntry = {
            service_order_id: id,
            status: updates.status,
            notes: statusNotes || '',
            created_at: new Date().toISOString()
          }

          console.log('Adding status history entry:', statusHistoryEntry)

          const { error: statusError } = await nocodeBackend
            .from('status_history_public_st847291')
            .insert([statusHistoryEntry])
            .execute()

          if (statusError) {
            console.warn('Status history creation failed:', statusError)
          }
        } catch (statusErr) {
          console.warn('Status history not available:', statusErr)
        }
      }

      // Parse JSON fields for local state
      const parsedUpdates = { ...updateData }
      if (parsedUpdates.parts && typeof parsedUpdates.parts === 'string') {
        try {
          parsedUpdates.parts = JSON.parse(parsedUpdates.parts)
        } catch (e) {
          parsedUpdates.parts = []
        }
      }
      if (parsedUpdates.labor && typeof parsedUpdates.labor === 'string') {
        try {
          parsedUpdates.labor = JSON.parse(parsedUpdates.labor)
        } catch (e) {
          parsedUpdates.labor = []
        }
      }

      // Update local state for active items
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...parsedUpdates }
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
          const updated = { ...item, ...parsedUpdates }
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
      const archiveDate = new Date().toISOString()

      console.log('Archiving item:', id)

      // Update the service order to set archived_at
      const { data: archivedOrder, error: updateError } = await nocodeBackend
        .from('service_orders_public_st847291')
        .update({
          status: 'archived',
          archived_at: archiveDate,
          updated_at: archiveDate
        })
        .eq('service_id', id)
        .select()
        .single()
        .execute()

      if (updateError) {
        console.error('Error archiving order:', updateError)
        throw updateError
      }

      console.log('Order archived:', archivedOrder)

      // Add archive entry to status history (if available)
      try {
        const statusHistoryEntry = {
          service_order_id: id,
          status: 'archived',
          notes: 'Service order archived',
          created_at: archiveDate
        }

        console.log('Adding archive status entry:', statusHistoryEntry)

        const { error: statusError } = await nocodeBackend
          .from('status_history_public_st847291')
          .insert([statusHistoryEntry])
          .execute()

        if (statusError) {
          console.warn('Archive status history failed:', statusError)
        }
      } catch (statusErr) {
        console.warn('Status history not available:', statusErr)
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

      console.log('Deleting archived item:', id)

      // Delete from NoCode Backend
      const { error: deleteError } = await nocodeBackend
        .from('service_orders_public_st847291')
        .delete()
        .eq('service_id', id)
        .execute()

      if (deleteError) {
        console.error('Error deleting archived order:', deleteError)
        throw deleteError
      }

      console.log('Archived order deleted:', id)

      // Remove from local state
      setArchivedItems(prev => prev.filter(item => item.id !== id))

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