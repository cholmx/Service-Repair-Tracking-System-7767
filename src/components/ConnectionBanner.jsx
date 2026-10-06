import React from 'react';
import { FiWifiOff } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useServiceOrders } from '../hooks/useServiceOrders';

// Shown across the top of the app while the device is offline.
const ConnectionBanner = () => {
  const { isOnline } = useServiceOrders();
  if (isOnline) return null;

  return (
    <div role="status" className="bg-yellow-100 border-b border-yellow-300 text-yellow-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center text-sm">
        <SafeIcon icon={FiWifiOff} className="mr-2 flex-shrink-0" />
        <span>
          You are offline. You are looking at the last data that loaded, and changes cannot be saved until the connection returns.
        </span>
      </div>
    </div>
  );
};

export default ConnectionBanner;
