import React from 'react';
import { FiFilter, FiSearch } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { STATUS_OPTIONS } from '../../constants/statuses';

const fieldClasses =
  'w-full py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white';

const TrackingFilters = ({ showArchived, searchTerm, statusFilter, sortBy, onSearch, onStatusFilter, onSort }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative">
        <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by customer, company, serial number, or item type..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className={`${fieldClasses} pl-10 pr-4`}
        />
      </div>

      {!showArchived && (
        <div className="relative">
          <SafeIcon icon={FiFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value)}
            className={`${fieldClasses} pl-10 pr-4 appearance-none`}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <select value={sortBy} onChange={(e) => onSort(e.target.value)} className={`${fieldClasses} px-4`}>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="customer">Customer/Company Name</option>
      </select>
    </div>
  </div>
);

export default TrackingFilters;
