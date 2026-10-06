import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiDownload, FiRotateCcw, FiSave } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { backupFileName, backupHealth, formatBytes } from '../../utils/backups';
import { describeError } from '../../utils/errors';
import { downloadText } from '../../utils/download';
import { createBackup, getBackupFile, listBackups } from '../../services/backupService';

const HealthNotice = ({ health }) => {
  const ok = health.status === 'ok';
  const text = ok
    ? `Automatic backups are running. The last one was ${health.daysAgo === 0 ? 'today' : `${health.daysAgo} day${health.daysAgo === 1 ? '' : 's'} ago`}.`
    : health.status === 'stale'
    ? `The last automatic backup was ${health.daysAgo} days ago. One should run every Sunday. Ask your administrator to check that the weekly schedule is still on (see SUPABASE_SETUP.md).`
    : 'No automatic backup has run yet. The first one runs on Sunday. You can back up now to be safe.';

  return (
    <div
      role="status"
      className={`mb-6 p-4 rounded-lg flex items-start ${ok ? 'bg-green-50 text-green-800' : 'bg-yellow-50 border border-yellow-200 text-yellow-900'}`}
    >
      <SafeIcon icon={ok ? FiCheckCircle : FiAlertTriangle} className="mr-3 mt-0.5 text-lg flex-shrink-0" />
      <p>{text}</p>
    </div>
  );
};

const sourceLabel = { scheduled: 'Automatic', manual: 'Manual' };

const actionButton =
  'inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 transition-colors duration-200';

const BackupPanel = ({ onMessage, onRestore }) => {
  const [backups, setBackups] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoadError('');
      setBackups(await listBackups());
    } catch (error) {
      console.error('Error loading backups:', error);
      setLoadError(describeError(error));
      setBackups([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBackupNow = async () => {
    setCreating(true);
    onMessage({ type: '', text: '' });
    try {
      const result = await createBackup();
      await load();
      onMessage({ type: 'success', text: `Backup saved with ${result.order_count} service orders.` });
    } catch (error) {
      console.error('Backup error:', error);
      onMessage({ type: 'error', text: `Could not save a backup. ${describeError(error)}` });
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (backup) => {
    setBusyId(backup.id);
    try {
      downloadText(backupFileName(backup), JSON.stringify(await getBackupFile(backup.id), null, 2));
    } catch (error) {
      onMessage({ type: 'error', text: `Could not download the backup. ${describeError(error)}` });
    } finally {
      setBusyId(null);
    }
  };

  const handleRestore = async (backup) => {
    setBusyId(backup.id);
    try {
      const file = await getBackupFile(backup.id);
      onRestore({
        id: Date.now(),
        name: `the backup from ${new Date(backup.created_at).toLocaleDateString()}`,
        text: JSON.stringify(file)
      });
    } catch (error) {
      onMessage({ type: 'error', text: `Could not open the backup. ${describeError(error)}` });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SafeIcon icon={FiClock} className="text-primary-500 text-2xl mr-3" />
          <h2 className="text-xl font-semibold text-neutral-900">Automatic Backups</h2>
        </div>
        <button
          onClick={handleBackupNow}
          disabled={creating}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <SafeIcon icon={FiSave} className="mr-2" />
          {creating ? 'Saving...' : 'Back up now'}
        </button>
      </div>

      <p className="text-neutral-600 mb-6">
        A copy of every service order and its history is saved each Sunday morning. The last 12 weekly backups are kept, plus the last 5 you make by hand.
        Restoring puts the orders in a backup back as they were. Orders created after the backup are kept.
      </p>

      {loadError && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          Could not load the backups. {loadError}
        </div>
      )}

      {backups && !loadError && <HealthNotice health={backupHealth(backups)} />}

      {backups === null ? (
        <p className="text-neutral-500">Loading backups...</p>
      ) : backups.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-100">
              <tr>
                {['Saved', 'Type', 'Service orders', 'Size', ''].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {backups.map((backup) => (
                <tr key={backup.id}>
                  <td className="px-4 py-3 text-sm text-neutral-900">{new Date(backup.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{sourceLabel[backup.source]}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{backup.order_count}</td>
                  <td className="px-4 py-3 text-sm text-neutral-700">{formatBytes(backup.size_bytes)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleDownload(backup)} disabled={busyId === backup.id} className={actionButton}>
                        <SafeIcon icon={FiDownload} className="mr-1" />
                        Download
                      </button>
                      <button onClick={() => handleRestore(backup)} disabled={busyId === backup.id} className={actionButton}>
                        <SafeIcon icon={FiRotateCcw} className="mr-1" />
                        Restore
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loadError && <p className="text-neutral-500">No backups yet.</p>
      )}
    </div>
  );
};

export default BackupPanel;
