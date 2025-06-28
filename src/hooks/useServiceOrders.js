import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useServiceOrders = () => {
  const [items, setItems] = useState([]);
  const [archivedItems, setArchivedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, userProfile, isTrialExpired } = useAuth();

  // Subscription limits
  const getItemLimit = () => {
    if (!userProfile) return 0;
    switch (userProfile.subscription_tier) {
      case 'pro':
        return 1000;
      case 'premium':
        return 5000;
      case 'free':
      default:
        return 50;
    }
  };

  const fetchServiceOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch active service orders
      const { data: activeOrders, error: activeError } = await supabase
        .from('service_orders_st847291')
        .select(`
          *,
          status_history:status_history_st847291(*)
        `)
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (activeError) throw activeError;

      // Fetch archived service orders
      const { data: archivedOrders, error: archivedError } = await supabase
        .from('service_orders_st847291')
        .select(`
          *,
          status_history:status_history_st847291(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'archived')
        .order('archived_at', { ascending: false });

      if (archivedError) throw archivedError;

      // Process the data to match the existing format
      const processedActive = activeOrders?.map(order => ({
        ...order,
        statusHistory: order.status_history || []
      })) || [];

      const processedArchived = archivedOrders?.map(order => ({
        ...order,
        statusHistory: order.status_history || []
      })) || [];

      setItems(processedActive);
      setArchivedItems(processedArchived);
    } catch (error) {
      console.error('Error fetching service orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceOrders();
  }, [user]);

  const addItem = async (formData) => {
    if (!user) throw new Error('User not authenticated');

    const itemLimit = getItemLimit();
    if (items.length >= itemLimit) {
      throw new Error(`You've reached your limit of ${itemLimit} service orders.`);
    }

    if (isTrialExpired && userProfile?.subscription_tier === 'free') {
      throw new Error('Your free trial has expired. Please upgrade to continue adding service orders.');
    }

    try {
      const newOrders = [];
      const statusHistoryEntries = [];

      // Create service orders for each item
      for (const [itemIndex, item] of formData.items.entries()) {
        const orderId = crypto.randomUUID();
        const order = {
          id: orderId,
          user_id: user.id,
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_email: formData.customerEmail || null,
          company: formData.company || null,
          item_type: item.itemType,
          quantity: item.quantity,
          description: item.description,
          urgency: formData.urgency,
          expected_completion: formData.expectedCompletion || null,
          status: 'received'
        };

        newOrders.push(order);
        statusHistoryEntries.push({
          service_order_id: orderId,
          status: 'received',
          notes: `${item.quantity} x ${item.itemType} received and logged into system`
        });
      }

      // Insert service orders
      const { data: insertedOrders, error: orderError } = await supabase
        .from('service_orders_st847291')
        .insert(newOrders)
        .select();

      if (orderError) throw orderError;

      // Insert status history
      const { error: historyError } = await supabase
        .from('status_history_st847291')
        .insert(statusHistoryEntries);

      if (historyError) throw historyError;

      // Refresh the data
      await fetchServiceOrders();

      return { success: true };
    } catch (error) {
      console.error('Error adding service orders:', error);
      throw error;
    }
  };

  const updateItem = async (id, updates) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const currentItem = items.find(item => item.id === id) || 
                         archivedItems.find(item => item.id === id);
      if (!currentItem) throw new Error('Item not found');

      // Prepare update data
      const updateData = { ...updates };
      delete updateData.statusNotes; // Remove this as it's not a column

      // Update the service order
      const { error: updateError } = await supabase
        .from('service_orders_st847291')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Add to status history if status changed
      if (updates.status && updates.status !== currentItem.status) {
        const { error: historyError } = await supabase
          .from('status_history_st847291')
          .insert([{
            service_order_id: id,
            status: updates.status,
            notes: updates.statusNotes || ''
          }]);

        if (historyError) throw historyError;
      }

      // Refresh the data
      await fetchServiceOrders();
    } catch (error) {
      console.error('Error updating service order:', error);
      throw error;
    }
  };

  const archiveItem = async (id) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update status to archived and set archived_at timestamp
      const { error: updateError } = await supabase
        .from('service_orders_st847291')
        .update({ 
          status: 'archived',
          archived_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Add to status history
      const { error: historyError } = await supabase
        .from('status_history_st847291')
        .insert([{
          service_order_id: id,
          status: 'archived',
          notes: 'Service order archived'
        }]);

      if (historyError) throw historyError;

      // Refresh the data
      await fetchServiceOrders();
    } catch (error) {
      console.error('Error archiving service order:', error);
      throw error;
    }
  };

  const deleteArchivedItem = async (id) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Delete the service order (status history will be deleted via CASCADE)
      const { error } = await supabase
        .from('service_orders_st847291')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('status', 'archived');

      if (error) throw error;

      // Refresh the data
      await fetchServiceOrders();
    } catch (error) {
      console.error('Error deleting archived order:', error);
      throw error;
    }
  };

  return {
    items,
    archivedItems,
    loading,
    addItem,
    updateItem,
    archiveItem,
    deleteArchivedItem,
    itemLimit: getItemLimit(),
    canAddMore: items.length < getItemLimit() && (!isTrialExpired || userProfile?.subscription_tier !== 'free'),
    refresh: fetchServiceOrders
  };
};