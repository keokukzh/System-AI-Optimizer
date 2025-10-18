import { useState, useEffect, useCallback } from 'react'
import storage, { storageHelpers, crossTabSync } from '../utils/storage'

/**
 * usePersistedState - Like useState but persists to localStorage
 * Auto-syncs across tabs and provides type-safe operations
 */
const usePersistedState = (key, defaultValue, options = {}) => {
  const {
    encrypt = false,
    ttl = null,
    syncAcrossTabs = true,
    validate = null
  } = options

  // Get initial value from storage
  const getInitialValue = useCallback(() => {
    try {
      const stored = storage.get(key, defaultValue)
      
      // Validate if validator provided
      if (validate && typeof validate === 'function') {
        return validate(stored) ? stored : defaultValue
      }
      
      return stored
    } catch (error) {
      console.error(`Failed to load persisted state for ${key}:`, error)
      return defaultValue
    }
  }, [key, defaultValue, validate])

  const [state, setState] = useState(getInitialValue)

  // Save to storage when state changes
  useEffect(() => {
    try {
      storage.set(key, state, { encrypt, ttl })
    } catch (error) {
      console.error(`Failed to persist state for ${key}:`, error)
    }
  }, [key, state, encrypt, ttl])

  // Cross-tab synchronization
  useEffect(() => {
    if (!syncAcrossTabs) return

    const unsubscribe = crossTabSync.subscribe(key, (newValue, oldValue) => {
      if (newValue !== null && newValue !== state) {
        setState(newValue)
      }
    })

    return unsubscribe
  }, [key, state, syncAcrossTabs])

  // Enhanced setter with validation
  const setPersistedState = useCallback((newValue) => {
    try {
      // Handle function updates
      const value = typeof newValue === 'function' ? newValue(state) : newValue
      
      // Validate if validator provided
      if (validate && typeof validate === 'function') {
        if (!validate(value)) {
          console.warn(`Validation failed for ${key}:`, value)
          return
        }
      }
      
      setState(value)
    } catch (error) {
      console.error(`Failed to update persisted state for ${key}:`, error)
    }
  }, [key, state, validate])

  // Reset to default value
  const reset = useCallback(() => {
    setState(defaultValue)
  }, [defaultValue])

  // Clear from storage
  const clear = useCallback(() => {
    storage.remove(key)
    setState(defaultValue)
  }, [key, defaultValue])

  return [state, setPersistedState, { reset, clear }]
}

/**
 * usePersistedPreferences - Hook for user preferences with validation
 */
export const usePersistedPreferences = () => {
  const preferencesValidator = (prefs) => {
    return (
      prefs &&
      typeof prefs === 'object' &&
      typeof prefs.theme === 'string' &&
      ['dark', 'light', 'auto'].includes(prefs.theme) &&
      typeof prefs.sidebarCollapsed === 'boolean' &&
      typeof prefs.pollingInterval === 'number' &&
      prefs.pollingInterval > 0 &&
      typeof prefs.notifications === 'object' &&
      typeof prefs.autoRefresh === 'boolean'
    )
  }

  const [preferences, setPreferences, { reset: resetPreferences }] = usePersistedState(
    'preferences',
    {
      theme: 'dark',
      sidebarCollapsed: false,
      pollingInterval: 10000,
      notifications: {
        enabled: true,
        sound: true,
        desktop: false
      },
      defaultScanPaths: ['C:\\'],
      autoRefresh: true
    },
    {
      validate: preferencesValidator,
      syncAcrossTabs: true
    }
  )

  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => ({ ...prev, ...updates }))
  }, [setPreferences])

  return {
    preferences,
    setPreferences,
    updatePreferences,
    resetPreferences
  }
}

/**
 * usePersistedNotifications - Hook for notifications with TTL
 */
