import React from 'react';
import { FiEdit3, FiHash, FiPackage } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { Link } from 'react-router-dom';
import { inputClasses } from './styles';
import { scbaHistoryLink } from '../../utils/serial';


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
            <>
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
            <label className="flex items-center mt-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={Boolean(customerEditData.is_scba)}
                onChange={(e) => onCustomerField('is_scba', e.target.checked)}
                className="mr-2 h-4 w-4 text-primary-500 rounded border-neutral-300 focus:ring-primary-500"
              />
              SCBA (keep repair history for this unit)
            </label>
            </>
          ) : (
            <p className="font-medium">
              {item.quantity}x {item.item_type}
              {item.is_scba && (
                <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 align-middle">SCBA</span>
              )}
            </p>
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
            item.serial_number ? (
              scbaHistoryLink(item) ? (
                <Link to={scbaHistoryLink(item)} className="font-medium text-primary-600 hover:text-primary-700 underline">
                  {item.serial_number}
                </Link>
              ) : (
                <p className="font-medium">{item.serial_number}</p>
              )
            ) : (
              <p className="font-medium">Not specified</p>
            )
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
