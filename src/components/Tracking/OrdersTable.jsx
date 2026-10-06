import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArchive, FiEye, FiHash, FiTrash2 } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { scbaHistoryLink } from '../../utils/serial';
import StatusBadge from '../StatusBadge';

const headerCell = 'px-6 py-4 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider';
const actionButton = 'inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200';

const emptyText = (showArchived, archivedLoading) => {
  if (showArchived && archivedLoading) return 'Loading archived Service Orders...';
  return showArchived
    ? 'No archived Service Orders found matching your criteria'
    : 'No Service Orders found matching your criteria';
};

const OrderRow = ({ order, index, showArchived, onArchive, onDelete }) => (
  <motion.tr
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.05 }}
    className="hover:bg-neutral-50 transition-colors duration-200"
  >
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="text-sm font-mono text-neutral-900">#{order.id}</span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div>
        {order.company ? (
          <>
            <div className="text-sm font-bold text-neutral-900">{order.company}</div>
            <div className="text-sm text-neutral-500">{order.customer_name}</div>
          </>
        ) : (
          <div className="text-sm font-bold text-neutral-900">{order.customer_name}</div>
        )}
        <div className="text-sm text-neutral-500">{order.customer_phone}</div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div>
        <div className="text-sm font-medium text-neutral-900 capitalize">
          {order.quantity}x {order.item_type}
        </div>
        {order.serial_number && (
          <div className="flex items-center text-sm text-neutral-500">
            <SafeIcon icon={FiHash} className="mr-1 text-xs" />
            {scbaHistoryLink(order) ? (
              <Link to={scbaHistoryLink(order)} className="text-primary-600 hover:text-primary-700 underline" title="SCBA repair history">
                {order.serial_number}
              </Link>
            ) : (
              <span>{order.serial_number}</span>
            )}
          </div>
        )}
        <div className="text-sm text-neutral-500 line-clamp-2">{order.description}</div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <StatusBadge status={order.status} />
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
      {new Date(showArchived ? order.archived_at : order.created_at).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        <Link to={`/item/${order.id}`} className={`${actionButton} bg-primary-100 text-primary-700 hover:bg-primary-200`}>
          <SafeIcon icon={FiEye} className="mr-1" />
          View
        </Link>

        {!showArchived && (order.status === 'completed' || order.status === 'ready') && (
          <button
            onClick={() => onArchive(order.id)}
            className={`${actionButton} bg-neutral-100 text-neutral-700 hover:bg-neutral-200`}
            title="Archive this Service Order"
          >
            <SafeIcon icon={FiArchive} className="mr-1" />
            Archive
          </button>
        )}

        {showArchived && (
          <button
            onClick={() => onDelete(order.id)}
            className={`${actionButton} bg-red-100 text-red-700 hover:bg-red-200`}
            title="Permanently delete this archived Service Order"
          >
            <SafeIcon icon={FiTrash2} className="mr-1" />
            Delete
          </button>
        )}
      </div>
    </td>
  </motion.tr>
);

const OrdersTable = ({ orders, showArchived, archivedLoading, onArchive, onDelete }) => (
  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
    {orders.length === 0 ? (
      <div className="p-12 text-center">
        <p className="text-neutral-500 text-lg">{emptyText(showArchived, archivedLoading)}</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-200">
            <tr>
              <th className={headerCell}>Order ID</th>
              <th className={headerCell}>Customer</th>
              <th className={headerCell}>Service Order Details</th>
              <th className={headerCell}>Status</th>
              <th className={headerCell}>{showArchived ? 'Archived' : 'Created'}</th>
              <th className={headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {orders.map((order, index) => (
              <OrderRow
                key={order.id}
                order={order}
                index={index}
                showArchived={showArchived}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default OrdersTable;
