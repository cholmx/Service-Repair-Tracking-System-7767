import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit3, FiPrinter, FiSave, FiX } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';


const OrderHeader = ({
  item,
  needsQuote,
  canPrint,
  isEditing,
  isEditingCustomer,
  isSaving,
  onPrint,
  onEdit,
  onSave,
  onCancel
}) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center space-x-4">
      <Link to="/tracking" className="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors duration-200">
        <SafeIcon icon={FiArrowLeft} className="mr-2" />
        Back to Tracking
      </Link>
      <div className="h-6 w-px bg-neutral-300" />
      <h1 className="text-2xl font-bold text-neutral-900 font-display">Service Order #{item.id}</h1>
    </div>
    <div className="flex items-center space-x-3">
      {canPrint && (
        <button
          onClick={onPrint}
          className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-lg"
        >
          <SafeIcon icon={FiPrinter} className="mr-2 text-sm" />
          Print Receipt
        </button>
      )}
      {!isEditing && !isEditingCustomer ? (
        <button
          onClick={onEdit}
          className="flex items-center px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 shadow-lg"
        >
          <SafeIcon icon={FiEdit3} className="mr-2 text-sm" />
          {needsQuote ? 'Prepare Quote' : 'Edit Status / Add Parts & Labor'}
        </button>
      ) : (
        <div className="flex space-x-2">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg"
          >
            <SafeIcon icon={FiSave} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onCancel}
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
);

export default OrderHeader;
