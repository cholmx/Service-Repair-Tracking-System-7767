import React from 'react';
import { FiBriefcase, FiMail, FiPhone, FiUser } from 'react-icons/fi';
import SafeIcon from '../../common/SafeIcon';
import { EditButton } from './OrderInfoCard';
import { inputClasses } from './styles';


const fullWidthInput = `${inputClasses} mt-1 w-full`;

const Field = ({ icon, label, children }) => (
  <div className="flex items-center">
    <SafeIcon icon={icon} className="text-primary-500 mr-3" />
    <div>
      <span className="text-sm text-neutral-500">{label}</span>
      {children}
    </div>
  </div>
);

const CustomerCard = ({ item, isEditing, isEditingCustomer, customerEditData, onCustomerField, onEdit }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold text-neutral-900">Customer Information</h2>
      {!isEditing && !isEditingCustomer && <EditButton onClick={onEdit} />}
    </div>
    <div className="space-y-4">
      <Field icon={FiUser} label="Name:">
        {isEditingCustomer ? (
          <input
            type="text"
            value={customerEditData.customer_name}
            onChange={(e) => onCustomerField('customer_name', e.target.value)}
            className={fullWidthInput}
            placeholder="Customer name"
          />
        ) : item.company ? (
          <div>
            <div className="font-medium text-neutral-900">{item.company}</div>
            <div className="text-neutral-700">{item.customer_name}</div>
          </div>
        ) : (
          <div className="font-medium text-neutral-900">{item.customer_name}</div>
        )}
      </Field>
      <Field icon={FiBriefcase} label="Company:">
        {isEditingCustomer ? (
          <input
            type="text"
            value={customerEditData.company || ''}
            onChange={(e) => onCustomerField('company', e.target.value)}
            className={fullWidthInput}
            placeholder="Company name (optional)"
          />
        ) : (
          <p className="font-medium">{item.company || 'Not specified'}</p>
        )}
      </Field>
      <Field icon={FiPhone} label="Phone:">
        {isEditingCustomer ? (
          <input
            type="tel"
            value={customerEditData.customer_phone}
            onChange={(e) => onCustomerField('customer_phone', e.target.value)}
            className={fullWidthInput}
            placeholder="Phone number"
          />
        ) : (
          <p className="font-medium">{item.customer_phone}</p>
        )}
      </Field>
      <Field icon={FiMail} label="Email:">
        {isEditingCustomer ? (
          <input
            type="email"
            value={customerEditData.customer_email || ''}
            onChange={(e) => onCustomerField('customer_email', e.target.value)}
            className={fullWidthInput}
            placeholder="Email address (optional)"
          />
        ) : (
          <p className="font-medium">{item.customer_email || 'Not specified'}</p>
        )}
      </Field>
    </div>
  </div>
);

export default CustomerCard;
