import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import StatusBadge from '../components/StatusBadge';

const { FiSearch, FiFilter, FiEye, FiArchive, FiX } = FiIcons;

const TrackingView = ({ items, onArchiveItem, archivedItems }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showArchived, setShowArchived] = useState(false);

  // Get filter from URL params
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && filterParam !== 'all') {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  const activeItems = showArchived ? archivedItems : items;

  const filteredItems = activeItems
    .filter(item => {
      const matchesSearch = item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.includes(searchTerm) ||
        (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'customer':
          // Sort by company first if available, then by customer name
          const aName = a.company || a.customerName;
          const bName = b.company || b.customerName;
          return aName.localeCompare(bName);
        default:
          return 0;
      }
    });

  const handleArchive = (itemId, e) => {
    e.preventDefault();
    e.stopPropagation();
    onArchiveItem(itemId);
  };

  const clearFilter = () => {
    setStatusFilter('all');
    setSearchParams({});
  };

  // Function to get display name for filter
  const getFilterDisplayName = (filter) => {
    switch (filter) {
      case 'waiting-parts': return 'Waiting on Parts';
      case 'in-progress': return 'In Progress';
      case 'ready': return 'Ready for Pickup or Delivery';
      default: return filter.charAt(0).toUpperCase() + filter.slice(1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">Track Service Orders</h1>
              <p className="text-neutral-600">Search and monitor all Service Orders</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  showArchived
                    ? 'bg-neutral-600 text-white'
                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                }`}
              >
                {showArchived ? 'Show Active' : 'Show Archived'}
              </button>
            </div>
          </div>
          {statusFilter !== 'all' && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-neutral-600">Filtered by:</span>
              <div className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                {getFilterDisplayName(statusFilter)}
                <button onClick={clearFilter} className="ml-2 hover:text-primary-900">
                  <SafeIcon icon={FiX} className="text-sm" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by customer, company, Service Order type, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>
            <div className="relative">
              <SafeIcon icon={FiFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  if (e.target.value === 'all') {
                    setSearchParams({});
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="received">Received</option>
                <option value="in-progress">In Progress</option>
                <option value="waiting-parts">Waiting on Parts</option>
                <option value="ready">Ready for Pickup or Delivery</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="customer">Customer/Company Name</option>
            </select>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-neutral-500 text-lg">
                {showArchived ? 'No archived Service Orders found' : 'No Service Orders found matching your criteria'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Service Order Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredItems.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-neutral-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-neutral-900">#{item.id.slice(-6)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {item.company ? (
                            <>
                              <div className="text-sm font-medium text-neutral-900">{item.company}</div>
                              <div className="text-sm text-neutral-500">{item.customerName}</div>
                            </>
                          ) : (
                            <div className="text-sm font-medium text-neutral-900">{item.customerName}</div>
                          )}
                          <div className="text-sm text-neutral-500">{item.customerPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-neutral-900 capitalize">
                            {item.quantity}x {item.itemType}
                          </div>
                          <div className="text-sm text-neutral-500 line-clamp-2">
                            {item.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/item/${item.id}`}
                            className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors duration-200"
                          >
                            <SafeIcon icon={FiEye} className="mr-1" />
                            View
                          </Link>
                          {!showArchived && (item.status === 'completed' || item.status === 'ready') && (
                            <button
                              onClick={(e) => handleArchive(item.id, e)}
                              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors duration-200"
                              title="Archive this Service Order"
                            >
                              <SafeIcon icon={FiArchive} className="mr-1" />
                              Archive
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TrackingView;