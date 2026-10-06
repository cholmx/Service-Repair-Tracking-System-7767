import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import ErrorBanner from '../components/ErrorBanner';
import OrderTimeline from '../components/ScbaHistory/OrderTimeline';
import { fetchSerialHistory, searchScbaSerials } from '../services/serialService';
import { describeError } from '../utils/errors';
import { MIN_SERIAL_CHARS, groupUnits, normalizeSerial } from '../utils/serial';

const SEARCH_DEBOUNCE_MS = 300;

const ScbaHistory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedKey = searchParams.get('serial');
  const [term, setTerm] = useState(selectedKey || '');
  const [rows, setRows] = useState([]);
  const [searching, setSearching] = useState(false);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  const searchKey = normalizeSerial(term);
  const searchable = searchKey !== null && searchKey.length >= MIN_SERIAL_CHARS;

  useEffect(() => {
    if (!searchable) {
      setRows([]);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchScbaSerials(searchKey);
        if (!cancelled) {
          setRows(found);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(describeError(err));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchKey, searchable]);

  useEffect(() => {
    if (!selectedKey) {
      setOrders(null);
      return undefined;
    }
    let cancelled = false;
    setOrders(null);
    fetchSerialHistory(selectedKey)
      .then((found) => {
        if (!cancelled) {
          setOrders(found);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedKey]);

  const units = useMemo(() => groupUnits(rows), [rows]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2 font-display">SCBA Repair History</h1>
          <p className="text-neutral-600">
            Search an SCBA by serial number to see every repair the shop has done on it. Spaces, dashes and capitals do not matter.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Serial number (at least 3 characters)"
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            />
          </div>

          {searchable && !searching && units.length === 0 && !error && (
            <p className="mt-4 text-neutral-500">No SCBA with a serial number matching "{term}" has been repaired here.</p>
          )}

          {units.length > 0 && (
            <ul className="mt-4 divide-y divide-neutral-200 border border-neutral-200 rounded-lg overflow-hidden">
              {units.map((unit) => (
                <li key={unit.key}>
                  <button
                    onClick={() => setSearchParams({ serial: unit.key })}
                    className={`w-full text-left px-4 py-3 hover:bg-neutral-50 ${unit.key === selectedKey ? 'bg-primary-50' : ''}`}
                  >
                    <div className="font-medium text-neutral-900">{unit.serial}</div>
                    <div className="text-sm text-neutral-500">
                      {unit.itemTypes.join(', ')} · {unit.owners.join(', ')} · {unit.orderCount} {unit.orderCount === 1 ? 'repair' : 'repairs'} · last seen{' '}
                      {new Date(unit.lastSeen).toLocaleDateString()}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <ErrorBanner message={error} />}

        {selectedKey && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">Serial {orders?.[0]?.serial_number || selectedKey}</h2>
            {orders === null ? (
              !error && <p className="text-neutral-500">Loading history...</p>
            ) : orders.length === 0 ? (
              <p className="text-neutral-500">No SCBA repairs on record for this serial number.</p>
            ) : (
              <>
                <p className="text-sm text-neutral-500 mb-4">
                  {orders.length} {orders.length === 1 ? 'repair' : 'repairs'} on record
                </p>
                <OrderTimeline orders={orders} />
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ScbaHistory;
