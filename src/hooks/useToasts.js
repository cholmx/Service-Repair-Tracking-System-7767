import { useCallback, useRef, useState } from 'react'

// Toast messages with an optional undo action.
export const useToasts = () => {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'success', undoAction = null) => {
    nextId.current += 1
    setToasts((prev) => [...prev, { id: nextId.current, message, type, undoAction }])
  }, [])

  const undo = useCallback(
    async (toast) => {
      if (!toast.undoAction) return
      try {
        await toast.undoAction()
        removeToast(toast.id)
        addToast('Action undone successfully', 'success')
      } catch {
        addToast('Failed to undo action', 'error')
      }
    },
    [addToast, removeToast]
  )

  return { toasts, addToast, removeToast, undo }
}
