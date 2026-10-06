import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';

const QuoteAlert = () => (
  <div className="bg-indigo-50 p-4 rounded-lg mb-6 border border-indigo-200">
    <div className="flex">
      <SafeIcon icon={FiIcons.FiAlertCircle} className="text-indigo-500 text-lg mr-3 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="font-medium text-indigo-800 mb-1">Quote Needed</h3>
        <p className="text-sm text-indigo-700">
          This service order needs a quote. Please add parts and labor details, then update the status to "Awaiting Quote Approval" when ready.
        </p>
      </div>
    </div>
  </div>
);

export default QuoteAlert;
