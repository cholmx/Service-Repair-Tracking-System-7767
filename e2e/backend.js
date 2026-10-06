import { calculateTotals } from '../src/utils/pricing.js'

export const CORRECT_PINS = ['1111', '2222']

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*'
}

export const makeOrder = (overrides = {}) => ({
  id: '607',
  customer_name: 'Pat Smith',
  customer_phone: '555-0100',
  customer_email: null,
  company: 'Acme',
  item_type: 'Widget',
  serial_number: null,
  quantity: 1,
  description: 'Broken hose',
  urgency: 'normal',
  expected_completion: null,
  status: 'received',
  parts: [],
  labor: [],
  parts_total: 0,
  labor_total: 0,
  tax_rate: 0,
  tax: 0,
  subtotal: 0,
  total: 0,
  archived_at: null,
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
  status_history: [
    { id: crypto.randomUUID(), service_order_id: overrides.id || '607', status: overrides.status || 'received', notes: 'Logged', created_at: '2026-10-01T10:00:00Z' }
  ],
  ...overrides
})

export const defaultOrders = () => [
  makeOrder({ id: '607', status: 'needs-quote' }),
  makeOrder({ id: '700', status: 'ready', customer_name: 'Lee Roy', company: 'Roy Fire Co', customer_phone: '555-0101', customer_email: 'lee@example.com', item_type: 'SCBA' }),
  makeOrder({ id: '705', status: 'in-progress', customer_name: 'Sam Jones', company: null, customer_phone: '555-0102', item_type: 'Regulator' })
]

export const defaultArchived = () => [
  makeOrder({ id: '300', status: 'archived', archived_at: '2026-09-01T10:00:00Z', customer_name: 'Old Customer', company: null })
]

const DAY = 24 * 60 * 60 * 1000

export const makeBackup = (source, daysAgo, orders) => {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    recordCount: orders.length,
    includesArchived: true,
    data: orders.map(({ status_history, ...order }) => ({ ...order, statusHistory: status_history }))
  }
  return {
    id: crypto.randomUUID(),
    created_at: new Date(Date.now() - daysAgo * DAY).toISOString(),
    source,
    order_count: orders.length,
    history_count: orders.reduce((sum, o) => sum + o.status_history.length, 0),
    size_bytes: JSON.stringify(data).length,
    data
  }
}

const recompute = (order) => {
  const totals = calculateTotals({ parts: order.parts, labor: order.labor, taxRate: order.tax_rate })
  Object.assign(order, {
    parts_total: totals.partsTotal,
    labor_total: totals.laborTotal,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total
  })
}

// A stand-in for Supabase: the PIN function, the REST tables, the order functions and the
// realtime socket. `state` holds the data and a log of requests so tests can assert on both.
export const installBackend = async (page, { orders, archived, backups, backupsMissing = false } = {}) => {
  const state = {
    orders: orders ?? defaultOrders(),
    archived: archived ?? defaultArchived(),
    // By default there is one weekly backup from two days ago that also holds an order (650)
    // that has since been deleted, so restoring it has something to bring back.
    backups: backups ?? [
      makeBackup('scheduled', 2, [...defaultOrders(), makeOrder({ id: '650', customer_name: 'Deleted Later' })])
    ],
    requests: [],
    failWrites: false,
    failReads: false,
    sockets: [],
    pushChange(table = 'service_orders') {
      for (const { ws, bindings } of this.sockets) {
        const ids = bindings.filter((b) => b.table === table).map((b) => b.id)
        ws.send(
          JSON.stringify({
            topic: 'realtime:service-orders-live',
            event: 'postgres_changes',
            payload: {
              ids,
              data: { schema: 'public', table, commit_timestamp: new Date().toISOString(), type: 'UPDATE', record: {}, old_record: {}, columns: [], errors: null }
            },
            ref: null
          })
        )
      }
    },
    count(pattern) {
      return this.requests.filter((r) => pattern.test(r)).length
    },
    find(id) {
      return this.orders.find((o) => o.id === id) || this.archived.find((o) => o.id === id)
    }
  }

  await page.route('**/functions/v1/verify-pin', (route) => {
    const { pin } = JSON.parse(route.request().postData() || '{}')
    state.requests.push('verify-pin')
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: cors,
      body: JSON.stringify({ valid: CORRECT_PINS.includes(pin) })
    })
  })

  await page.route('**/rest/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const respond = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(body) })

    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors })

    const path = url.pathname.replace('/rest/v1/', '')
    const search = decodeURIComponent(url.search)
    const body = request.postData() ? JSON.parse(request.postData()) : {}
    state.requests.push(`${request.method()} ${path}${search.includes('archived_at=not.is.null') ? ' archived' : ''}`)

    const isWrite = request.method() !== 'GET'
    if (isWrite && state.failWrites) return respond({ message: 'The server is having a bad day' }, 500)
    if (!isWrite && state.failReads) return respond({ message: 'The server is having a bad day' }, 500)

    if (path === 'service_orders' && request.method() === 'GET') {
      if (search.includes('archived_at=not.is.null')) return respond(state.archived)
      if (search.includes('archived_at=is.null')) return respond(state.orders)
      if (search.includes('select=id')) {
        const wanted = (search.match(/id=in\.\((.*?)\)/)?.[1] || '').split(',').map((id) => id.replace(/"/g, ''))
        return respond([...state.orders, ...state.archived].filter((o) => wanted.includes(o.id)).map((o) => ({ id: o.id })))
      }
      if (search.includes('customer_name.ilike')) {
        const needle = (search.match(/ilike\.%(.*?)%/)?.[1] || '').toLowerCase()
        const hits = [...state.orders, ...state.archived].filter((o) =>
          [o.customer_name, o.company, o.customer_phone].some((v) => v && v.toLowerCase().includes(needle))
        )
        return respond(hits)
      }
      return respond([])
    }

    if (path === 'service_order_backups' && request.method() === 'GET') {
      if (backupsMissing) {
        return respond({ code: 'PGRST205', message: "Could not find the table 'public.service_order_backups' in the schema cache" }, 404)
      }
      if (search.includes('select=data')) {
        const id = search.match(/id=eq\.([\w-]+)/)?.[1]
        return respond(state.backups.filter((b) => b.id === id).map((b) => ({ data: b.data })))
      }
      return respond(
        [...state.backups]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .map(({ data, ...summary }) => summary)
      )
    }

    if (path === 'rpc/create_backup') {
      const backup = makeBackup('manual', 0, [...state.orders, ...state.archived])
      state.backups.unshift(backup)
      return respond({ id: backup.id, created_at: backup.created_at, order_count: backup.order_count })
    }

    if (path === 'service_orders' && request.method() === 'DELETE') {
      const id = search.match(/id=eq\.(\w+)/)?.[1]
      state.archived = state.archived.filter((o) => o.id !== id)
      return respond([])
    }

    if (path === 'rpc/create_service_orders') {
      const created = body.p_order.items.map((item) => {
        let id
        do id = String(101 + Math.floor(Math.random() * 899))
        while (state.find(id))
        const status = item.needs_quote ? 'needs-quote' : 'received'
        const order = makeOrder({
          id,
          customer_name: body.p_order.customer_name,
          customer_phone: body.p_order.customer_phone,
          customer_email: body.p_order.customer_email,
          company: body.p_order.company,
          item_type: item.item_type,
          quantity: item.quantity,
          description: item.description,
          status
        })
        state.orders.unshift(order)
        return order
      })
      return respond(created)
    }

    if (path === 'rpc/update_service_order') {
      const order = state.find(body.p_id)
      if (!order) return respond({ message: `Service order ${body.p_id} not found` }, 400)
      const updates = body.p_updates
      Object.assign(order, updates)
      if (updates.status === 'archived' && !('archived_at' in updates)) order.archived_at = new Date().toISOString()
      recompute(order)
      if ('status' in updates) {
        order.status_history.push({ id: crypto.randomUUID(), service_order_id: order.id, status: updates.status, notes: body.p_notes || '', created_at: new Date().toISOString() })
      }
      state.orders = state.orders.filter((o) => o !== order)
      state.archived = state.archived.filter((o) => o !== order)
      ;(order.archived_at ? state.archived : state.orders).push(order)
      return respond(order)
    }

    if (path === 'rpc/import_service_orders') {
      let created = 0
      let updated = 0
      for (const row of body.p_orders) {
        const existing = state.find(row.id)
        const next = makeOrder({ ...row, status_history: (row.history || []).map((h) => ({ ...h, service_order_id: row.id })) })
        recompute(next)
        if (existing) {
          Object.assign(existing, next)
          updated += 1
        } else {
          ;(next.archived_at ? state.archived : state.orders).push(next)
          created += 1
        }
      }
      return respond({ created, updated, history_added: 0 })
    }

    return respond([])
  })

  // A minimal Phoenix channel server so the app believes live updates are connected.
  await page.routeWebSocket(/realtime\/v1\/websocket/, (ws) => {
    const socket = { ws, bindings: [] }
    state.sockets.push(socket)
    ws.onMessage((raw) => {
      const message = JSON.parse(String(raw))
      if (message.event === 'heartbeat') {
        ws.send(JSON.stringify({ topic: 'phoenix', event: 'phx_reply', payload: { status: 'ok', response: {} }, ref: message.ref }))
      } else if (message.event === 'phx_join') {
        const wanted = message.payload?.config?.postgres_changes || []
        socket.bindings = wanted.map((binding, index) => ({ ...binding, id: index + 1 }))
        ws.send(
          JSON.stringify({
            topic: message.topic,
            event: 'phx_reply',
            payload: { status: 'ok', response: { postgres_changes: socket.bindings } },
            ref: message.ref
          })
        )
      }
    })
  })

  return state
}

export const login = async (page, pin = '1111') => {
  await page.goto('/')
  await page.getByPlaceholder('Enter PIN').fill(pin)
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: 'Service Dashboard' }).waitFor()
}
