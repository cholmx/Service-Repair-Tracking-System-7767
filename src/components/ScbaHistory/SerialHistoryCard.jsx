import React from 'react';
import { Link } from 'react-router-dom';
import { FiClock } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import StatusBadge from '../StatusBadge';
import { useSerialHistory } from '../../hooks/useSerialHistory';
import { REPEAT_WINDOW_DAYS, repairDate, scbaHistoryLink, summarizeSerialHistory } from '../../utils/serial';
import { formatMoney } from '../../utils/pricing';

const SHOWN = 5;

// On an SCBA's order page: the other repairs on the same serial number.
const SerialHistoryCard = ({ item }) => {
  const link = scbaHistoryLink(item);
  const { orders, loading, failed } = useSerialHistory(item.serial_number, { excludeId: item.id, enabled: Boolean(link), debounceMs: 0 });
  if (!link) return null;

  const summary = summarizeSerialHistory(orders);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <SafeIcon icon={FiClock} className="text-primary-500 text-xl mr-3" />
          <h2 className="text-xl font-semibold text-neutral-900">SCBA Repair History</h2>
        </div>
        <Link to={link} className="text-sm text-primary-600 hover:text-primary-700">
          View full history
        </Link>
      </div>

      {summary.isRecentRepeat && (
        <div role="status" className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900">
          Repeat repair: this SCBA was last finished {summary.daysSinceLast} {summary.daysSinceLast === 1 ? 'day' : 'days'} ago (order #{summary.last.id}),
          within {REPEAT_WINDOW_DAYS} days. Check for warranty work or a problem that was not fixed.
        </div>
      )}

      {loading ? (
        <p className="text-neutral-500">Checking history...</p>
      ) : failed ? (
        <p className="text-neutral-500">Could not load the history for this serial number.</p>
      ) : orders.length === 0 ? (
        <p className="text-neutral-500">No other repairs on record for serial number {item.serial_number}.</p>
      ) : (
        <ul className="space-y-2">
          {orders.slice(0, SHOWN).map((order) => (
            <li key={order.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3 bg-neutral-50 rounded-lg">
              <Link to={`/item/${order.id}`} className="font-mono text-primary-700 font-medium">
                #{order.id}
              </Link>
              <StatusBadge status={order.status} />
              <span className="text-sm text-neutral-500">{new Date(repairDate(order)).toLocaleDateString()}</span>
              <span className="flex-1 min-w-[10rem] text-sm text-neutral-800">{order.description}</span>
              {order.total > 0 && <span className="text-sm font-medium">{formatMoney(order.total)}</span>}
            </li>
          ))}
          {orders.length > SHOWN && (
            <li className="text-sm text-neutral-500">
              and {orders.length - SHOWN} more.{' '}
              <Link to={link} className="text-primary-600">
                See all
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SerialHistoryCard;
