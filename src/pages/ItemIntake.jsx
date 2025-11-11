import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useServiceOrders } from '../hooks/useServiceOrders';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import LoadingSkeleton from '../components/LoadingSkeleton';

const { FiUser, FiPhone, FiMail, FiPackage, FiFileText, FiCalendar, FiSave, FiPlus, FiMinus, FiHome, FiHash, FiDollarSign } = FiIcons;

const ItemIntake = () => {
  const navigate = useNavigate();
  const { addItem, loading: serviceLoading } = useServiceOrders();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    company: '',
    items: [
      { itemType: '', quantity: 1, serialNumber: '', description: '', needsQuote: false }
    ],
    urgency: 'normal',
    expectedCompletion: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
    
    // Clear errors for this item
    const errorKey = `items.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const toggleNeedsQuote = (index) => {
    const newItems = [...formData.items];
    newItems[index] = { 
      ...newItems[index], 
      needsQuote: !newItems[index].needsQuote 
    };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItemToForm = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { itemType: '', quantity: 1, serialNumber: '', description: '', needsQuote: false }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Customer validation
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (!formData.customerPhone.trim()) newErrors.customerPhone = 'Phone number is required';

    // Items validation
    formData.items.forEach((item, index) => {
      if (!item.itemType.trim()) {
        newErrors[`items.${index}.itemType`] = 'Item type is required';
      }
      if (!item.quantity || item.quantity < 1) {
        newErrors[`items.${index}.quantity`] = 'Quantity must be at least 1';
      }
      if (!item.description.trim()) {
        newErrors[`items.${index}.description`] = 'Description is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // Check if any items need quotes and set initial status accordingly
        const processedItems = formData.items.map(item => {
          // If item needs a quote, we'll let the backend know
          return {
            ...item,
            initialStatus: item.needsQuote ? 'needs-quote' : 'received'
          };
        });

        await addItem({
          ...formData,
          items: processedItems
        });
        
        navigate('/dashboard');
      } catch (error) {
        setErrors({ general: error.message || 'Failed to create service orders. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const inputClasses = "w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white";
  const errorClasses = "border-red-300 focus:ring-red-500";

  if (serviceLoading) {
    return <LoadingSkeleton type="default" />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Service Order Intake</h1>
          <p className="text-neutral-600">Register new Service Orders for repair service</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {/* General Error */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Customer Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 border-b border-neutral-200 pb-2 mb-6">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="flex items-center text-sm font-medium text-neutral-700 mb-2">
                  <SafeIcon icon={FiUser} className="mr-2 text-primary-500" />
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className={`${inputClasses} ${errors.customerName ? errorClasses : ''}`}
                  placeholder="Enter customer name"
                />
                {errors.customerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                )}
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-neutral-700 mb-2">
                  <SafeIcon icon={FiHome} className="mr-2 text-primary-500" />
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Enter company name (optional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-neutral-700 mb-2">
                  <SafeIcon icon={FiPhone} className="mr-2 text-primary-500" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className={`${inputClasses} ${errors.customerPhone ? errorClasses : ''}`}
                  placeholder="Enter phone number"
                />
                {errors.customerPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
                )}
              </div>
              <div>
                <label className="flex items-center text-sm font-medium text-neutral-700 mb-2">
                  <SafeIcon icon={FiMail} className="mr-2 text-primary-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className={inputClasses}
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>

          {/* Items Information */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 border-b border-neutral-200 pb-2">Items Information</h2>
              <button
                type="button"
                onClick={addItemToForm}
                className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm font-medium"
              >
                <SafeIcon icon={FiPlus} className="mr-2" />
                Add Item to Service Order
              </button>
            </div>
            <div className="space-y-6">
              {formData.items.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border border-neutral-200 rounded-lg p-6 bg-neutral-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-neutral-900">Item {index + 1}</h3>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="flex items-center px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 text-sm"
                      >
                        <SafeIcon icon={FiMinus} className="mr-1" />
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="flex items-center text-sm font-medium text-neutral-700 mb-2">
                        <SafeIcon icon={FiPackage} className="mr-2 text-primary-500" />
                        Item Type *
                      </label>
                      <input
                        type="text"
                        value={item.itemType}
                        onChange={(e) => handleItemChange(index, 'itemType', e.target.value)}
                        className={`${inputClasses} ${errors[`items.${index}.itemType`] ? errorClasses : ''}`}
                        placeholder="Enter item type"
                      />
                      {errors[`items.${index}.itemType`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`items.${index}.itemType`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className={`${inputClasses} ${errors[`items.${index}.quantity`] ? errorClasses : ''}`}
                        min="1"
                        placeholder="1"
                      />
                      {errors[`items.${index}.quantity`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`items.${index}.quantity`]}</p>
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center text-sm font-medium text-neutral-700 mb-2">
                      <SafeIcon icon={FiHash} className="mr-2 text-primary-500" />
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={item.serialNumber || ''}
                      onChange={(e) => handleItemChange(index, 'serialNumber', e.target.value)}
                      className={inputClasses}
                      placeholder="Enter serial number (optional)"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center text-sm font-medium text-neutral-700 mb-2">
                      <SafeIcon icon={FiFileText} className="mr-2 text-primary-500" />
                      Description *
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      rows={3}
                      className={`${inputClasses} ${errors[`items.${index}.description`] ? errorClasses : ''}`}
                      placeholder="Describe the issue or service needed..."
                    />
                    {errors[`items.${index}.description`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`items.${index}.description`]}</p>
                    )}
                  </div>
                  
                  {/* Quote Needed Button */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => toggleNeedsQuote(index)}
                      className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                        item.needsQuote
                          ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      <SafeIcon icon={FiDollarSign} className="mr-2" />
                      {item.needsQuote ? 'Quote Needed' : 'Mark as Needs Quote'}
                    </button>
                    {item.needsQuote && (
                      <p className="mt-2 text-sm text-purple-600">
                        This item will be marked for a technician to prepare a quote before proceeding
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Overall Priority</label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className={inputClasses}
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="flex items-center text-sm font-medium text-neutral-700 mb-2">
                <SafeIcon icon={FiCalendar} className="mr-2 text-primary-500" />
                Expected Completion
              </label>
              <input
                type="date"
                name="expectedCompletion"
                value={formData.expectedCompletion}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2 shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <SafeIcon icon={FiSave} />
              <span>{isSubmitting ? 'Creating...' : 'Register Service Order'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ItemIntake;