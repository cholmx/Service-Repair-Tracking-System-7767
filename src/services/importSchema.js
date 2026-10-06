import { z } from 'zod'
import { ALL_STATUSES } from '../constants/statuses'
import { looksLikeScba } from '../utils/scba'

export const MAX_IMPORT_ORDERS = 2000

const requiredText = z.string().trim().min(1, 'is required')

const optionalText = z
  .string()
  .nullish()
  .transform((value) => (value && value.trim() ? value.trim() : null))

const timestamp = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'is not a valid date')

const optionalTimestamp = timestamp.nullish().transform((value) => value ?? null)

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}/, 'must look like YYYY-MM-DD')
  .nullish()
  .transform((value) => (value ? value.slice(0, 10) : null))

const nonNegative = z.number().finite().min(0)

const line = (quantityKey, rateKey) =>
  z
    .object({
      description: z.string().default(''),
      [quantityKey]: nonNegative,
      [rateKey]: nonNegative,
      isWarranty: z.boolean().optional()
    })
    .passthrough()

const lines = (quantityKey, rateKey) =>
  z
    .array(line(quantityKey, rateKey))
    .nullish()
    .transform((value) => value ?? [])

const historyEntry = z.object({
  id: z.string().uuid().nullish().transform((value) => value ?? null),
  status: z.enum(ALL_STATUSES),
  notes: z.string().nullish().transform((value) => value ?? ''),
  created_at: timestamp
})

const history = z.array(historyEntry).nullish()

const orderSchema = z
  .object({
    id: z
      .union([z.string(), z.number()])
      .transform(String)
      .pipe(z.string().regex(/^[A-Za-z0-9-]{1,20}$/, 'must be 1 to 20 letters, numbers or dashes')),
    customer_name: requiredText,
    customer_phone: requiredText,
    customer_email: optionalText,
    company: optionalText,
    item_type: requiredText,
    serial_number: optionalText,
    quantity: z.number().int().min(1).default(1),
    description: requiredText,
    urgency: z
      .string()
      .nullish()
      .transform((value) => value || 'normal'),
    expected_completion: optionalDate,
    status: z.enum(ALL_STATUSES),
    parts: lines('quantity', 'price'),
    labor: lines('hours', 'rate'),
    tax_rate: z
      .number()
      .min(0)
      .max(100)
      .nullish()
      .transform((value) => value ?? 0),
    is_scba: z.boolean().nullish(),
    archived_at: optionalTimestamp,
    created_at: optionalTimestamp,
    statusHistory: history,
    status_history: history
  })
  .transform(({ statusHistory, status_history, ...order }) => ({
    ...order,
    // Files from before the SCBA flag existed get the same guess the database would make.
    is_scba: order.is_scba ?? looksLikeScba(order.item_type),
    history: statusHistory ?? status_history ?? []
  }))

const describe = (error) =>
  error.issues.slice(0, 3).map((issue) => `${issue.path.join('.') || 'row'} ${issue.message}`)

// Turns the text of an export file into validated rows ready for import_service_orders().
// Returns { fileError } when the file as a whole is unusable, otherwise { orders, errors }
// where errors lists the rows that were rejected and why.
export const parseImportFile = (text) => {
  let raw
  try {
    raw = JSON.parse(text)
  } catch {
    return { fileError: 'The file is not valid JSON.' }
  }

  const rows = Array.isArray(raw) ? raw : raw?.data
  if (!Array.isArray(rows)) {
    return { fileError: 'The file does not contain a "data" list of service orders.' }
  }
  if (rows.length === 0) {
    return { fileError: 'The file does not contain any service orders.' }
  }
  if (rows.length > MAX_IMPORT_ORDERS) {
    return { fileError: `The file has ${rows.length} orders. The limit is ${MAX_IMPORT_ORDERS} per import.` }
  }

  const orders = []
  const errors = []
  const seen = new Set()

  rows.forEach((row, index) => {
    const result = orderSchema.safeParse(row)
    if (!result.success) {
      errors.push({ index, id: row?.id ?? null, messages: describe(result.error) })
    } else if (seen.has(result.data.id)) {
      errors.push({ index, id: result.data.id, messages: ['appears more than once in the file'] })
    } else {
      seen.add(result.data.id)
      orders.push(result.data)
    }
  })

  return { orders, errors }
}
