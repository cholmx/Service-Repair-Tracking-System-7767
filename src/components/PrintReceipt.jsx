import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiTool } = FiIcons;

const PrintReceipt = ({ item, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Screen-only header */}
        <div className="p-6 border-b border-neutral-200 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">Print Receipt</h2>
            <div className="flex space-x-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
              >
                Print
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Printable content */}
        <div className="p-6 print:p-3 print-receipt">
          {/* Header */}
          <div className="text-center mb-4 print:mb-3">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <SafeIcon icon={FiTool} className="text-2xl print:text-lg text-primary-500" />
              <h1 className="text-xl print:text-lg font-bold text-neutral-900">ServiceTracker</h1>
            </div>
            <p className="text-neutral-600 text-sm print:text-xs">Repair Service Receipt</p>
            <div className="mt-2 pt-2 border-t border-neutral-200">
              <div className="flex justify-between text-xs print:text-xs text-neutral-500">
                <span>Date: {currentDate}</span>
                <span>Receipt ID: #{item.id.slice(-6)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3 mb-4 print:mb-3">
            {/* Customer Information */}
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 mb-2 border-b border-neutral-200 pb-1">
                Customer Information
              </h2>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-neutral-500">Customer:</span>
                  {item.company ? (
                    <div>
                      <div className="font-medium text-neutral-900">{item.company}</div>
                      <div className="text-neutral-700">{item.customerName}</div>
                    </div>
                  ) : (
                    <div className="font-medium text-neutral-900">{item.customerName}</div>
                  )}
                </div>
                <div>
                  <span className="text-neutral-500">Contact:</span>
                  <div className="text-neutral-700">{item.customerPhone}</div>
                  {item.customerEmail && (
                    <div className="text-neutral-700">{item.customerEmail}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 mb-2 border-b border-neutral-200 pb-1">
                Service Order Details
              </h2>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-neutral-500">Service Order:</span>
                  <div className="font-medium text-neutral-900 capitalize">
                    {item.quantity}x {item.itemType}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500">Status:</span>
                  <div className="font-medium text-green-700">
                    {item.status === 'ready' ? 'Ready for Pickup or Delivery' : 'Completed'}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500">Description:</span>
                  <div className="text-neutral-700 text-xs leading-tight">{item.description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-4 print:mb-3">
            <h2 className="text-sm font-semibold text-neutral-900 mb-2 border-b border-neutral-200 pb-1">
              Service Details
            </h2>
            
            {/* Parts and Labor in two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3">
              {/* Parts Section */}
              <div>
                <h3 className="text-xs font-medium text-neutral-900 mb-2">Parts Used:</h3>
                {item.parts && item.parts.length > 0 ? (
                  <div className="space-y-1">
                    {item.parts.slice(0, 4).map((part, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <div className="flex-1 pr-2">
                          <div className="font-medium truncate">{part.description}</div>
                          <div className="text-neutral-600">{part.quantity} @ ${part.price.toFixed(2)}</div>
                        </div>
                        <div className="font-medium">${(part.quantity * part.price).toFixed(2)}</div>
                      </div>
                    ))}
                    {item.parts.length > 4 && (
                      <div className="text-xs text-neutral-500">+ {item.parts.length - 4} more items</div>
                    )}
                    <div className="border-t pt-1 mt-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Parts Total:</span>
                        <span>${item.partsTotal?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500">No parts used</div>
                )}
              </div>

              {/* Labor Section */}
              <div>
                <h3 className="text-xs font-medium text-neutral-900 mb-2">Labor:</h3>
                {item.labor && item.labor.length > 0 ? (
                  <div className="space-y-1">
                    {item.labor.slice(0, 4).map((labor, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <div className="flex-1 pr-2">
                          <div className="font-medium truncate">{labor.description}</div>
                          <div className="text-neutral-600">{labor.hours}h @ ${labor.rate.toFixed(2)}/hr</div>
                        </div>
                        <div className="font-medium">${(labor.hours * labor.rate).toFixed(2)}</div>
                      </div>
                    ))}
                    {item.labor.length > 4 && (
                      <div className="text-xs text-neutral-500">+ {item.labor.length - 4} more items</div>
                    )}
                    <div className="border-t pt-1 mt-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Labor Total:</span>
                        <span>${item.laborTotal?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500">No labor charged</div>
                )}
              </div>
            </div>

            {/* Totals Section - Compact */}
            <div className="border-t-2 border-neutral-400 pt-2 mt-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-700">Parts:</span>
                    <span>${item.partsTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700">Labor:</span>
                    <span>${item.laborTotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {item.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-700">Tax ({item.taxRate}%):</span>
                      <span>${item.tax?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end items-center">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-neutral-900">TOTAL:</div>
                    <div className="text-lg font-bold">${item.total?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;