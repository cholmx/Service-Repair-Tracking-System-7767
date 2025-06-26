import React from 'react';
import { motion } from 'framer-motion';
import RecentItems from '../components/RecentItems';
import StatsCards from '../components/StatsCards';
import FinishedOrders from '../components/FinishedOrders';

const Dashboard = ({ items, onPrintReceipt }) => {
  const stats = {
    total: items.length,
    received: items.filter(item => item.status === 'received').length,
    inProgress: items.filter(item => item.status === 'in-progress').length,
    waitingParts: items.filter(item => item.status === 'waiting-parts').length,
    ready: items.filter(item => item.status === 'ready').length,
    completed: items.filter(item => item.status === 'completed').length
  };

  const recentItems = items.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Service Dashboard</h1>
          <p className="text-neutral-600">Overview of all service orders and their current status</p>
        </div>

        <StatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <RecentItems items={recentItems} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <FinishedOrders items={items} onPrintReceipt={onPrintReceipt} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;