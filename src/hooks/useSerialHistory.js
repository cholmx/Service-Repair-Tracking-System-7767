import { useEffect, useState } from 'react'
import { fetchSerialHistory } from '../services/serialService'
import { MIN_SERIAL_CHARS, normalizeSerial } from '../utils/serial'

// The other SCBA orders with the same serial number. Does nothing unless `enabled` (the order is
// an SCBA) and the serial is long enough to be meaningful. A failed lookup returns no orders and
// sets `failed`, so a hiccup never blocks the screen it appears on.
export const useSerialHistory = (serial, { excludeId = null, enabled = true, debounceMs = 300 } = {}) => {
  const key = normalizeSerial(serial)
  const active = enabled && key !== null && key.length >= MIN_SERIAL_CHARS
  const [state, setState] = useState({ key: null, orders: [], failed: false })

  useEffect(() => {
    if (!active) return undefined

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const orders = await fetchSerialHistory(key)
        if (!cancelled) setState({ key, orders: orders.filter((order) => order.id !== excludeId), failed: false })
      } catch {
        if (!cancelled) setState({ key, orders: [], failed: true })
      }
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active, key, excludeId, debounceMs])

  // Until the lookup for the current serial returns, there is nothing to show.
  const ready = active && state.key === key
  return { orders: ready ? state.orders : [], loading: active && !ready, failed: ready && state.failed }
}
