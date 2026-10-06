import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import { annotateRepeats, repairDate } from '../../utils/serial';
import { formatMoney } from '../../utils/pricing';

const partsSummary = (parts) =>
  (parts || [])
    .map((part) => `${part.quantity > 1 ? `${part.quantity} x ` : ''}${part.description}${part.isWarranty ? ' (warranty)' : ''}`)
    .filter(Boolean)
    .join(', ');

// The orders for one SCBA, newest first, with a flag on any that came back soon after a repair.
const OrderTimeline = ({ orders }) => (
  <ol className="space-y-4">
    {annotateRepeats(orders).map((order) => (
      <li key={order.id} className="border border-neutral-200 rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Link to={`/item/${order.id}`} className="font-mono text-primary-700 hover:text-primary-800 font-medium">
            #{order.id}
          </Link>
          <StatusBadge status={order.status} />
          <span className="text-sm text-neutral-500">Received {new Date(order.created_at).toLocaleDateString()}</span>
          {['ready', 'completed', 'archived'].includes(order.status) && (
            <span className="text-sm text-neutral-500">Finished {new Date(repairDate(order)).toLocaleDateString()}</span>
          )}
          {order.isRepeat && (
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Repeat: {order.daysAfterPrevious} days after the previous repair
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-700 mb-1">
          {order.company ? `${order.company} (${order.customer_name})` : order.customer_name} · {order.item_type}
        </p>
        <p className="text-neutral-900">{order.description}</p>
        {partsSummary(order.parts) && <p className="mt-2 text-sm text-neutral-600">Parts: {partsSummary(order.parts)}</p>}
        {order.labor?.length > 0 && (
          <p className="text-sm text-neutral-600">
            Labor: {order.labor.map((line) => `${line.description || 'Labor'} (${line.hours}h${line.isWarranty ? ', warranty' : ''})`).join(', ')}
          </p>
        )}
        {order.total > 0 && <p className="mt-1 text-sm font-medium text-neutral-800">Total {formatMoney(order.total)}</p>}
      </li>
    ))}
  </ol>
);

export default OrderTimeline;
