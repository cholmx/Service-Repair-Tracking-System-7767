import React from 'react';
import StatusBadge from '../StatusBadge';
import { STATUS_OPTIONS } from '../../constants/statuses';
import { inputClasses } from './styles';

const StatusDetailsCard = ({ item, isEditing, editData, needsQuote, onEditField }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
    <h2 className="text-xl font-semibold text-neutral-900 mb-6">Status & Details</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <span className="text-sm text-neutral-500">Current Status:</span>
        {isEditing ? (
          <select
            value={editData.status}
            onChange={(e) => onEditField('status', e.target.value)}
            className={inputClasses}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="mt-1">
            <StatusBadge status={item.status} />
          </div>
        )}
      </div>
      <div>
        <span className="text-sm text-neutral-500">Expected Completion:</span>
        {isEditing ? (
          <input
            type="date"
            value={editData.expected_completion}
            onChange={(e) => onEditField('expected_completion', e.target.value)}
            className={inputClasses}
          />
        ) : (
          <p className="mt-1 font-medium">
            {item.expected_completion ? new Date(item.expected_completion).toLocaleDateString() : 'Not set'}
          </p>
        )}
      </div>
    </div>
    {isEditing && (
      <div className="mt-6">
        <label className="block text-sm text-neutral-500 mb-2">Status Update Notes:</label>
        <textarea
          value={editData.statusNotes}
          onChange={(e) => onEditField('statusNotes', e.target.value)}
          className={inputClasses}
          rows={3}
          placeholder={needsQuote ? 'Add notes about the quote preparation...' : 'Add notes about this status update...'}
        />
      </div>
    )}
  </div>
);

export default StatusDetailsCard;
