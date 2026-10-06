import { calculateTotals, formatMoney } from '../../utils/pricing'
import { LABOR_NUMERIC_FIELDS, PARTS_NUMERIC_FIELDS } from '../../utils/lineItems'

export const partsConfig = {
  title: 'Parts Used',
  addLabel: 'Add Part',
  descriptionLabel: 'Description',
  descriptionPlaceholder: 'Part description',
  quantityField: 'quantity',
  quantityLabel: 'Quantity',
  quantityInput: { min: '1' },
  rateField: 'price',
  rateLabel: 'Price ($)',
  rateInput: { min: '0', step: '0.01' },
  emptyText: 'No parts added yet',
  numericFields: PARTS_NUMERIC_FIELDS,
  describe: (line) =>
    `Qty: ${line.quantity} ${line.isWarranty ? '(Under Warranty)' : `@ ${formatMoney(line.price)} each`}`,
  lineTotal: (line) => calculateTotals({ parts: [line] }).partsTotal
}

export const laborConfig = {
  title: 'Labor',
  addLabel: 'Add Labor',
  descriptionLabel: 'Service Description',
  descriptionPlaceholder: 'Service description',
  quantityField: 'hours',
  quantityLabel: 'Hours',
  quantityInput: { min: '0', step: '0.25' },
  rateField: 'rate',
  rateLabel: 'Rate ($/hr)',
  rateInput: { min: '0', step: '0.01' },
  emptyText: 'No labor added yet',
  numericFields: LABOR_NUMERIC_FIELDS,
  describe: (line) =>
    `${line.hours} hours ${line.isWarranty ? '(Under Warranty)' : `@ ${formatMoney(line.rate)}/hr`}`,
  lineTotal: (line) => calculateTotals({ labor: [line] }).laborTotal
}
