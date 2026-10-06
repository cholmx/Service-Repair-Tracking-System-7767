import React from 'react';
import { FiClock } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import StatusBadge from '../StatusBadge';


const StatusHistory = ({ history }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
    <h2 className="text-xl font-semibold text-neutral-900 mb-6">Status History</h2>
    <div className="space-y-4">
      {history?.map((entry, index) => (
        <div key={entry.id || index} className="flex items-start space-x-4 p-4 bg-neutral-50 rounded-lg">
          <SafeIcon icon={FiClock} className="text-primary-500 mt-1" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <StatusBadge status={entry.status} />
              <span className="text-sm text-neutral-500">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
            {entry.notes && <p className="mt-1 text-neutral-700">{entry.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default StatusHistory;
