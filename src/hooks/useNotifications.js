import { useState, useEffect, useCallback } from 'react'
import { usePersistedNotifications } from './usePersistedState'

/**
 * useNotifications - Hook for managing notification state and persistence
 * Provides add, dismiss, clear functionality with localStorage persistence
 */
const useNotifications = (initialNotifications = []) => {
  const [isMuted, setIsMuted] = useState(false)
  
  // Use persisted notifications hook
  const {
    notifications,
    addNotification,
    dismissNotification,
    markAsRead,
    clearAll
  } = usePersistedNotifications()

  // Load mute state from localStorage on mount
  useEffect(() => {
    const savedMuteState = localStorage.getItem('optiai-notifications-muted')
    if (savedMuteState) {
      setIsMuted(JSON.parse(savedMuteState))
    }
  }, [])

  // Save mute state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('optiai-notifications-muted', JSON.stringify(isMuted))
  }, [isMuted])

  // Enhanced add notification with auto-dismiss
  const addNotificationWithAutoDismiss = useCallback((notification) => {
    const id = addNotification(notification)

    // Auto-dismiss after 5 seconds unless persistent
    if (!notification.persistent && !isMuted) {
      setTimeout(() => {
        dismissNotification(id)
      }, 5000)
    }

    return id
  }, [addNotification, dismissNotification, isMuted])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markAsRead(notification.id)
      }
    })
  }, [notifications, markAsRead])

  // Clear read notifications
  const clearRead = useCallback(() => {
    notifications.forEach(notification => {
      if (notification.read) {
        dismissNotification(notification.id)
      }
    })
  }, [notifications, dismissNotification])

  // Clear old notifications (older than specified time)
  const clearOld = useCallback((maxAge = 24 * 60 * 60 * 1000) => { // Default 24 hours
    const cutoff = Date.now() - maxAge
    notifications.forEach(notification => {
      if (notification.timestamp < cutoff) {
        dismissNotification(notification.id)
      }
    })
  }, [notifications, dismissNotification])

  // Handle notification action
  const handleAction = useCallback((notificationId, actionId) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (notification && notification.actions) {
      const action = notification.actions.find(a => a.id === actionId)
      if (action && action.handler) {
        action.handler(notification)
      }
    }
  }, [notifications])

  // Convenience methods for different notification types
  const showSuccess = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }, [addNotification])

  const showError = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'error',
      title,
      message,
      persistent: true, // Errors should be persistent by default
      ...options
    })
  }, [addNotification])

  const showWarning = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options
    })
  }, [addNotification])

  const showInfo = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }, [addNotification])

  // System notification helpers
  const showScanComplete = useCallback((scanId, filesFound, spaceSaved) => {
    return addNotification({
      type: 'success',
      title: 'Scan Complete',
      message: `Found ${filesFound} files, saved ${spaceSaved} space`,
      actions: [
        {
          id: 'view-results',
          label: 'View Results',
          handler: () => {
            // Navigate to scan results
          }
        }
      ]
    })
  }, [addNotification])

  const showActionExecuted = useCallback((actionType, count, spaceFreed) => {
    return addNotification({
      type: 'success',
      title: 'Action Executed',
      message: `${actionType} completed on ${count} items, freed ${spaceFreed}`,
      actions: [
        {
          id: 'undo',
          label: 'Undo',
          handler: () => {
            // Undo action
          }
        }
      ]
    })
  }, [addNotification])

  const showSystemWarning = useCallback((warningType, details) => {
    const warningMessages = {
      'high-cpu': {
        title: 'High CPU Usage',
        message: `CPU usage is at ${details.percent}%`
      },
      'low-disk': {
        title: 'Low Disk Space',
        message: `Only ${details.free} free space remaining`
      },
      'memory-warning': {
        title: 'High Memory Usage',
        message: `Memory usage is at ${details.percent}%`
      }
    }

    const warning = warningMessages[warningType] || {
      title: 'System Warning',
      message: details.message || 'A system warning has occurred'
    }

    return addNotification({
      type: 'warning',
      title: warning.title,
      message: warning.message,
      persistent: true,
      actions: [
        {
          id: 'view-details',
          label: 'View Details',
          handler: () => {
            // Show system details
          }
        }
      ]
    })
  }, [addNotification])

  // Get notification statistics
  const getStats = useCallback(() => {
    const total = notifications.length
    const unread = notifications.filter(n => !n.read).length
    const byType = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1
      return acc
    }, {})

    return {
      total,
      unread,
      read: total - unread,
      byType
    }
  }, [notifications])

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  return {
    // State
    notifications,
    isMuted,
    
    // Actions (using persisted functions)
    addNotification: addNotificationWithAutoDismiss,
    dismissNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearRead,
    clearOld,
    handleAction,
    toggleMute,
    
    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // System notifications
    showScanComplete,
    showActionExecuted,
    showSystemWarning,
    
    // Utilities
    getStats
  }
}

export default useNotifications
