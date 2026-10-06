// Pure helpers for editing the parts and labor lists on a service order.

export const PARTS_NUMERIC_FIELDS = ['quantity', 'price']
export const LABOR_NUMERIC_FIELDS = ['hours', 'rate']

export const newPart = () => ({ description: '', quantity: 1, price: 0, isWarranty: false })

export const newLabor = () => ({ description: '', hours: 1, rate: 0, isWarranty: false })

export const addLine = (lines, line) => [...lines, line]

export const removeLine = (lines, index) => lines.filter((_, i) => i !== index)

export const updateLine = (lines, index, field, value, numericFields) =>
  lines.map((line, i) => {
    if (i !== index) return line
    return { ...line, [field]: numericFields.includes(field) ? parseFloat(value) || 0 : value }
  })

// Warranty lines are free, so switching one on zeroes its rate.
export const toggleWarranty = (lines, index, rateField) =>
  lines.map((line, i) => {
    if (i !== index) return line
    const isWarranty = !line.isWarranty
    return { ...line, isWarranty, [rateField]: isWarranty ? 0 : line[rateField] }
  })
