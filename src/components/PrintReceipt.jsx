import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiTool, FiHash, FiShield } = FiIcons;

const PrintReceipt = ({ item, onClose }) => {
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = document.querySelector('.print-receipt').innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Service Receipt - #${item.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.2; color: #000; background: white; }
            .print-receipt { padding: 20px; max-width: 600px; margin: 0 auto; }
            h1 { font-size: 14pt; margin-bottom: 4px; text-align: center; }
            h2 { font-size: 11pt; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 2px; }
            h3 { font-size: 10pt; margin-bottom: 4px; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .font-medium { font-weight: 500; }
            .text-sm { font-size: 9pt; }
            .text-xs { font-size: 8pt; }
            .text-lg { font-size: 12pt; }
            .mb-1 { margin-bottom: 2px; }
            .mb-2 { margin-bottom: 4px; }
            .mb-3 { margin-bottom: 6px; }
            .mb-4 { margin-bottom: 8px; }
            .mt-1 { margin-top: 2px; }
            .mt-2 { margin-top: 4px; }
            .mt-3 { margin-top: 6px; }
            .pt-1 { padding-top: 2px; }
            .pt-2 { padding-top: 4px; }
            .pb-1 { padding-bottom: 2px; }
            .border-t { border-top: 1px solid #000; }
            .border-t-2 { border-top: 2px solid #000; }
            .border-b { border-bottom: 1px solid #000; }
            .grid { display: grid; gap: 12px; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .items-center { align-items: center; }
            .space-y-1 > * + * { margin-top: 2px; }
            .space-x-2 > * + * { margin-left: 4px; }
            .text-neutral-500 { color: #666; }
            .text-neutral-600 { color: #555; }
            .text-neutral-700 { color: #444; }
            .text-neutral-900 { color: #000; }
            .text-green-700 { color: #15803d; }
            .text-blue-700 { color: #1d4ed8; }
            .text-purple-700 { color: #7e22ce; }
            .leading-tight { line-height: 1.1; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .pr-2 { padding-right: 4px; }
            .flex-1 { flex: 1; }
            .bg-blue-50 { background-color: #eff6ff; }
            .bg-green-50 { background-color: #f0fdf4; }
            .bg-purple-50 { background-color: #f5f3ff; }
            .p-2 { padding: 8px; }
            .px-2 { padding-left: 8px; padding-right: 8px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .rounded { border-radius: 4px; }
            .warranty-badge { background-color: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 12px; font-size: 8pt; font-weight: 500; margin-left: 6px; }
            .quote-badge { background-color: #f3e8ff; color: #7e22ce; padding: 2px 6px; border-radius: 12px; font-size: 8pt; font-weight: 500; margin-left: 6px; }
            @media print {
              body { print-color-adjust: exact; }
              .print-receipt { padding: 10px; }
              .bg-blue-50 { background-color: #f8f9fa !important; }
              .bg-green-50 { background-color: #f0fdf4 !important; }
              .bg-purple-50 { background-color: #f5f3ff !important; }
              .warranty-badge { background-color: #dcfce7 !important; color: #166534 !important; }
              .quote-badge { background-color: #f3e8ff !important; color: #7e22ce !important; }
            }
          </style>
        </head>
        <body>
          <div class="print-receipt">${printContent}</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const currentDate = new Date().toLocaleDateString();

  // Get the latest "ready" status update notes
  const getReadyStatusNotes = () => {
    if (!item.statusHistory || !Array.isArray(item.statusHistory)) return null;
    
    // Find the most recent "ready" status entry
    const readyStatusEntry = item.statusHistory
      .slice()
      .reverse()
      .find(entry => entry.status === 'ready');
    
    return readyStatusEntry?.notes || null;
  };

  const readyStatusNotes = getReadyStatusNotes();
  const showStatusNotes = item.status === 'ready' && readyStatusNotes && readyStatusNotes.trim() !== '';
  
  // Special styling for quote approval receipts
  const isQuoteApproval = item.status === 'quote-approval';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Screen-only header */}
        <div className="p-6 border-b border-neutral-200 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">
              {isQuoteApproval ? 'Print Quote' : 'Print Receipt'}
            </h2>
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
            <p className="text-neutral-600 text-sm print:text-xs">
              {isQuoteApproval ? 'Service Quote - Approval Required' : 'Repair Service Receipt'}
            </p>
            <div className="mt-2 pt-2 border-t border-neutral-200">
              <div className="flex justify-between text-xs print:text-xs text-neutral-500">
                <span>Date: {currentDate}</span>
                <span>{isQuoteApproval ? 'Quote' : 'Receipt'} ID: #{item.id}</span>
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
                      <div className="text-neutral-700">{item.customer_name}</div>
                    </div>
                  ) : (
                    <div className="font-medium text-neutral-900">{item.customer_name}</div>
                  )}
                </div>
                <div>
                  <span className="text-neutral-500">Contact:</span>
                  <div className="text-neutral-700">{item.customer_phone}</div>
                  {item.customer_email && (
                    <div className="text-neutral-700">{item.customer_email}</div>
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
                    {item.quantity}x {item.item_type}
                  </div>
                </div>
                {item.serial_number && (
                  <div>
                    <span className="text-neutral-500">Serial Number:</span>
                    <div className="font-medium text-neutral-900">
                      {item.serial_number}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-neutral-500">Status:</span>
                  <div className={`font-medium ${isQuoteApproval ? 'text-purple-700' : 'text-green-700'}`}>
                    {isQuoteApproval ? 'Awaiting Quote Approval' : 
                      (item.status === 'ready' ? 'Ready for Pickup or Delivery' : 'Completed')}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500">Description:</span>
                  <div className="text-neutral-700 text-xs leading-tight">{item.description}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Approval Notice - Only show when status is "quote-approval" */}
          {isQuoteApproval && (
            <div className="mb-4 print:mb-3">
              <div className="bg-purple-50 p-2 rounded text-xs">
                <div className="text-purple-700 font-medium mb-1">Quote Approval Required:</div>
                <div className="text-neutral-700 leading-tight">
                  This is a quote for repair work. Please contact us to approve this quote before we proceed with the work.
                </div>
              </div>
            </div>
          )}

          {/* Service Complete Notes - Only show when status is "ready" and notes exist */}
          {showStatusNotes && (
            <div className="mb-4 print:mb-3">
              <div className="bg-blue-50 p-2 rounded text-xs">
                <div className="text-blue-700 font-medium mb-1">Service Complete:</div>
                <div className="text-neutral-700 leading-tight">{readyStatusNotes}</div>
              </div>
            </div>
          )}

          {/* Service Details */}
          <div className="mb-4 print:mb-3">
            <h2 className="text-sm font-semibold text-neutral-900 mb-2 border-b border-neutral-200 pb-1">
              {isQuoteApproval ? 'Quote Details' : 'Service Details'}
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
                          <div className="font-medium truncate">
                            {part.description}
                            {part.isWarranty && <span className="warranty-badge">⚡ Warranty</span>}
                          </div>
                          <div className="text-neutral-600">
                            {part.quantity} {part.isWarranty ? '(Under Warranty)' : `@ $${part.price.toFixed(2)}`}
                          </div>
                        </div>
                        <div className="font-medium">
                          {part.isWarranty ? 'Warranty' : `$${(part.quantity * part.price).toFixed(2)}`}
                        </div>
                      </div>
                    ))}
                    {item.parts.length > 4 && (
                      <div className="text-xs text-neutral-500">+ {item.parts.length - 4} more items</div>
                    )}
                    <div className="border-t pt-1 mt-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Parts Total:</span>
                        <span>${item.parts_total?.toFixed(2) || '0.00'}</span>
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
                          <div className="font-medium truncate">
                            {labor.description}
                            {labor.isWarranty && <span className="warranty-badge">⚡ Warranty</span>}
                          </div>
                          <div className="text-neutral-600">
                            {labor.hours}h {labor.isWarranty ? '(Under Warranty)' : `@ $${labor.rate.toFixed(2)}/hr`}
                          </div>
                        </div>
                        <div className="font-medium">
                          {labor.isWarranty ? 'Warranty' : `$${(labor.hours * labor.rate).toFixed(2)}`}
                        </div>
                      </div>
                    ))}
                    {item.labor.length > 4 && (
                      <div className="text-xs text-neutral-500">+ {item.labor.length - 4} more items</div>
                    )}
                    <div className="border-t pt-1 mt-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Labor Total:</span>
                        <span>${item.labor_total?.toFixed(2) || '0.00'}</span>
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
                    <span>${item.parts_total?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-700">Labor:</span>
                    <span>${item.labor_total?.toFixed(2) || '0.00'}</span>
                  </div>
                  {item.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-700">Tax ({item.tax_rate}%):</span>
                      <span>${item.tax?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end items-center">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-neutral-900">
                      {isQuoteApproval ? 'QUOTE TOTAL:' : 'TOTAL:'}
                    </div>
                    <div className="text-lg font-bold">${item.total?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Section for Quote */}
            {isQuoteApproval && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="text-xs">
                  <div className="font-medium mb-2">Quote Approval:</div>
                  <div className="flex justify-between mt-4 mb-2">
                    <div className="border-b border-neutral-400 w-[45%]"></div>
                    <div className="border-b border-neutral-400 w-[45%]"></div>
                  </div>
                  <div className="flex justify-between text-center">
                    <div className="w-[45%]">Customer Signature</div>
                    <div className="w-[45%]">Date</div>
                  </div>
                  <div className="mt-4 text-neutral-500 text-center">
                    By signing above, you authorize the work described in this quote.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;