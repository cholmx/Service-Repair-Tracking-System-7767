import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useServiceOrders } from '../hooks/useServiceOrders';
import StatusMessage from '../components/Settings/StatusMessage';
import ExportPanel from '../components/Settings/ExportPanel';
import ImportPanel from '../components/Settings/ImportPanel';
import SessionPanel from '../components/Settings/SessionPanel';

const { FiInfo, FiDatabase } = FiIcons;

const Settings = () => {
  const { items, refresh } = useServiceOrders();
  const [message, setMessage] = useState({ type: '', text: '' });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 font-display">Settings</h1>
          <p className="text-neutral-600">Manage your ServiceTracker settings and data</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <SafeIcon icon={FiDatabase} className="text-primary-500 text-2xl mr-3" />
            <h2 className="text-xl font-semibold text-neutral-900">Data Backup & Restore</h2>
          </div>

          <StatusMessage message={message} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ExportPanel activeCount={items.length} onMessage={setMessage} />
            <ImportPanel onMessage={setMessage} onImported={refresh} />
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <SafeIcon icon={FiInfo} className="text-yellow-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Important Information</h4>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Importing adds new service orders and overwrites existing ones with the same ID</li>
                  <li>You will see what will change and confirm with your PIN before anything is written</li>
                  <li>An import is all or nothing: if it fails, no service orders are changed</li>
                  <li>Status history is included in exports and restored during import</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <SessionPanel />
      </motion.div>
    </div>
  );
};

export default Settings;
