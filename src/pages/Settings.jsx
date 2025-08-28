import React, { useState } from 'react'
import { motion } from 'framer-motion'
import * as FiIcons from 'react-icons/fi'
import SafeIcon from '../common/SafeIcon'
import { useServiceOrders } from '../hooks/useServiceOrders'

const { FiDownload, FiUpload, FiDatabase, FiCheck, FiAlertCircle, FiInfo, FiTrash2 } = FiIcons

const Settings = () => {
  const { items, archivedItems, refresh } = useServiceOrders()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [exportIncludeArchived, setExportIncludeArchived] = useState(true)
  const [importFile, setImportFile] = useState(null)

  // Format date for filenames
  const getFormattedDate = () => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // Export data
  const handleExport = async () => {
    try {
      setLoading(true)
      setMessage({ type: '', text: '' })

      // Get data to export
      let dataToExport = [...items]
      if (exportIncludeArchived) {
        dataToExport = [...dataToExport, ...archivedItems]
      }

      // Add metadata
      const exportData = {
        version: "2.0",
        exportDate: new Date().toISOString(),
        exportedBy: "local-user",
        recordCount: dataToExport.length,
        includesArchived: exportIncludeArchived,
        data: dataToExport
      }

      // Convert to JSON and create blob
      const jsonData = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `servicetracker-export-${getFormattedDate()}.json`

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setMessage({
        type: 'success',
        text: `Successfully exported ${dataToExport.length} service orders`
      })
    } catch (error) {
      console.error('Export error:', error)
      setMessage({
        type: 'error',
        text: 'Failed to export data. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle file selection for import
  const handleFileChange = (e) => {
    setImportFile(e.target.files[0])
    setMessage({ type: '', text: '' })
  }

  // Import data
  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file to import' })
      return
    }

    try {
      setLoading(true)
      setMessage({ type: '', text: '' })

      // Read file
      const fileReader = new FileReader()
      fileReader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result)

          // Validate import data structure
          if (!importData.data || !Array.isArray(importData.data)) {
            throw new Error('Invalid import file format')
          }

          // Get current data
          const currentActiveData = localStorage.getItem('serviceTracker_activeOrders')
          const currentArchivedData = localStorage.getItem('serviceTracker_archivedOrders')
          
          const currentActive = currentActiveData ? JSON.parse(currentActiveData) : []
          const currentArchived = currentArchivedData ? JSON.parse(currentArchivedData) : []

          // Separate imported data into active and archived
          const importedActive = []
          const importedArchived = []

          for (const item of importData.data) {
            // Ensure the item has all required fields
            const processedItem = {
              id: item.id,
              customer_name: item.customer_name,
              customer_phone: item.customer_phone,
              customer_email: item.customer_email || null,
              company: item.company || null,
              item_type: item.item_type,
              serial_number: item.serial_number || null,
              quantity: item.quantity || 1,
              description: item.description,
              urgency: item.urgency || 'normal',
              expected_completion: item.expected_completion || null,
              status: item.status || 'received',
              parts: item.parts || [],
              labor: item.labor || [],
              parts_total: item.parts_total || 0,
              labor_total: item.labor_total || 0,
              tax_rate: item.tax_rate || 0,
              tax: item.tax || 0,
              subtotal: item.subtotal || 0,
              total: item.total || 0,
              archived_at: item.archived_at || null,
              created_at: item.created_at || new Date().toISOString(),
              updated_at: item.updated_at || new Date().toISOString(),
              statusHistory: item.statusHistory || []
            }

            if (processedItem.archived_at) {
              importedArchived.push(processedItem)
            } else {
              importedActive.push(processedItem)
            }
          }

          // Merge with existing data, avoiding duplicates
          const mergeArrays = (current, imported) => {
            const merged = [...current]
            let addedCount = 0

            for (const importedItem of imported) {
              const existingIndex = merged.findIndex(item => item.id === importedItem.id)
              if (existingIndex >= 0) {
                // Update existing item
                merged[existingIndex] = importedItem
              } else {
                // Add new item
                merged.push(importedItem)
                addedCount++
              }
            }

            return { merged, addedCount }
          }

          const activeResult = mergeArrays(currentActive, importedActive)
          const archivedResult = mergeArrays(currentArchived, importedArchived)

          // Save to localStorage
          localStorage.setItem('serviceTracker_activeOrders', JSON.stringify(activeResult.merged))
          localStorage.setItem('serviceTracker_archivedOrders', JSON.stringify(archivedResult.merged))

          // Refresh data
          await refresh()

          // Show results
          const totalAdded = activeResult.addedCount + archivedResult.addedCount
          const totalUpdated = importData.data.length - totalAdded

          setMessage({
            type: 'success',
            text: `Import complete: ${totalAdded} new items added, ${totalUpdated} items updated.`
          })
        } catch (error) {
          console.error('Import parsing error:', error)
          setMessage({
            type: 'error',
            text: 'Failed to parse import file. Please check the file format.'
          })
        } finally {
          setLoading(false)
        }
      }

      fileReader.onerror = () => {
        setMessage({
          type: 'error',
          text: 'Failed to read the import file. Please try again.'
        })
        setLoading(false)
      }

      fileReader.readAsText(importFile)
    } catch (error) {
      console.error('Import error:', error)
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred during import.'
      })
      setLoading(false)
    }
  }

  // Clear all data
  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('serviceTracker_activeOrders')
      localStorage.removeItem('serviceTracker_archivedOrders')
      localStorage.removeItem('serviceTracker_usedOrderIds')
      
      // Refresh the app
      window.location.reload()
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Settings</h1>
          <p className="text-neutral-600">Manage your ServiceTracker settings and data</p>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <SafeIcon icon={FiDatabase} className="text-primary-500 text-2xl mr-3" />
            <h2 className="text-xl font-semibold text-neutral-900">Data Management</h2>
          </div>

          {/* Message display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800' 
                : message.type === 'error' 
                ? 'bg-red-50 text-red-800' 
                : 'bg-blue-50 text-blue-800'
            }`}>
              <SafeIcon 
                icon={
                  message.type === 'success' ? FiCheck : 
                  message.type === 'error' ? FiAlertCircle : FiInfo
                } 
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

          {/* Clear Data Section */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">Clear All Data</h3>
                <p className="text-neutral-600">
                  Permanently delete all service orders and reset the application. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={handleClearAllData}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <SafeIcon icon={FiTrash2} className="mr-2" />
                Clear All Data
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <SafeIcon icon={FiInfo} className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Local Storage Information</h4>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  <li>All data is stored locally in your browser</li>
                  <li>Data persists between browser sessions</li>
                  <li>Clearing browser data will remove all service orders</li>
                  <li>Use export/import to backup and transfer data</li>
                  <li>Service order IDs are preserved during import/export</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Settings