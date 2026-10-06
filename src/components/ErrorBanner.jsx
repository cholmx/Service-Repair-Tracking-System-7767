import React from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const ErrorBanner = ({ message, onRetry, onDismiss }) => (
  <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
    <SafeIcon icon={FiAlertCircle} className="text-red-500 text-lg mr-3 mt-0.5 flex-shrink-0" />
    <p className="flex-1 text-red-800">{message}</p>
    <div className="ml-4 flex space-x-3 flex-shrink-0">
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium text-red-700 hover:text-red-900 underline">
          Try again
        </button>
      )}
      {onDismiss && (
        <button onClick={onDismiss} className="text-sm text-red-600 hover:text-red-800">
          Dismiss
        </button>
      )}
    </div>
  </div>
);

export default ErrorBanner;
