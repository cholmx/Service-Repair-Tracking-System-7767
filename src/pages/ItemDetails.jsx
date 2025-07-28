import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useServiceOrders } from '../hooks/useServiceOrders';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import StatusBadge from '../components/StatusBadge';

const { FiArrowLeft, FiEdit3, FiSave, FiX, FiClock, FiUser, FiPhone, FiMail, FiPackage, FiBuilding, FiPlus, FiTrash2, FiPrinter, FiHash, FiShield } = FiIcons;

const ItemDetails = ({ onPrintReceipt }) => {
  const { id } = useParams();
  const { items, archivedItems, updateItem, loading } = useServiceOrders();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Find item in both active and archived items
  const allItems = [...items, ...archivedItems];
  const item = allItems.find(item => item.id === id);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading service order...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Service Order Not Found</h1>
          <Link to="/tracking" className="text-primary-600 hover:text-primary-700">
            ← Back to Tracking
          </Link>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditData({
      status: item.status,
      expected_completion: item.expected_completion || '',
      serial_number: item.serial_number || '',
      statusNotes: '',
      parts: item.parts || [],
      labor: item.labor || [],
      tax_rate: item.tax_rate || 0
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Calculate totals (only include non-warranty items)
      const partsTotal = editData.parts.reduce((sum, part) => {
        return sum + (part.isWarranty ? 0 : (part.quantity * part.price));
      }, 0);
      
      const laborTotal = editData.labor.reduce((sum, labor) => {
        return sum + (labor.isWarranty ? 0 : (labor.hours * labor.rate));
      }, 0);
      
      const subtotal = partsTotal + laborTotal;
      const tax = subtotal * (editData.tax_rate / 100);
      const total = subtotal + tax;

      const updateData = {
        status: editData.status,
        expected_completion: editData.expected_completion || null,
        serial_number: editData.serial_number || null,
        parts: editData.parts,
        labor: editData.labor,
        tax_rate: editData.tax_rate,
        parts_total: partsTotal,
        labor_total: laborTotal,
        subtotal,
        tax,
        total,
        statusNotes: editData.statusNotes || ''
      };

      console.log('Saving update data:', updateData);
      await updateItem(item.id, updateData);
      setIsEditing(false);
      setEditData({});

      // Show success message
      console.log('Service order updated successfully!');
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Failed to update service order. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const handlePrint = () => {
    onPrintReceipt(item);
  };

  const addPart = () => {
    setEditData(prev => ({
      ...prev,
      parts: [...prev.parts, { description: '', quantity: 1, price: 0, isWarranty: false }]
    }));
  };

  const removePart = (index) => {
    setEditData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const updatePart = (index, field, value) => {
    setEditData(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => 
        i === index ? 
          { ...part, [field]: field === 'quantity' || field === 'price' ? parseFloat(value) || 0 : value } : 
          part
      )
    }));
  };

  const togglePartWarranty = (index) => {
    setEditData(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => 
        i === index ? 
          { ...part, isWarranty: !part.isWarranty, price: !part.isWarranty ? 0 : part.price } : 
          part
      )
    }));
  };

  const addLabor = () => {
    setEditData(prev => ({
      ...prev,
      labor: [...prev.labor, { description: '', hours: 1, rate: 0, isWarranty: false }]
    }));
  };

  const removeLabor = (index) => {
    setEditData(prev => ({
      ...prev,
      labor: prev.labor.filter((_, i) => i !== index)
    }));
  };

  const updateLabor = (index, field, value) => {
    setEditData(prev => ({
      ...prev,
      labor: prev.labor.map((laborItem, i) => 
        i === index ? 
          { ...laborItem, [field]: field === 'hours' || field === 'rate' ? parseFloat(value) || 0 : value } : 
          laborItem
      )
    }));
  };

  const toggleLaborWarranty = (index) => {
    setEditData(prev => ({
      ...prev,
      labor: prev.labor.map((laborItem, i) => 
        i === index ? 
          { ...laborItem, isWarranty: !laborItem.isWarranty, rate: !laborItem.isWarranty ? 0 : laborItem.rate } : 
          laborItem
      )
    }));
  };

  const statusOptions = [
    { value: 'received', label: 'Received' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'waiting-parts', label: 'Waiting on Parts' },
    { value: 'ready', label: 'Ready for Pickup or Delivery' },
    { value: 'completed', label: 'Completed' }
  ];

  const inputClasses = "w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white";
  const canPrint = item.status === 'completed' || item.status === 'ready';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/tracking" className="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
              <SafeIcon icon={FiArrowLeft} className="mr-2" />
              Back to Tracking
            </Link>
            <div className="h-6 w-px bg-neutral-300" />
            <h1 className="text-2xl font-bold text-neutral-900">
              Service Order #{item.id}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {canPrint && (
              <button
                onClick={handlePrint}
                className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-lg"
              >
                <SafeIcon icon={FiPrinter} className="mr-2 text-sm" />
                Print Receipt
              </button>
            )}
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 shadow-lg"
              >
                <SafeIcon icon={FiEdit3} className="mr-2 text-sm" />
                Edit Status / Add Parts & Labor
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg"
                >
                  <SafeIcon icon={FiSave} className="mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg"
                >
                  <SafeIcon icon={FiX} className="mr-2" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Item Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Service Order Information</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <SafeIcon icon={FiPackage} className="text-primary-500 mr-3" />
                <div>
                  <span className="text-sm text-neutral-500">Service Order:</span>
                  <p className="font-medium">{item.quantity}x {item.item_type}</p>
                </div>
              </div>

              <div className="flex items-center">
                <SafeIcon icon={FiHash} className="text-primary-500 mr-3" />
                <div>
                  <span className="text-sm text-neutral-500">Serial Number:</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editData.serial_number || ''} 
                      onChange={(e) => setEditData(prev => ({...prev, serial_number: e.target.value}))} 
                      className={inputClasses}
                      placeholder="Enter serial number" 
                    />
                  ) : (
                    <p className="font-medium">{item.serial_number || 'Not specified'}</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <span className="text-sm text-neutral-500">Description:</span>
                <p className="mt-1 text-neutral-900 bg-neutral-50 p-3 rounded-lg">
                  {item.description}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Customer Information</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <SafeIcon icon={FiUser} className="text-primary-500 mr-3" />
                <div>
                  <span className="text-sm text-neutral-500">Name:</span>
                  {item.company ? (
                    <div>
                      <div className="font-medium text-neutral-900">{item.company}</div>
                      <div className="text-neutral-700">{item.customer_name}</div>
                    </div>
                  ) : (
                    <div className="font-medium text-neutral-900">{item.customer_name}</div>
                  )}
                </div>
              </div>
              
              {item.company && (
                <div className="flex items-center">
                  <SafeIcon icon={FiBuilding} className="text-primary-500 mr-3" />
                  <div>
                    <span className="text-sm text-neutral-500">Company:</span>
                    <p className="font-medium">{item.company}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <SafeIcon icon={FiPhone} className="text-primary-500 mr-3" />
                <div>
                  <span className="text-sm text-neutral-500">Phone:</span>
                  <p className="font-medium">{item.customer_phone}</p>
                </div>
              </div>

              {item.customer_email && (
                <div className="flex items-center">
                  <SafeIcon icon={FiMail} className="text-primary-500 mr-3" />
                  <div>
                    <span className="text-sm text-neutral-500">Email:</span>
                    <p className="font-medium">{item.customer_email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status and Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Status & Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-sm text-neutral-500">Current Status:</span>
              {isEditing ? (
                <select
                  value={editData.status}
                  onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                  className={inputClasses}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1">
                  <StatusBadge status={item.status} />
                </div>
              )}
            </div>
            <div>
              <span className="text-sm text-neutral-500">Expected Completion:</span>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.expected_completion}
                  onChange={(e) => setEditData(prev => ({ ...prev, expected_completion: e.target.value }))}
                  className={inputClasses}
                />
              ) : (
                <p className="mt-1 font-medium">
                  {item.expected_completion ? new Date(item.expected_completion).toLocaleDateString() : 'Not set'}
                </p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="mt-6">
              <label className="block text-sm text-neutral-500 mb-2">Status Update Notes:</label>
              <textarea
                value={editData.statusNotes}
                onChange={(e) => setEditData(prev => ({ ...prev, statusNotes: e.target.value }))}
                className={inputClasses}
                rows={3}
                placeholder="Add notes about this status update..."
              />
            </div>
          )}
        </div>

        {/* Parts Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">Parts Used</h2>
            {isEditing && (
              <button
                onClick={addPart}
                className="flex items-center px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm"
              >
                <SafeIcon icon={FiPlus} className="mr-2" />
                Add Part
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {editData.parts.map((part, index) => (
                <div key={index} className="grid grid-cols-1 gap-4 p-4 bg-neutral-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-neutral-500 mb-1">Description</label>
                      <input
                        type="text"
                        value={part.description}
                        onChange={(e) => updatePart(index, 'description', e.target.value)}
                        className={inputClasses}
                        placeholder="Part description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-500 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={part.quantity}
                        onChange={(e) => updatePart(index, 'quantity', e.target.value)}
                        className={inputClasses}
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-500 mb-1">Price ($)</label>
                      <input
                        type="number"
                        value={part.price}
                        onChange={(e) => updatePart(index, 'price', e.target.value)}
                        className={inputClasses}
                        min="0"
                        step="0.01"
                        disabled={part.isWarranty}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-sm text-neutral-500 mb-1">Warranty</label>
                      <button
                        type="button"
                        onClick={() => togglePartWarranty(index)}
                        className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          part.isWarranty 
                            ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                            : 'bg-neutral-100 text-neutral-700 border-2 border-neutral-300 hover:bg-neutral-200'
                        }`}
                      >
                        <SafeIcon icon={FiShield} className="mr-2" />
                        {part.isWarranty ? 'Warranty' : 'Regular'}
                      </button>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removePart(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {item.parts && item.parts.length > 0 ? (
                <div className="space-y-3">
                  {item.parts.map((part, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{part.description}</p>
                          {part.isWarranty && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <SafeIcon icon={FiShield} className="mr-1 text-xs" />
                              Warranty
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">
                          Qty: {part.quantity} {part.isWarranty ? '(Under Warranty)' : `@ $${part.price.toFixed(2)} each`}
                        </p>
                      </div>
                      <p className="font-medium">
                        {part.isWarranty ? 'Warranty' : `$${(part.quantity * part.price).toFixed(2)}`}
                      </p>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Parts Total:</span>
                      <span>${item.parts_total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-8">No parts added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Labor Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">Labor</h2>
            {isEditing && (
              <button
                onClick={addLabor}
                className="flex items-center px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm"
              >
                <SafeIcon icon={FiPlus} className="mr-2" />
                Add Labor
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {editData.labor.map((laborItem, index) => (
                <div key={index} className="grid grid-cols-1 gap-4 p-4 bg-neutral-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-neutral-500 mb-1">Service Description</label>
                      <input
                        type="text"
                        value={laborItem.description}
                        onChange={(e) => updateLabor(index, 'description', e.target.value)}
                        className={inputClasses}
                        placeholder="Service description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-500 mb-1">Hours</label>
                      <input
                        type="number"
                        value={laborItem.hours}
                        onChange={(e) => updateLabor(index, 'hours', e.target.value)}
                        className={inputClasses}
                        min="0"
                        step="0.25"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-500 mb-1">Rate ($/hr)</label>
                      <input
                        type="number"
                        value={laborItem.rate}
                        onChange={(e) => updateLabor(index, 'rate', e.target.value)}
                        className={inputClasses}
                        min="0"
                        step="0.01"
                        disabled={laborItem.isWarranty}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="block text-sm text-neutral-500 mb-1">Warranty</label>
                      <button
                        type="button"
                        onClick={() => toggleLaborWarranty(index)}
                        className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          laborItem.isWarranty 
                            ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                            : 'bg-neutral-100 text-neutral-700 border-2 border-neutral-300 hover:bg-neutral-200'
                        }`}
                      >
                        <SafeIcon icon={FiShield} className="mr-2" />
                        {laborItem.isWarranty ? 'Warranty' : 'Regular'}
                      </button>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeLabor(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <label className="block text-sm text-neutral-500 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  value={editData.tax_rate}
                  onChange={(e) => setEditData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-32 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : (
            <div>
              {item.labor && item.labor.length > 0 ? (
                <div className="space-y-3">
                  {item.labor.map((laborItem, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{laborItem.description}</p>
                          {laborItem.isWarranty && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <SafeIcon icon={FiShield} className="mr-1 text-xs" />
                              Warranty
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">
                          {laborItem.hours} hours {laborItem.isWarranty ? '(Under Warranty)' : `@ $${laborItem.rate.toFixed(2)}/hr`}
                        </p>
                      </div>
                      <p className="font-medium">
                        {laborItem.isWarranty ? 'Warranty' : `$${(laborItem.hours * laborItem.rate).toFixed(2)}`}
                      </p>
                    </div>
                  ))}
                  <div className="border-t pt-3 mt-3 space-y-2">
                    <div className="flex justify-between">
                      <span>Labor Total:</span>
                      <span>${item.labor_total?.toFixed(2) || '0.00'}</span>
                    </div>
                    {item.tax > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({item.tax_rate}%):</span>
                        <span>${item.tax?.toFixed(2) || '0.00'}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${item.total?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-8">No labor added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Status History */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Status History</h2>
          <div className="space-y-4">
            {item.statusHistory?.map((entry, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-neutral-50 rounded-lg">
                <SafeIcon icon={FiClock} className="text-primary-500 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={entry.status} />
                    <span className="text-sm text-neutral-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="mt-1 text-neutral-700">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ItemDetails;