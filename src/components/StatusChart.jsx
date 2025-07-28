import React from 'react';
import { motion } from 'framer-motion';

const StatusChart = ({ items }) => {
  const statusCounts = {
    received: items.filter(item => item.status === 'received').length,
    'needs-quote': items.filter(item => item.status === 'needs-quote').length,
    'in-progress': items.filter(item => item.status === 'in-progress').length,
    'waiting-parts': items.filter(item => item.status === 'waiting-parts').length,
    'quote-approval': items.filter(item => item.status === 'quote-approval').length,
    ready: items.filter(item => item.status === 'ready').length,
    completed: items.filter(item => item.status === 'completed').length
  };

  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  const statusConfig = {
    received: { label: 'Received', color: 'bg-blue-500' },
    'needs-quote': { label: 'Needs Quote', color: 'bg-indigo-500' },
    'in-progress': { label: 'In Progress', color: 'bg-yellow-500' },
    'waiting-parts': { label: 'Waiting on Parts', color: 'bg-orange-500' },
    'quote-approval': { label: 'Awaiting Quote Approval', color: 'bg-purple-500' },
    ready: { label: 'Ready', color: 'bg-green-500' },
    completed: { label: 'Completed', color: 'bg-neutral-500' }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-6">Status Distribution</h3>
      {total === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          No items to display
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(statusCounts).map(([status, count]) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            const config = statusConfig[status];
            return (
              <div key={status} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-700">
                    {config.label}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${config.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StatusChart;