import React, { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { fetchActiveOrders, fetchArchivedOrders } from '../../services/orderService';
import { describeError } from '../../utils/errors';


const formatDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const download = (filename, text) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ExportPanel = ({ activeCount, onMessage }) => {
  const [includeArchived, setIncludeArchived] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Always exports fresh data from the database, not whatever the page last loaded.
  const handleExport = async () => {
    try {
      setExporting(true);
      onMessage({ type: '', text: '' });

      const orders = [
        ...(await fetchActiveOrders()),
        ...(includeArchived ? await fetchArchivedOrders() : [])
      ];

      download(
        `servicetracker-export-${formatDate(new Date())}.json`,
        JSON.stringify(
          {
            version: '1.0',
            exportDate: new Date().toISOString(),
            recordCount: orders.length,
            includesArchived: includeArchived,
            data: orders
          },
          null,
          2
        )
      );
      onMessage({ type: 'success', text: `Successfully exported ${orders.length} service orders` });
    } catch (error) {
      console.error('Export error:', error);
      onMessage({ type: 'error', text: `Failed to export data. ${describeError(error)}` });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <SafeIcon icon={FiDownload} className="text-primary-500 mr-2" />
        <h3 className="text-lg font-medium">Export Data</h3>
      </div>
      <p className="text-neutral-600 mb-6">
        Download all your service orders as a JSON file for backup or transfer purposes.
      </p>

      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={() => setIncludeArchived(!includeArchived)}
            className="mr-2 h-4 w-4 text-primary-500 rounded border-neutral-300 focus:ring-primary-500"
          />
          <span className="text-neutral-700">Include archived service orders</span>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-500">
          {activeCount} active service orders{includeArchived ? ' plus archived' : ''}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <SafeIcon icon={FiDownload} className="mr-2" />
          {exporting ? 'Exporting...' : 'Export Data'}
        </button>
      </div>
    </div>
  );
};

export default ExportPanel;
