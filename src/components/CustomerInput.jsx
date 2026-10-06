import React, { useState } from 'react';
import { useCustomerSuggestions } from '../hooks/useCustomerSuggestions';

// A text input that suggests customers from past orders. Choosing one calls onSelectCustomer
// with { name, phone, email, company } so the form can fill in the rest.
const CustomerInput = ({ onSelectCustomer, minChars = 2, ...inputProps }) => {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const suggestions = useCustomerSuggestions(String(inputProps.value || ''), { minChars, enabled: open });
  const visible = open && suggestions.length > 0;

  const choose = (customer) => {
    onSelectCustomer(customer);
    setOpen(false);
    setHighlight(-1);
  };

  const handleKeyDown = (event) => {
    if (!visible) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((current) => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === 'Enter' && highlight >= 0) {
      event.preventDefault();
      choose(suggestions[highlight]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        {...inputProps}
        autoComplete="off"
        role="combobox"
        aria-expanded={visible}
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setOpen(true);
          setHighlight(-1);
          inputProps.onChange(event);
        }}
        onKeyDown={handleKeyDown}
      />
      {visible && (
        <ul
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden"
        >
          {suggestions.map((customer, index) => (
            <li
              key={`${customer.phone}-${customer.name}`}
              role="option"
              aria-selected={index === highlight}
              // mousedown fires before the input loses focus, so the choice is not lost to onBlur
              onMouseDown={(event) => {
                event.preventDefault();
                choose(customer);
              }}
              onMouseEnter={() => setHighlight(index)}
              className={`px-4 py-2 cursor-pointer ${index === highlight ? 'bg-primary-50' : 'hover:bg-neutral-50'}`}
            >
              <div className="text-sm font-medium text-neutral-900">
                {customer.name}
                {customer.company && <span className="text-neutral-500 font-normal"> · {customer.company}</span>}
              </div>
              <div className="text-xs text-neutral-500">
                {[customer.phone, customer.email, `${customer.orderCount} past ${customer.orderCount === 1 ? 'order' : 'orders'}`]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerInput;
