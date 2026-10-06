import React from 'react';
import { FiLock } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { usePinAuth } from '../../contexts/PinAuthContext';


const formatRemaining = (sessionInfo) => {
  if (!sessionInfo) return 'Session expired';

  const hours = Math.floor(sessionInfo.remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((sessionInfo.remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m remaining`;
};

const SessionPanel = () => {
  const { getSessionInfo } = usePinAuth();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center mb-6">
        <SafeIcon icon={FiLock} className="text-primary-500 text-2xl mr-3" />
        <h2 className="text-xl font-semibold text-neutral-900">PIN Security</h2>
      </div>

      <div className="border border-neutral-200 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Session Information</h3>
        <p className="text-neutral-600 mb-6">
          Your current session details. PINs are secrets stored on the server and are changed in the Supabase dashboard.
        </p>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-neutral-200">
            <span className="text-neutral-600">Session Status</span>
            <span className="font-medium text-green-600">Active</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-neutral-200">
            <span className="text-neutral-600">Time Remaining</span>
            <span className="font-medium text-neutral-900">{formatRemaining(getSessionInfo())}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-neutral-600">Session Duration</span>
            <span className="font-medium text-neutral-900">10 hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionPanel;
