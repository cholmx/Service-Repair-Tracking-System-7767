import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import StatusBadge from './StatusBadge';

const { FiEye, FiClock, FiDollarSign, FiFileText, FiAlertCircle } = FiIcons;

const QuoteManagement = ({ items }) => {
  // Get items that need quotes or are awaiting quote approval
  const needsQuoteItems = items.filter(item => item.status === 'needs-quote').slice(0, 3);
  const awaitingApprovalItems = items.filter(item => item.status === 'quote-approval').slice(0, 3);
  
  const totalQuoteItems = needsQuoteItems.length + awaitingApprovalItems.length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <SafeIcon icon={FiDollarSign} className="text-purple-600 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Quote Management</h3>
            <p className="text-sm text-neutral-600">Items requiring quotes or approval</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            {totalQuoteItems} Active
          </span>
        </div>
      </div>

      {totalQuoteItems === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <SafeIcon icon={FiFileText} className="mx-auto text-4xl mb-2 text-neutral-300" />
          <p>No items requiring quotes</p>
          <p className="text-sm">Items marked as "Needs Quote" will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Items Needing Quotes */}
          {needsQuoteItems.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <SafeIcon icon={FiFileText} className="text-indigo-500" />
                <h4 className="font-medium text-neutral-900">Needs Quote Preparation</h4>
                <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
                  {needsQuoteItems.length}
                </span>
              </div>
              <div className="space-y-3">
                {needsQuoteItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="text-sm font-mono text-neutral-500">
                          #{item.id}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.company ? (
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">{item.company}</p>
                          <p className="text-xs text-neutral-600">{item.customer_name}</p>
                        </div>
                      ) : (
                        <p className="font-medium text-neutral-900 text-sm">{item.customer_name}</p>
                      )}
                      <p className="text-xs text-neutral-600 capitalize">
                        {item.quantity}x {item.item_type}
                      </p>
                      <div className="flex items-center text-xs text-neutral-500 mt-1">
                        <SafeIcon icon={FiClock} className="mr-1" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-xs text-indigo-700 bg-indigo-200 px-2 py-1 rounded-full">
                        <SafeIcon icon={FiAlertCircle} className="mr-1" />
                        Quote Needed
                      </div>
                      <Link
                        to={`/item/${item.id}`}
                        className="p-2 text-neutral-400 hover:text-indigo-600 transition-colors duration-200"
                      >
                        <SafeIcon icon={FiEye} className="text-lg" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
                <div className="mt-3">
                  <Link
                    to="/tracking?filter=needs-quote"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View all items needing quotes →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Items Awaiting Quote Approval */}
          {awaitingApprovalItems.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <SafeIcon icon={FiDollarSign} className="text-purple-500" />
                <h4 className="font-medium text-neutral-900">Awaiting Customer Approval</h4>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  {awaitingApprovalItems.length}
                </span>
              </div>
              <div className="space-y-3">
                {awaitingApprovalItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="text-sm font-mono text-neutral-500">
                          #{item.id}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.company ? (
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">{item.company}</p>
                          <p className="text-xs text-neutral-600">{item.customer_name}</p>
                        </div>
                      ) : (
                        <p className="font-medium text-neutral-900 text-sm">{item.customer_name}</p>
                      )}
                      <p className="text-xs text-neutral-600 capitalize">
                        {item.quantity}x {item.item_type}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center text-xs text-neutral-500">
                          <SafeIcon icon={FiClock} className="mr-1" />
                          {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                        </div>
                        {item.total && (
                          <div className="text-sm font-semibold text-purple-700">
                            ${item.total.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-xs text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
                        <SafeIcon icon={FiDollarSign} className="mr-1" />
                        Pending Approval
                      </div>
                      <Link
                        to={`/item/${item.id}`}
                        className="p-2 text-neutral-400 hover:text-purple-600 transition-colors duration-200"
                      >
                        <SafeIcon icon={FiEye} className="text-lg" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
                <div className="mt-3">
                  <Link
                    to="/tracking?filter=quote-approval"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View all pending approvals →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuoteManagement;