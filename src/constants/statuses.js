export const STATUS_OPTIONS = [
  { value: 'received', label: 'Received' },
  { value: 'needs-quote', label: 'Needs Quote' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'waiting-parts', label: 'Waiting on Parts' },
  { value: 'quote-approval', label: 'Awaiting Quote Approval' },
  { value: 'ready', label: 'Ready for Pickup or Delivery' },
  { value: 'completed', label: 'Completed' }
]

export const ALL_STATUSES = [...STATUS_OPTIONS.map((option) => option.value), 'archived']
