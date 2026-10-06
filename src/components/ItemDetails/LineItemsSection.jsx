import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { formatMoney } from '../../utils/pricing';
import { inputClasses } from './styles';

const { FiPlus, FiTrash2, FiShield } = FiIcons;

const WarrantyBadge = () => (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
    <SafeIcon icon={FiShield} className="mr-1 text-xs" />
    Warranty
  </span>
);

const LineEditor = ({ config, line, onChange, onToggleWarranty, onRemove }) => (
  <div className="grid grid-cols-1 gap-4 p-4 bg-neutral-50 rounded-lg">
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <div className="md:col-span-2">
        <label className="block text-sm text-neutral-500 mb-1">{config.descriptionLabel}</label>
        <input
          type="text"
          value={line.description}
          onChange={(e) => onChange('description', e.target.value)}
          className={inputClasses}
          placeholder={config.descriptionPlaceholder}
        />
      </div>
      <div>
        <label className="block text-sm text-neutral-500 mb-1">{config.quantityLabel}</label>
        <input
          type="number"
          value={line[config.quantityField]}
          onChange={(e) => onChange(config.quantityField, e.target.value)}
          className={inputClasses}
          {...config.quantityInput}
        />
      </div>
      <div>
        <label className="block text-sm text-neutral-500 mb-1">{config.rateLabel}</label>
        <input
          type="number"
          value={line[config.rateField]}
          onChange={(e) => onChange(config.rateField, e.target.value)}
          className={inputClasses}
          disabled={line.isWarranty}
          {...config.rateInput}
        />
      </div>
      <div className="flex flex-col">
        <label className="block text-sm text-neutral-500 mb-1">Warranty</label>
        <button
          type="button"
          onClick={onToggleWarranty}
          className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            line.isWarranty
              ? 'bg-green-100 text-green-800 border-2 border-green-300'
              : 'bg-neutral-100 text-neutral-700 border-2 border-neutral-300 hover:bg-neutral-200'
          }`}
        >
          <SafeIcon icon={FiShield} className="mr-2" />
          {line.isWarranty ? 'Warranty' : 'Regular'}
        </button>
      </div>
      <div className="flex items-end">
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <SafeIcon icon={FiTrash2} />
        </button>
      </div>
    </div>
  </div>
);

const LineSummary = ({ config, line }) => (
  <div className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
    <div className="flex-1">
      <div className="flex items-center space-x-2">
        <p className="font-medium">{line.description}</p>
        {line.isWarranty && <WarrantyBadge />}
      </div>
      <p className="text-sm text-neutral-600">{config.describe(line)}</p>
    </div>
    <p className="font-medium">{line.isWarranty ? 'Warranty' : formatMoney(config.lineTotal(line))}</p>
  </div>
);

// Shared by the Parts and Labor cards. `items` is shown when viewing, `editItems` while editing.
const LineItemsSection = ({
  config,
  isEditing,
  items,
  editItems,
  onAdd,
  onRemove,
  onChange,
  onToggleWarranty,
  editFooter,
  viewFooter
}) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-neutral-900">{config.title}</h2>
      {isEditing && (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm"
        >
          <SafeIcon icon={FiPlus} className="mr-2" />
          {config.addLabel}
        </button>
      )}
    </div>

    {isEditing ? (
      <div className="space-y-4">
        {editItems.map((line, index) => (
          <LineEditor
            key={index}
            config={config}
            line={line}
            onChange={(field, value) => onChange(index, field, value)}
            onToggleWarranty={() => onToggleWarranty(index)}
            onRemove={() => onRemove(index)}
          />
        ))}
        {editFooter}
      </div>
    ) : items && items.length > 0 ? (
      <div className="space-y-3">
        {items.map((line, index) => (
          <LineSummary key={index} config={config} line={line} />
        ))}
        {viewFooter}
      </div>
    ) : (
      <p className="text-neutral-500 text-center py-8">{config.emptyText}</p>
    )}
  </div>
);

export default LineItemsSection;
