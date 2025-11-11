import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useServiceOrders } from '../hooks/useServiceOrders';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const { FiDownload, FiUpload, FiSettings, FiArchive, FiCheck, FiAlertCircle, FiInfo, FiDatabase } = FiIcons;

const Settings = () => {
  const { items, archivedItems, refresh } = useServiceOrders();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [exportIncludeArchived, setExportIncludeArchived] = useState(true);
  const [importFile, setImportFile] = useState(null);

  // Format date for filenames
  const getFormattedDate = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Export data
  const handleExport = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Get data to export
      let dataToExport = [...items];
      if (exportIncludeArchived) {
        dataToExport = [...dataToExport, ...archivedItems];
      }

      // Add metadata
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        exportedBy: user ? user.email : "anonymous",
        recordCount: dataToExport.length,
        includesArchived: exportIncludeArchived,
        data: dataToExport
      };

      // Convert to JSON and create blob
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `servicetracker-export-${getFormattedDate()}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully exported ${dataToExport.length} service orders` 
      });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to export data. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for import
  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
    setMessage({ type: '', text: '' });
  };

  // Import data
  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file to import' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      // Read file
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          // Validate import data structure
          if (!importData.data || !Array.isArray(importData.data)) {
            throw new Error('Invalid import file format');
          }

          // Count successful and failed imports
          let successCount = 0;
          let failCount = 0;
          
          // Process each service order
          for (const item of importData.data) {
            try {
              // Check if item already exists
              const { data: existingItem } = await supabase
                .from('service_orders')
                .select('id')
                .eq('id', item.id)
                .single();
              
              if (existingItem) {
                // Update existing item
                const { error: updateError } = await supabase
                  .from('service_orders')
                  .update({
                    customer_name: item.customer_name,
                    customer_phone: item.customer_phone,
                    customer_email: item.customer_email,
                    company: item.company,
                    item_type: item.item_type,
                    serial_number: item.serial_number || null,
                    quantity: item.quantity,
                    description: item.description,
                    urgency: item.urgency,
                    expected_completion: item.expected_completion,
                    status: item.status,
                    parts: item.parts || [],
                    labor: item.labor || [],
                    parts_total: item.parts_total || 0,
                    labor_total: item.labor_total || 0,
                    tax_rate: item.tax_rate || 0,
                    tax: item.tax || 0,
                    subtotal: item.subtotal || 0,
                    total: item.total || 0,
                    archived_at: item.archived_at,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', item.id);
                
                if (updateError) throw updateError;
              } else {
                // Insert new item
                const { error: insertError } = await supabase
                  .from('service_orders')
                  .insert([{
                    id: item.id,
                    customer_name: item.customer_name,
                    customer_phone: item.customer_phone,
                    customer_email: item.customer_email,
                    company: item.company,
                    item_type: item.item_type,
                    serial_number: item.serial_number || null,
                    quantity: item.quantity,
                    description: item.description,
                    urgency: item.urgency,
                    expected_completion: item.expected_completion,
                    status: item.status,
                    parts: item.parts || [],
                    labor: item.labor || [],
                    parts_total: item.parts_total || 0,
                    labor_total: item.labor_total || 0,
                    tax_rate: item.tax_rate || 0,
                    tax: item.tax || 0,
                    subtotal: item.subtotal || 0,
                    total: item.total || 0,
                    archived_at: item.archived_at,
                    created_at: item.created_at || new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }]);
                
                if (insertError) throw insertError;
              }
              
              // Import status history for this item if it exists
              if (item.statusHistory && Array.isArray(item.statusHistory)) {
                for (const history of item.statusHistory) {
                  // Check if history entry already exists (by service_order_id, status and timestamp)
                  const { data: existingHistory } = await supabase
                    .from('status_history')
                    .select('id')
                    .eq('service_order_id', item.id)
                    .eq('status', history.status)
                    .eq('created_at', history.created_at)
                    .maybeSingle();
                  
                  if (!existingHistory) {
                    const { error: historyError } = await supabase
                      .from('status_history')
                      .insert([{
                        service_order_id: item.id,
                        status: history.status,
                        notes: history.notes || '',
                        created_at: history.created_at
                      }]);
                    
                    if (historyError) console.error('Error importing history:', historyError);
                  }
                }
              }
              
              successCount++;
            } catch (error) {
              console.error(`Error importing item ${item.id}:`, error);
              failCount++;
            }
          }
          
          // Refresh data
          await refresh();
          
          // Show results
          setMessage({
            type: successCount > 0 ? 'success' : 'error',
            text: `Import complete: ${successCount} items imported successfully, ${failCount} items failed.`
          });
        } catch (error) {
          console.error('Import parsing error:', error);
          setMessage({
            type: 'error',
            text: 'Failed to parse import file. Please check the file format.'
          });
        } finally {
          setLoading(false);
        }
      };
      
      fileReader.onerror = () => {
        setMessage({
          type: 'error',
          text: 'Failed to read the import file. Please try again.'
        });
        setLoading(false);
      };
      
      fileReader.readAsText(importFile);
      
    } catch (error) {
      console.error('Import error:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred during import.'
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 font-display">Settings</h1>
          <p className="text-neutral-600">Manage your ServiceTracker settings and data</p>
        </div>

        {/* Data Backup & Restore */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <SafeIcon icon={FiDatabase} className="text-primary-500 text-2xl mr-3" />
            <h2 className="text-xl font-semibold text-neutral-900">Data Backup & Restore</h2>
          </div>

          {/* Message display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' ? 'bg-green-50 text-green-800' :
              message.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'
            }`}>
              <SafeIcon 
                icon={message.type === 'success' ? FiCheck : message.type === 'error' ? FiAlertCircle : FiInfo} 
                className="mr-3 text-lg"
              />
              <p>{message.text}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Export Section */}
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
                    checked={exportIncludeArchived}
                    onChange={() => setExportIncludeArchived(!exportIncludeArchived)}
                    className="mr-2 h-4 w-4 text-primary-500 rounded border-neutral-300 focus:ring-primary-500"
                  />
                  <span className="text-neutral-700">Include archived service orders</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500">
                  Total: {items.length + (exportIncludeArchived ? archivedItems.length : 0)} service orders
                </div>
                <button
                  onClick={handleExport}
                  disabled={loading || (items.length === 0 && archivedItems.length === 0)}
                  className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <SafeIcon icon={FiDownload} className="mr-2" />
                  {loading ? 'Exporting...' : 'Export Data'}
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div className="border border-neutral-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <SafeIcon icon={FiUpload} className="text-primary-500 mr-2" />
                <h3 className="text-lg font-medium">Import Data</h3>
              </div>
              <p className="text-neutral-600 mb-6">
                Restore service orders from a previously exported JSON file.
              </p>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-neutral-700">
                  Select export file (.json)
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="w-full text-sm text-neutral-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={loading || !importFile}
                  className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <SafeIcon icon={FiUpload} className="mr-2" />
                  {loading ? 'Importing...' : 'Import Data'}
                </button>
              </div>
            </div>
          </div>

          {/* Warning/Info Section */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <SafeIcon icon={FiInfo} className="text-yellow-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Important Information</h4>
                <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Importing will add new service orders and update existing ones</li>
                  <li>Service order IDs are preserved during import/export</li>
                  <li>Status history is included in exports and will be restored during import</li>
                  <li>For large datasets, the import process may take a few moments to complete</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Settings Sections could go here */}

      </motion.div>
    </div>
  );
};

export default Settings;