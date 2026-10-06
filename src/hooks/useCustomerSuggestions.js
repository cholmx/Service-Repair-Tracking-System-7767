import { useEffect, useState } from 'react'
import { searchCustomers } from '../services/customerService'

const DEBOUNCE_MS = 250

// Suggestions for the text being typed. Empty when the text is too short, and quietly empty if the
// lookup fails (the form still works without it).
export const useCustomerSuggestions = (term, { minChars = 2, enabled = true } = {}) => {
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    const text = term.trim()
    if (!enabled || text.length < minChars) {
      setSuggestions([])
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const found = await searchCustomers(text)
        if (!cancelled) setSuggestions(found)
      } catch {
        if (!cancelled) setSuggestions([])
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term, minChars, enabled])

  return suggestions
}
