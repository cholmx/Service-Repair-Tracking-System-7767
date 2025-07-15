import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import StatusBadge from './StatusBadge';

const { FiEye, FiClock } = FiIcons;

const RecentItems = ({ items }) => {
  // Show items that are ready for pickup or delivery
  const readyItems = items.filter(item => item.status === 'ready').slice(0, 5);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-neutral-900 mb-6">Ready Service Orders</h3>
      
      {readyItems.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <p>No Service Orders ready for pickup or delivery</p>
        </div>
      ) : (
        <div className="space-y-4">
          {readyItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-sm font-mono text-neutral-500">
                    #{item.id}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                
                {item.company ? (
                  <div>
                    <p className="font-medium text-neutral-900">{item.company}</p>
                    <p className="text-sm text-neutral-600">{item.customer_name}</p>
                  </div>
                ) : (
                  <p className="font-medium text-neutral-900">{item.customer_name}</p>
                )}
                
                <p className="text-sm text-neutral-600 capitalize">
                  {item.quantity}x {item.item_type}
                </p>
                
                <div className="flex items-center text-xs text-neutral-500 mt-1">
                  <SafeIcon icon={FiClock} className="mr-1" />
                  {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <Link
                to={`/item/${item.id}`}
                className="ml-4 p-2 text-neutral-400 hover:text-primary-500 transition-colors duration-200"
              >
                <SafeIcon icon={FiEye} className="text-lg" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
      
      {readyItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <Link
            to="/tracking?filter=ready"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all ready Service Orders →
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentItems;