import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { FiArchive, FiTrash2 } from 'react-icons/fi';
import { useServiceOrders } from '../hooks/useServiceOrders';
import { useToasts } from '../hooks/useToasts';
import { filterAndSortOrders } from '../utils/trackingFilters';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ToastContainer from '../components/ToastContainer';
import TrackingHeader from '../components/Tracking/TrackingHeader';
import TrackingFilters from '../components/Tracking/TrackingFilters';
import OrdersTable from '../components/Tracking/OrdersTable';
import ConfirmModal from '../components/Tracking/ConfirmModal';

const TrackingView = () => {
  const {
    items,
    archivedItems,
    loading,
    archivedLoading,
    loadArchived,
    archiveItem,
    restoreItem,
    deleteArchivedItem,
    restoreDeletedItem
  } = useServiceOrders();
  const { toasts, addToast, removeToast, undo } = useToasts();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showArchived, setShowArchived] = useState(false);
  const [archiveConfirmId, setArchiveConfirmId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && filterParam !== 'all') {
      setStatusFilter(filterParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!showArchived) return;
    loadArchived().catch((error) => addToast(`Failed to load archived service orders. ${error.message}`, 'error'));
  }, [showArchived, loadArchived, addToast]);

  const visibleOrders = useMemo(
    () => filterAndSortOrders(showArchived ? archivedItems : items, { searchTerm, statusFilter, sortBy }),
    [showArchived, archivedItems, items, searchTerm, statusFilter, sortBy]
  );

  if (loading) {
    return <LoadingSkeleton type="tracking" />;
  }

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    if (value === 'all') setSearchParams({});
  };

  const clearFilter = () => handleStatusFilter('all');

  const toggleArchiveView = () => {
    setShowArchived(!showArchived);
    setStatusFilter('all');
    setSearchTerm('');
    setSearchParams({});
  };

  const handleArchive = async () => {
    const id = archiveConfirmId;
    try {
      const order = items.find((item) => item.id === id);
      await archiveItem(id);
      setArchiveConfirmId(null);
      addToast(`Service Order #${id} archived`, 'success', () => restoreItem(id, order.status));
    } catch (error) {
      addToast(`Failed to archive service order. ${error.message}`, 'error');
    }
  };

  const handleDelete = async () => {
    const id = deleteConfirmId;
    try {
      const order = archivedItems.find((item) => item.id === id);
      await deleteArchivedItem(id);
      setDeleteConfirmId(null);
      addToast(`Service Order #${id} deleted`, 'success', () => restoreDeletedItem(order));
    } catch (error) {
      addToast(`Failed to delete service order. ${error.message}`, 'error');
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} onUndo={undo} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <TrackingHeader
            showArchived={showArchived}
            archivedLoading={archivedLoading}
            archivedCount={archivedItems.length}
            statusFilter={statusFilter}
            onToggleArchive={toggleArchiveView}
            onClearFilter={clearFilter}
          />
          <TrackingFilters
            showArchived={showArchived}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            sortBy={sortBy}
            onSearch={setSearchTerm}
            onStatusFilter={handleStatusFilter}
            onSort={setSortBy}
          />
          <OrdersTable
            orders={visibleOrders}
            showArchived={showArchived}
            archivedLoading={archivedLoading}
            onArchive={setArchiveConfirmId}
            onDelete={setDeleteConfirmId}
          />
        </motion.div>

        {archiveConfirmId && (
          <ConfirmModal
            icon={FiArchive}
            title="Archive Service Order"
            orderId={archiveConfirmId}
            message="Are you sure you want to archive this service order? Archived orders can be viewed in the archived section and can be permanently deleted later."
            confirmLabel="Archive"
            onConfirm={handleArchive}
            onCancel={() => setArchiveConfirmId(null)}
          />
        )}

        {deleteConfirmId && (
          <ConfirmModal
            icon={FiTrash2}
            tone="danger"
            title="Delete Archived Service Order"
            orderId={deleteConfirmId}
            message="Are you sure you want to permanently delete this archived service order? This action cannot be undone and all data will be lost."
            confirmLabel="Delete Permanently"
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirmId(null)}
          />
        )}
      </div>
    </>
  );
};

export default TrackingView;
