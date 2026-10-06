import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';

const tones = {
  primary: { badge: 'bg-primary-100', icon: 'text-primary-600', button: 'bg-primary-600 hover:bg-primary-700' },
  danger: { badge: 'bg-red-100', icon: 'text-red-600', button: 'bg-red-600 hover:bg-red-700' }
};

const ConfirmModal = ({ icon, tone = 'primary', title, orderId, message, confirmLabel, onConfirm, onCancel }) => {
  const colors = tones[tone];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.badge}`}>
            <SafeIcon icon={icon} className={`text-lg ${colors.icon}`} />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-neutral-900">{title}</h3>
            <p className="text-sm text-neutral-500">Service Order #{orderId}</p>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-neutral-700">{message}</p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-200 rounded-lg hover:bg-neutral-300 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 ${colors.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmModal;
