import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { inputClasses } from './styles';

const { FiEdit3, FiPackage, FiHash } = FiIcons;

export const EditButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors duration-200"
  >
    <SafeIcon icon={FiEdit3} className="mr-1 text-xs" />
    Edit
  </button>
);

// Serial number is editable from either edit mode, so it reads from whichever draft is active.
const OrderInfoCard = ({
  item,
  isEditing,
  isEditingCustomer,
  editData,
  customerEditData,
  onEditField,
  onCustomerField,
  onEdit
}) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-neutral-900">Service Order Information</h2>
      {!isEditing && !isEditingCustomer && <EditButton onClick={onEdit} />}
    </div>
    <div className="space-y-4">
      <div className="flex items-center">
        <SafeIcon icon={FiPackage} className="text-primary-500 mr-3" />
        <div>
          <span className="text-sm text-neutral-500">Service Order:</span>
          {isEditingCustomer ? (
            <div className="flex items-center mt-1 space-x-2">
              <input
                type="number"
                value={customerEditData.quantity}
                onChange={(e) => onCustomerField('quantity', parseInt(e.target.value) || 1)}
                className={`${inputClasses} w-16`}
                min="1"
              />
              <span className="text-neutral-700">x</span>
              <input
                type="text"
                value={customerEditData.item_type}
                onChange={(e) => onCustomerField('item_type', e.target.value)}
                className={inputClasses}
                placeholder="Item type"
              />
            </div>
          ) : (
            <p className="font-medium">{item.quantity}x {item.item_type}</p>
          )}
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
              onChange={(e) => onEditField('serial_number', e.target.value)}
              className={inputClasses}
              placeholder="Enter serial number"
            />
          ) : isEditingCustomer ? (
            <input
              type="text"
              value={customerEditData.serial_number || ''}
              onChange={(e) => onCustomerField('serial_number', e.target.value)}
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
        {isEditingCustomer ? (
          <textarea
            value={customerEditData.description}
            onChange={(e) => onCustomerField('description', e.target.value)}
            rows={3}
            className={`${inputClasses} mt-1 w-full`}
            placeholder="Describe the issue or service needed..."
          />
        ) : (
          <p className="mt-1 text-neutral-900 bg-neutral-50 p-3 rounded-lg">{item.description}</p>
        )}
      </div>
    </div>
  </div>
);

export default OrderInfoCard;