export const usePersistedNotifications = () => {
  const notificationsValidator = (notifications) => {
    return Array.isArray(notifications) && notifications.every(n => 
      n && 
      typeof n.id === 'string' && 
      typeof n.timestamp === 'number' &&
      typeof n.type === 'string' &&
      typeof n.title === 'string' &&
      typeof n.message === 'string'
    )
  }

  const [notifications, setNotifications, { reset: resetNotifications }] = usePersistedState(
    'notifications',
    [],
    {
      validate: notificationsValidator,
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      syncAcrossTabs: true
    }
  )

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false,
      type: 'info',
      title: '',
      message: '',
      actions: [],
      persistent: false,
      ...notification
    }

    setNotifications(prev => [newNotification, ...prev])
    return newNotification.id
  }, [setNotifications])

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [setNotifications])

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [setNotifications])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [setNotifications])

  return {
    notifications,
    setNotifications,
    addNotification,
    dismissNotification,
    markAsRead,
    clearAll,
    resetNotifications
  }
}

/**
 * usePersistedScanHistory - Hook for scan history with size limit
 */
export const usePersistedScanHistory = () => {
  const scanHistoryValidator = (history) => {
    return Array.isArray(history) && history.every(scan => 
      scan && 
      typeof scan.id === 'string' && 
      typeof scan.timestamp === 'number' &&
      typeof scan.path === 'string'
    )
  }

  const [scanHistory, setScanHistory, { reset: resetScanHistory }] = usePersistedState(
    'scan-history',
    [],
    {
      validate: scanHistoryValidator,
      ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
      syncAcrossTabs: true
    }
  )

  const addScan = useCallback((scan) => {
    const newScan = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...scan
    }

    setScanHistory(prev => {
      const updated = [newScan, ...prev]
      // Keep only last 50 scans
      return updated.slice(0, 50)
    })
    
    return newScan.id
  }, [setScanHistory])

  const removeScan = useCallback((id) => {
    setScanHistory(prev => prev.filter(scan => scan.id !== id))
  }, [setScanHistory])

  return {
    scanHistory,
    setScanHistory,
    addScan,
    removeScan,
    resetScanHistory
  }
}

/**
 * usePersistedActionHistory - Hook for action history with size limit
 */
export const usePersistedActionHistory = () => {
  const actionHistoryValidator = (history) => {
    return Array.isArray(history) && history.every(action => 
      action && 
      typeof action.id === 'string' && 
      typeof action.timestamp === 'number' &&
      typeof action.type === 'string'
    )
  }

  const [actionHistory, setActionHistory, { reset: resetActionHistory }] = usePersistedState(
    'action-history',
    [],
    {
      validate: actionHistoryValidator,
      ttl: 90 * 24 * 60 * 60 * 1000, // 90 days
      syncAcrossTabs: true
    }
  )

  const addAction = useCallback((action) => {
    const newAction = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'completed',
      ...action
    }

    setActionHistory(prev => {
      const updated = [newAction, ...prev]
      // Keep only last 100 actions
      return updated.slice(0, 100)
    })
    
    return newAction.id
  }, [setActionHistory])

  const updateAction = useCallback((id, updates) => {
    setActionHistory(prev => 
      prev.map(action => 
        action.id === id ? { ...action, ...updates } : action
      )
    )
  }, [setActionHistory])

  const removeAction = useCallback((id) => {
    setActionHistory(prev => prev.filter(action => action.id !== id))
  }, [setActionHistory])

  return {
    actionHistory,
    setActionHistory,
    addAction,
    updateAction,
    removeAction,
    resetActionHistory
  }
}

/**
 * usePersistedSensitive - Hook for sensitive data with encryption
 */
export const usePersistedSensitive = (key, defaultValue) => {
  const [data, setData, { reset, clear }] = usePersistedState(
    key,
    defaultValue,
    {
      encrypt: true,
      syncAcrossTabs: false // Don't sync sensitive data
    }
  )

  return [data, setData, { reset, clear }]
}

export default usePersistedState
