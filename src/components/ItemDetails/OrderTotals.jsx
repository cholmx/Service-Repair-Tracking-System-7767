import React from 'react';
import { calculateTotals, formatMoney } from '../../utils/pricing';

export const PartsTotal = ({ item }) => (
  <div className="border-t pt-3 mt-3">
    <div className="flex justify-between font-semibold">
      <span>Parts Total:</span>
      <span>{formatMoney(item.parts_total)}</span>
    </div>
  </div>
);

export const LaborTotals = ({ item }) => (
  <div className="border-t pt-3 mt-3 space-y-2">
    <div className="flex justify-between">
      <span>Labor Total:</span>
      <span>{formatMoney(item.labor_total)}</span>
    </div>
    {item.tax > 0 && (
      <div className="flex justify-between">
        <span>Tax ({item.tax_rate}%):</span>
        <span>{formatMoney(item.tax)}</span>
      </div>
    )}
    <div className="flex justify-between font-semibold text-lg border-t pt-2">
      <span>Total:</span>
      <span>{formatMoney(item.total)}</span>
    </div>
  </div>
);

export const TaxRateInput = ({ value, onChange, parts, labor }) => {
  const totals = calculateTotals({ parts, labor, taxRate: value });

  return (
    <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
      <label className="block text-sm font-semibold text-neutral-800 mb-1">Tax Rate (%)</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-32 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        min="0"
        step="0.01"
        placeholder="0.00"
      />
      <div className="mt-4 space-y-1 text-sm text-neutral-700">
        <div className="flex justify-between"><span>Parts</span><span>{formatMoney(totals.partsTotal)}</span></div>
        <div className="flex justify-between"><span>Labor</span><span>{formatMoney(totals.laborTotal)}</span></div>
        <div className="flex justify-between"><span>Tax</span><span>{formatMoney(totals.tax)}</span></div>
        <div className="flex justify-between font-semibold"><span>Estimated total</span><span>{formatMoney(totals.total)}</span></div>
      </div>
    </div>
  );
};
