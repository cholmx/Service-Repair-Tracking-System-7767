import React from 'react';
import { FiArchive, FiRefreshCw, FiX } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { statusLabel } from '../../utils/trackingFilters';

const TrackingHeader = ({ showArchived, archivedLoading, archivedCount, statusFilter, onToggleArchive, onClearFilter }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2 font-display">
          {showArchived ? 'Archived Service Orders' : 'Track Service Orders'}
        </h1>
        <p className="text-neutral-600">
          {showArchived
            ? archivedLoading
              ? 'Loading archived Service Orders...'
              : `View ${archivedCount} archived Service Orders`
            : 'Search and monitor all active Service Orders'}
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleArchive}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            showArchived
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
          }`}
        >
          <SafeIcon icon={showArchived ? FiRefreshCw : FiArchive} className="mr-2" />
          {showArchived ? 'Back to Active' : 'View Archived'}
        </button>
      </div>
    </div>

    {statusFilter !== 'all' && !showArchived && (
      <div className="mt-4 flex items-center space-x-2">
        <span className="text-sm text-neutral-600">Filtered by:</span>
        <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
          {statusLabel(statusFilter)}
          <button onClick={onClearFilter} className="ml-2 hover:text-primary-900">
            <SafeIcon icon={FiX} className="text-sm" />
          </button>
        </div>
      </div>
    )}
  </div>
);

export default TrackingHeader;
