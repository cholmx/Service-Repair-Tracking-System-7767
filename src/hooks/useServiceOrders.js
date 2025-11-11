import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import orderIdGenerator from '../utils/orderIdGenerator'

export const useServiceOrders = () => {
  const [items, setItems] = useState([])
  const [archivedItems, setArchivedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

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

  useEffect(() => {
    loadServiceOrders()
  }, [])

  const loadServiceOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Loading service orders from Supabase...')

      const { data: activeOrders, error: activeError } = await supabase
        .from('service_orders')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: false })

      if (activeError) {
        console.error('Active orders error:', activeError)
        throw activeError
      }

      const { data: archivedOrders, error: archivedError } = await supabase
        .from('service_orders')
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (archivedError) {
        console.error('Archived orders error:', archivedError)
        throw archivedError
      }

      const transformOrder = async (order) => {
        const { data: history, error: historyError } = await supabase
          .from('status_history')
          .select('*')
          .eq('service_order_id', order.id)
          .order('created_at', { ascending: true })

        return {
          ...order,
          statusHistory: history || []
        }
      }

      const transformedActive = await Promise.all((activeOrders || []).map(transformOrder))
      const transformedArchived = await Promise.all((archivedOrders || []).map(transformOrder))

      setItems(transformedActive)
      setArchivedItems(transformedArchived)

      console.log('Service orders loaded successfully:', {
        active: transformedActive.length,
        archived: transformedArchived.length
      })

    } catch (err) {
      console.error('Error loading service orders:', err)
      setError(err.message || 'Failed to load service orders')
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (formData) => {
    try {
      setError(null)
      const newOrders = []

      console.log('Adding service orders:', formData)

      for (const item of formData.items) {
        const orderId = orderIdGenerator.generateOrderId()
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
          archived_at: null
        }

        const { data: insertedOrder, error: insertError } = await supabase
          .from('service_orders')
          .insert(orderData)
          .select()
          .single()

        if (insertError) {
          console.error('Error inserting order:', insertError)
          throw insertError
        }

        const statusNote = item.needsQuote
          ? `${item.quantity} x ${item.itemType} received and needs quote preparation`
          : `${item.quantity} x ${item.itemType} received and logged into system`

        const { error: historyError } = await supabase
          .from('status_history')
          .insert({
            service_order_id: orderId,
            status: initialStatus,
            notes: statusNote
          })

        if (historyError) {
          console.error('Error inserting status history:', historyError)
        }

        newOrders.push({
          ...insertedOrder,
          statusHistory: [{
            service_order_id: orderId,
            status: initialStatus,
            notes: statusNote,
            created_at: new Date().toISOString()
          }]
        })
      }

      setItems(prev => [...newOrders, ...prev])

      console.log('Service orders created successfully:', newOrders.length)
      return { success: true }

    } catch (err) {
      console.error('Error adding service orders:', err)
      setError(err.message || 'Failed to add service order')
      throw err
    }
  }

  const updateItem = async (id, updates) => {
    try {
      setError(null)
      console.log('Updating service order:', id, updates)

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const statusNotes = updateData.statusNotes
      delete updateData.statusNotes

      const { data: updatedOrder, error: updateError } = await supabase
        .from('service_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating order:', updateError)
        throw updateError
      }

      if (updates.status) {
        const { error: historyError } = await supabase
          .from('status_history')
          .insert({
            service_order_id: id,
            status: updates.status,
            notes: statusNotes || ''
          })

        if (historyError) {
          console.error('Error inserting status history:', historyError)
        }
      }

      setItems(prev => prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates }

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

      setArchivedItems(prev => prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates }

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

  const archiveItem = async (id) => {
    try {
      setError(null)
      console.log('Archiving service order:', id)

      const archiveDate = new Date().toISOString()

      const { data: archivedOrder, error: updateError } = await supabase
        .from('service_orders')
        .update({
          status: 'archived',
          archived_at: archiveDate,
          updated_at: archiveDate
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Error archiving order:', updateError)
        throw updateError
      }

      const { error: historyError } = await supabase
        .from('status_history')
        .insert({
          service_order_id: id,
          status: 'archived',
          notes: 'Service order archived'
        })

      if (historyError) {
        console.error('Error inserting status history:', historyError)
      }

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

  const deleteArchivedItem = async (id) => {
    try {
      setError(null)
      console.log('Deleting archived service order:', id)

      const { error: deleteError } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Error deleting archived order:', deleteError)
        throw deleteError
      }

      setArchivedItems(prev => prev.filter(item => item.id !== id))

      console.log('Archived service order deleted successfully')

    } catch (err) {
      console.error('Error deleting archived order:', err)
      setError(err.message || 'Failed to delete archived service order')
      throw err
    }
  }

  const refresh = async () => {
    await loadServiceOrders()
  }

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
