import { useState } from 'react'
import {
  LABOR_NUMERIC_FIELDS,
  PARTS_NUMERIC_FIELDS,
  addLine,
  newLabor,
  newPart,
  removeLine,
  toggleWarranty,
  updateLine
} from '../utils/lineItems'

// Edit state and save handlers for the order details page. There are two independent
// edit modes: the status / parts / labor editor, and the customer / item details editor.
export const useOrderEditor = (item, updateItem) => {
  const [editData, setEditData] = useState(null)
  const [customerEditData, setCustomerEditData] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const isEditing = editData !== null
  const isEditingCustomer = customerEditData !== null

  const startEdit = () =>
    setEditData({
      status: item.status,
      expected_completion: item.expected_completion || '',
      serial_number: item.serial_number || '',
      statusNotes: '',
      parts: item.parts || [],
      labor: item.labor || [],
      tax_rate: item.tax_rate || 0
    })

  const cancelEdit = () => setEditData(null)

  const setEditField = (field, value) => setEditData((prev) => ({ ...prev, [field]: value }))

  const saveEdit = async () => {
    // A quote cannot go to the customer with nothing on it.
    let statusNotes = editData.statusNotes || ''
    if (item.status === 'needs-quote' && editData.status === 'quote-approval') {
      if (editData.parts.length === 0 && editData.labor.length === 0) {
        alert('Please add parts or labor to the quote before changing status to "Awaiting Quote Approval"')
        return
      }
      if (!statusNotes) {
        statusNotes = 'Quote prepared and awaiting customer approval'
      }
    }

    try {
      setIsSaving(true)
      // Totals are calculated by the database from parts, labor and tax rate.
      await updateItem(item.id, {
        status: editData.status,
        expected_completion: editData.expected_completion || null,
        serial_number: editData.serial_number || null,
        parts: editData.parts,
        labor: editData.labor,
        tax_rate: editData.tax_rate,
        statusNotes
      })
      setEditData(null)
    } catch (error) {
      console.error('Failed to update item:', error)
      alert('Failed to update service order. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const startEditCustomer = () =>
    setCustomerEditData({
      customer_name: item.customer_name,
      customer_phone: item.customer_phone,
      customer_email: item.customer_email || '',
      company: item.company || '',
      item_type: item.item_type,
      quantity: item.quantity,
      description: item.description,
      serial_number: item.serial_number || ''
    })

  const cancelEditCustomer = () => setCustomerEditData(null)

  const setCustomerField = (field, value) => setCustomerEditData((prev) => ({ ...prev, [field]: value }))

  const saveCustomer = async () => {
    try {
      setIsSaving(true)
      await updateItem(item.id, {
        customer_name: customerEditData.customer_name,
        customer_phone: customerEditData.customer_phone,
        customer_email: customerEditData.customer_email || null,
        company: customerEditData.company || null,
        item_type: customerEditData.item_type,
        quantity: customerEditData.quantity,
        description: customerEditData.description,
        serial_number: customerEditData.serial_number || null
      })
      setCustomerEditData(null)
    } catch (error) {
      console.error('Failed to update customer information:', error)
      alert('Failed to update customer information. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const parts = {
    add: () => setEditData((prev) => ({ ...prev, parts: addLine(prev.parts, newPart()) })),
    remove: (index) => setEditData((prev) => ({ ...prev, parts: removeLine(prev.parts, index) })),
    change: (index, field, value) =>
      setEditData((prev) => ({ ...prev, parts: updateLine(prev.parts, index, field, value, PARTS_NUMERIC_FIELDS) })),
    toggleWarranty: (index) =>
      setEditData((prev) => ({ ...prev, parts: toggleWarranty(prev.parts, index, 'price') }))
  }

  const labor = {
    add: () => setEditData((prev) => ({ ...prev, labor: addLine(prev.labor, newLabor()) })),
    remove: (index) => setEditData((prev) => ({ ...prev, labor: removeLine(prev.labor, index) })),
    change: (index, field, value) =>
      setEditData((prev) => ({ ...prev, labor: updateLine(prev.labor, index, field, value, LABOR_NUMERIC_FIELDS) })),
    toggleWarranty: (index) =>
      setEditData((prev) => ({ ...prev, labor: toggleWarranty(prev.labor, index, 'rate') }))
  }

  return {
    isEditing,
    isEditingCustomer,
    isSaving,
    editData,
    customerEditData,
    startEdit,
    cancelEdit,
    saveEdit,
    setEditField,
    startEditCustomer,
    cancelEditCustomer,
    saveCustomer,
    setCustomerField,
    parts,
    labor
  }
}
