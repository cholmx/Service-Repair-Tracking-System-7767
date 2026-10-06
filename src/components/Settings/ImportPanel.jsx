import React, { useState } from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { parseImportFile } from '../../services/importSchema';
import { findExistingIds, importOrders } from '../../services/importService';
import { validatePin } from '../../services/pinService';

const { FiUpload, FiAlertCircle } = FiIcons;

const PREVIEW_LIST_LIMIT = 10;

const ImportPreview = ({ preview, pin, setPin, pinError, busy, onConfirm, onCancel }) => {
  const { orders, errors, existing, fileName } = preview;
  const overwrites = orders.filter((order) => existing.has(order.id));
  const created = orders.length - overwrites.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">
        Reviewing <span className="font-medium">{fileName}</span>. Nothing has been changed yet.
      </p>

      <ul className="text-sm space-y-1">
        <li className="text-green-700">{created} new service orders will be added</li>
        <li className={overwrites.length ? 'text-orange-700 font-medium' : 'text-neutral-600'}>
          {overwrites.length} existing service orders will be overwritten
        </li>
        {errors.length > 0 && <li className="text-red-700">{errors.length} rows in the file are invalid and will be skipped</li>}
      </ul>

      {overwrites.length > 0 && (
        <p className="text-xs text-neutral-500">
          Overwritten: {overwrites.slice(0, PREVIEW_LIST_LIMIT).map((order) => `#${order.id}`).join(', ')}
          {overwrites.length > PREVIEW_LIST_LIMIT ? `, and ${overwrites.length - PREVIEW_LIST_LIMIT} more` : ''}
        </p>
      )}

      {errors.length > 0 && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          {errors.slice(0, 5).map((error) => (
            <p key={error.index}>
              Row {error.index + 1}{error.id ? ` (#${error.id})` : ''}: {error.messages.join('; ')}
            </p>
          ))}
          {errors.length > 5 && <p>and {errors.length - 5} more</p>}
        </div>
      )}

      <div>
        <label className="block mb-1 text-sm font-medium text-neutral-700">Enter your PIN to confirm</label>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="PIN"
          maxLength={10}
        />
        {pinError && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <SafeIcon icon={FiAlertCircle} className="mr-1" />
            {pinError}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <button
          onClick={onCancel}
          disabled={busy}
          className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy || !pin || orders.length === 0}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <SafeIcon icon={FiUpload} className="mr-2" />
          {busy ? 'Importing...' : `Import ${orders.length} service orders`}
        </button>
      </div>
    </div>
  );
};

// Import is two steps: read and validate the file to show what would change, then confirm with the PIN.
const ImportPanel = ({ onMessage, onImported }) => {
  const [preview, setPreview] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const reset = () => {
    setPreview(null);
    setPin('');
    setPinError('');
    setFileInputKey((key) => key + 1);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    onMessage({ type: '', text: '' });
    setBusy(true);
    try {
      const parsed = parseImportFile(await file.text());
      if (parsed.fileError) {
        onMessage({ type: 'error', text: parsed.fileError });
        reset();
        return;
      }
      const existing = await findExistingIds(parsed.orders.map((order) => order.id));
      setPreview({ ...parsed, existing, fileName: file.name });
    } catch (error) {
      console.error('Import preview error:', error);
      onMessage({ type: 'error', text: 'Could not read the import file. Please try again.' });
      reset();
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    setBusy(true);
    setPinError('');
    try {
      const { isValid, error } = await validatePin(pin);
      if (!isValid) {
        setPinError(error || 'Incorrect PIN.');
        return;
      }

      const result = await importOrders(preview.orders);
      await onImported();
      onMessage({
        type: 'success',
        text: `Import complete: ${result.created} added, ${result.updated} updated, ${result.history_added} history entries restored.`
      });
      reset();
    } catch (error) {
      console.error('Import error:', error);
      onMessage({ type: 'error', text: 'Import failed and nothing was changed. Please try again.' });
      reset();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <SafeIcon icon={FiUpload} className="text-primary-500 mr-2" />
        <h3 className="text-lg font-medium">Import Data</h3>
      </div>
      <p className="text-neutral-600 mb-6">Restore service orders from a previously exported JSON file.</p>

      {preview ? (
        <ImportPreview
          preview={preview}
          pin={pin}
          setPin={setPin}
          pinError={pinError}
          busy={busy}
          onConfirm={handleConfirm}
          onCancel={reset}
        />
      ) : (
        <div>
          <label className="block mb-2 text-sm font-medium text-neutral-700">Select export file (.json)</label>
          <input
            key={fileInputKey}
            type="file"
            accept=".json"
            disabled={busy}
            onChange={handleFileChange}
            className="w-full text-sm text-neutral-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {busy && <p className="mt-2 text-sm text-neutral-500">Checking file...</p>}
        </div>
      )}
    </div>
  );
};

export default ImportPanel;
