import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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

  // Load data from Supabase on mount
  useEffect(() => {
    loadServiceOrders()
  }, [])

  const loadServiceOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load active service orders (not archived)
      const { data: activeOrders, error: activeError } = await supabase
        .from('service_orders_public_st847291')
        .select(`
          *,
          status_history:status_history_public_st847291(*)
        `)
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (activeError) {
        console.error("Active orders error:", activeError);
        throw activeError;
      }

      // Load archived service orders
      const { data: archivedOrders, error: archivedError } = await supabase
        .from('service_orders_public_st847291')
        .select(`
          *,
          status_history:status_history_public_st847291(*)
        `)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (archivedError) {
        console.error("Archived orders error:", archivedError);
        throw archivedError;
      }

      // Transform data to match expected format
      const transformOrder = (order) => ({
        ...order,
        statusHistory: order.status_history || []
      })

      setItems(activeOrders ? activeOrders.map(transformOrder) : [])
      setArchivedItems(archivedOrders ? archivedOrders.map(transformOrder) : [])
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

      // Create service orders for each item
      for (const item of formData.items) {
        // Generate unique order ID using our generator
        const orderId = orderIdGenerator.generateOrderId()

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
          status: 'received',
          parts: [],
          labor: [],
          parts_total: 0,
          labor_total: 0,
          tax_rate: 0,
          tax: 0,
          subtotal: 0,
          total: 0
        }

        // Insert service order
        const { data: insertedOrder, error: insertError } = await supabase
          .from('service_orders_public_st847291')
          .insert([orderData])
          .select()
          .single()

        if (insertError) {
          console.error('Error inserting order:', insertError);
          throw insertError;
        }

        // Add initial status history entry
        const statusHistoryEntry = {
          service_order_id: orderId,
          status: 'received',
          notes: `${item.quantity} x ${item.itemType} received and logged into system`
        };
        console.log('Creating status history entry:', statusHistoryEntry);

        const { error: statusError } = await supabase
          .from('status_history_public_st847291')
          .insert([statusHistoryEntry])

        if (statusError) {
          console.error('Error inserting status history:', statusError);
          throw statusError;
        }

        newOrders.push({
          ...insertedOrder,
          statusHistory: [{
            service_order_id: orderId,
            status: 'received',
            notes: `${item.quantity} x ${item.itemType} received and logged into system`,
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

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      // Remove statusNotes from the main update data
      const statusNotes = updateData.statusNotes
      delete updateData.statusNotes

      // Update the service order
      const { data: updatedOrder, error: updateError } = await supabase
        .from('service_orders_public_st847291')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating order:', updateError);
        throw updateError;
      }

      // Add status history entry if status changed
      if (updates.status) {
        const statusHistoryEntry = {
          service_order_id: id,
          status: updates.status,
          notes: statusNotes || ''
        };
        console.log('Adding status history entry:', statusHistoryEntry);

        const { error: statusError } = await supabase
          .from('status_history_public_st847291')
          .insert([statusHistoryEntry])

        if (statusError) {
          console.error('Error inserting status history:', statusError);
          throw statusError;
        }
      }

      // Update local state for active items
      setItems(prev => prev.map(item => {
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

      // Update the service order to set archived_at
      const { data: archivedOrder, error: updateError } = await supabase
        .from('service_orders_public_st847291')
        .update({
          status: 'archived',
          archived_at: archiveDate,
          updated_at: archiveDate
        })
        .eq('id', id)
        .select(`
          *,
          status_history:status_history_public_st847291(*)
        `)
        .single()

      if (updateError) {
        console.error('Error archiving order:', updateError);
        throw updateError;
      }

      // Add archive entry to status history
      const statusHistoryEntry = {
        service_order_id: id,
        status: 'archived',
        notes: 'Service order archived'
      };
      console.log('Adding archive status entry:', statusHistoryEntry);

      const { error: statusError } = await supabase
        .from('status_history_public_st847291')
        .insert([statusHistoryEntry])

      if (statusError) {
        console.error('Error inserting archive status:', statusError);
        throw statusError;
      }

      // Move item from active to archived in local state
      const itemToArchive = items.find(item => item.id === id)
      if (itemToArchive) {
        const archivedItem = {
          ...archivedOrder,
          statusHistory: [
            ...(archivedOrder.status_history || []),
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

      // Delete from Supabase (status history will be deleted automatically due to CASCADE)
      const { error: deleteError } = await supabase
        .from('service_orders_public_st847291')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting archived order:', deleteError);
        throw deleteError;
      }

      // Remove from local state
      setArchivedItems(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error('Error deleting archived order:', err)
      setError(err.message || 'Failed to delete archived service order')
      throw err
    }
  }

  // Refresh data from Supabase
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