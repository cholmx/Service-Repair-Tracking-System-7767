import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { useServiceOrders } from '../hooks/useServiceOrders';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import StatusBadge from '../components/StatusBadge';

const { FiSearch, FiFilter, FiEye, FiArchive, FiX, FiRefreshCw, FiTrash2, FiHash } = FiIcons;

const TrackingView = () => {
  const { items, archivedItems, loading, archiveItem, deleteArchivedItem } = useServiceOrders();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Get filter from URL params
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && filterParam !== 'all') {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading service orders...</p>
        </div>
      </div>
    );
  }

  const activeItems = showArchived ? archivedItems : items;

  const filteredItems = activeItems
    .filter(item => {
      const matchesSearch = 
        item.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.item_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.id.includes(searchTerm) || 
        (item.company && item.company.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (item.serial_number && item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'customer':
          const aName = a.company || a.customer_name;
          const bName = b.company || b.customer_name;
          return aName.localeCompare(bName);
        default:
          return 0;
      }
    });

  const handleArchive = async (itemId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await archiveItem(itemId);
    } catch (error) {
      console.error('Failed to archive item:', error);
    }
  };

  const handleDeleteConfirm = (itemId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirmId(itemId);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const handleDeleteExecute = async () => {
    if (deleteConfirmId) {
      try {
        await deleteArchivedItem(deleteConfirmId);
        setDeleteConfirmId(null);
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const clearFilter = () => {
    setStatusFilter('all');
    setSearchParams({});
  };

  const toggleArchiveView = () => {
    setShowArchived(!showArchived);
    setStatusFilter('all');
    setSearchTerm('');
    setSearchParams({});
  };

  const getFilterDisplayName = (filter) => {
    switch (filter) {
      case 'waiting-parts':
        return 'Waiting on Parts';
      case 'in-progress':
        return 'In Progress';
      case 'ready':
        return 'Ready for Pickup or Delivery';
      case 'quote-approval':
        return 'Awaiting Quote Approval';
      case 'needs-quote':
        return 'Needs Quote';
      default:
        return filter.charAt(0).toUpperCase() + filter.slice(1);
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
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                {showArchived ? 'Archived Service Orders' : 'Track Service Orders'}
              </h1>
              <p className="text-neutral-600">
                {showArchived
                  ? `View ${archivedItems.length} archived Service Orders`
                  : 'Search and monitor all active Service Orders'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleArchiveView}
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
              <SafeIcon
                icon={FiSearch}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
              />
              <input
                type="text"
                placeholder="Search by customer, company, serial number, or item type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              />
            </div>

            {!showArchived && (
              <div className="relative">
                <SafeIcon
                  icon={FiFilter}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
                />
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
                  <option value="needs-quote">Needs Quote</option>
                  <option value="in-progress">In Progress</option>
                  <option value="waiting-parts">Waiting on Parts</option>
                  <option value="quote-approval">Awaiting Quote Approval</option>
                  <option value="ready">Ready for Pickup or Delivery</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

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
                {showArchived
                  ? 'No archived Service Orders found matching your criteria'
                  : 'No Service Orders found matching your criteria'}
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
                      {showArchived ? 'Archived' : 'Created'}
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
                        <span className="text-sm font-mono text-neutral-900">#{item.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {item.company ? (
                            <>
                              <div className="text-sm font-medium text-neutral-900">{item.company}</div>
                              <div className="text-sm text-neutral-500">{item.customer_name}</div>
                            </>
                          ) : (
                            <div className="text-sm font-medium text-neutral-900">{item.customer_name}</div>
                          )}
                          <div className="text-sm text-neutral-500">{item.customer_phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-neutral-900 capitalize">
                            {item.quantity}x {item.item_type}
                          </div>
                          {item.serial_number && (
                            <div className="flex items-center text-sm text-neutral-500">
                              <SafeIcon icon={FiHash} className="mr-1 text-xs" />
                              <span>{item.serial_number}</span>
                            </div>
                          )}
                          <div className="text-sm text-neutral-500 line-clamp-2">
                            {item.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {new Date(showArchived ? item.archived_at : item.created_at).toLocaleDateString()}
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

                          {showArchived && (
                            <button
                              onClick={(e) => handleDeleteConfirm(item.id, e)}
                              className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
                              title="Permanently delete this archived Service Order"
                            >
                              <SafeIcon icon={FiTrash2} className="mr-1" />
                              Delete
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiTrash2} className="text-red-600 text-lg" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-neutral-900">
                  Delete Archived Service Order
                </h3>
                <p className="text-sm text-neutral-500">
                  Service Order #{deleteConfirmId}
                </p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-neutral-700">
                Are you sure you want to permanently delete this archived service order? This action cannot be undone and all data will be lost.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-200 rounded-lg hover:bg-neutral-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExecute}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete Permanently
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TrackingView;