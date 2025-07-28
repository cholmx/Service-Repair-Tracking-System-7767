import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'received':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Received' };
      case 'needs-quote':
        return { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Needs Quote' };
      case 'in-progress':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Progress' };
      case 'waiting-parts':
        return { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Waiting on Parts' };
      case 'quote-approval':
        return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Awaiting Quote Approval' };
      case 'ready':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready for Pickup or Delivery' };
      case 'completed':
        return { bg: 'bg-neutral-100', text: 'text-neutral-800', label: 'Completed' };
      case 'archived':
        return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Archived' };
      default:
        return { bg: 'bg-neutral-100', text: 'text-neutral-800', label: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;