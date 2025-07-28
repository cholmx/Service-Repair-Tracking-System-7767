import React from 'react';
import {motion} from 'framer-motion';
import {useServiceOrders} from '../hooks/useServiceOrders';
import RecentItems from '../components/RecentItems';
import StatsCards from '../components/StatsCards';
import FinishedOrders from '../components/FinishedOrders';
import QuoteManagement from '../components/QuoteManagement';
import ReceivedOrders from '../components/ReceivedOrders';

const Dashboard = ({onPrintReceipt}) => {
  const {items, loading, error} = useServiceOrders();

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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-red-500">Please check your internet connection and try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    total: items.length,
    received: items.filter(item => item.status === 'received').length,
    inProgress: items.filter(item => item.status === 'in-progress').length,
    waitingParts: items.filter(item => item.status === 'waiting-parts').length,
    ready: items.filter(item => item.status === 'ready').length,
    completed: items.filter(item => item.status === 'completed').length
  };

  // Check if there are any quote-related items
  const needsQuoteItems = items.filter(item => item.status === 'needs-quote');
  const quoteApprovalItems = items.filter(item => item.status === 'quote-approval');
  const hasQuoteItems = needsQuoteItems.length > 0 || quoteApprovalItems.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Service Dashboard</h1>
          <p className="text-neutral-600">Overview of all service orders</p>
        </div>

        <StatsCards stats={stats} />
        
        {/* Layout with quotes: Two rows with 2 cards each */}
        {hasQuoteItems ? (
          <>
            {/* First Row - Newly Received Orders and Quote Management side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Newly Received Orders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <ReceivedOrders items={items} />
              </motion.div>

              {/* Quote Management */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <QuoteManagement items={items} />
              </motion.div>
            </div>

            {/* Second Row - Ready Service Orders and Finished Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Ready Service Orders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <RecentItems items={items} />
              </motion.div>

              {/* Finished Orders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <FinishedOrders items={items} onPrintReceipt={onPrintReceipt} />
              </motion.div>
            </div>
          </>
        ) : (
          /* Layout without quotes: All three cards in one row */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Newly Received Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ReceivedOrders items={items} />
            </motion.div>

            {/* Ready Service Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <RecentItems items={items} />
            </motion.div>

            {/* Finished Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <FinishedOrders items={items} onPrintReceipt={onPrintReceipt} />
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;