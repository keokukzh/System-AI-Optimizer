import { useState, useCallback } from 'react'

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random()
    const { type = 'info', duration = 5000, action } = options

    const newToast = {
      id,
      message,
      type,
      action,
      duration
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((message, action) => {
    return toast(message, { type: 'success', action })
  }, [toast])

  const error = useCallback((message, action) => {
    return toast(message, { type: 'error', action })
  }, [toast])

  const info = useCallback((message, action) => {
    return toast(message, { type: 'info', action })
  }, [toast])

  const undo = useCallback((message, onUndo, duration = 10000) => {
    return toast(message, {
      type: 'success',
      duration,
      action: {
        label: 'Undo',
        onClick: onUndo
      }
    })
  }, [toast])

  return {
    toasts,
    toast,
    success,
    error,
    info,
    undo,
    removeToast
  }
}
