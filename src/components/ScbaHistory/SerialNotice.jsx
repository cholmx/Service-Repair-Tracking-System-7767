import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiInfo } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { useSerialHistory } from '../../hooks/useSerialHistory';
import { REPEAT_WINDOW_DAYS, repairDate, summarizeSerialHistory } from '../../utils/serial';
import { statusLabel } from '../../utils/trackingFilters';

const Notice = ({ tone, children }) => (
  <div
    role="status"
    className={`mt-2 p-3 rounded-lg text-sm flex items-start ${
      tone === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-900' : 'bg-blue-50 border border-blue-200 text-blue-900'
    }`}
  >
    <SafeIcon icon={tone === 'warning' ? FiAlertTriangle : FiInfo} className="mr-2 mt-0.5 flex-shrink-0" />
    <div>{children}</div>
  </div>
);

const OrderLink = ({ order }) => (
  <Link to={`/item/${order.id}`} className="font-medium underline" target="_blank" rel="noreferrer">
    #{order.id}
  </Link>
);

// Shown under the serial number on the intake form for SCBAs. Never blocks anything.
const SerialNotice = ({ serial, isScba }) => {
  const { orders } = useSerialHistory(serial, { enabled: isScba });
  if (!isScba || orders.length === 0) return null;

  const { open, last, daysSinceLast, isRecentRepeat, total } = summarizeSerialHistory(orders);

  return (
    <>
      {open.length > 0 && (
        <Notice tone="warning">
          This serial number already has {open.length === 1 ? 'an open order' : 'open orders'} in the shop:{' '}
          {open.map((order, index) => (
            <span key={order.id}>
              {index > 0 && ', '}
              <OrderLink order={order} /> ({statusLabel(order.status)})
            </span>
          ))}
          . Check this is not a duplicate.
        </Notice>
      )}
      {isRecentRepeat && (
        <Notice tone="warning">
          Repaired {daysSinceLast === 0 ? 'today' : `${daysSinceLast} day${daysSinceLast === 1 ? '' : 's'} ago`} (order{' '}
          <OrderLink order={last} />). That is within {REPEAT_WINDOW_DAYS} days, so this may be a repeat problem or warranty work.
        </Notice>
      )}
      {!isRecentRepeat && last && (
        <Notice tone="info">
          {total} earlier {total === 1 ? 'order' : 'orders'} on this SCBA. Last repaired {new Date(repairDate(last)).toLocaleDateString()} (order{' '}
          <OrderLink order={last} />).
        </Notice>
      )}
    </>
  );
};

export default SerialNotice;
