import React, { createContext, useContext, useReducer, useEffect } from 'react'
import useCachedApi from '../hooks/useCachedApi'
import { usePersistedPreferences } from '../hooks/usePersistedState'
import tauriApi from '../utils/tauriApi'

/**
 * AppContext - Global state management for the entire application
 * Provides centralized state for system info, user preferences, and status
 */

// Initial state
const initialState = {
  // System information
  systemInfo: null,
  systemInfoLoading: false,
  systemInfoError: null,
  
  // User preferences
  preferences: {
    theme: 'dark', // 'dark', 'light', 'auto'
    sidebarCollapsed: false,
    pollingInterval: 10000, // milliseconds
    notifications: {
      enabled: true,
      sound: true,
      desktop: false
    },
    defaultScanPaths: ['C:\\'],
    autoRefresh: true
  },
  
  // System status
  status: {
    network: 'online',
    ai: 'offline',
    backend: 'offline'
  },
  
  // UI state
  ui: {
    currentView: 'overview',
    commandPaletteOpen: false,
    shortcutsOpen: false,
    toast: null
  }
}

// Action types
const ActionTypes = {
  // System info
  SET_SYSTEM_INFO: 'SET_SYSTEM_INFO',
  SET_SYSTEM_INFO_LOADING: 'SET_SYSTEM_INFO_LOADING',
  SET_SYSTEM_INFO_ERROR: 'SET_SYSTEM_INFO_ERROR',
  
  // Preferences
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  SET_THEME: 'SET_THEME',
  SET_SIDEBAR_COLLAPSED: 'SET_SIDEBAR_COLLAPSED',
  SET_POLLING_INTERVAL: 'SET_POLLING_INTERVAL',
  UPDATE_NOTIFICATION_SETTINGS: 'UPDATE_NOTIFICATION_SETTINGS',
  
  // Status
  UPDATE_STATUS: 'UPDATE_STATUS',
  SET_NETWORK_STATUS: 'SET_NETWORK_STATUS',
  SET_AI_STATUS: 'SET_AI_STATUS',
  SET_BACKEND_STATUS: 'SET_BACKEND_STATUS',
  
  // UI
  SET_CURRENT_VIEW: 'SET_CURRENT_VIEW',
  SET_COMMAND_PALETTE_OPEN: 'SET_COMMAND_PALETTE_OPEN',
  SET_SHORTCUTS_OPEN: 'SET_SHORTCUTS_OPEN',
  SET_TOAST: 'SET_TOAST',
  CLEAR_TOAST: 'CLEAR_TOAST'
}

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    // System info actions
    case ActionTypes.SET_SYSTEM_INFO:
      return {
        ...state,
        systemInfo: action.payload,
        systemInfoLoading: false,
        systemInfoError: null
      }
    
    case ActionTypes.SET_SYSTEM_INFO_LOADING:
      return {
        ...state,
        systemInfoLoading: action.payload
      }
    
    case ActionTypes.SET_SYSTEM_INFO_ERROR:
      return {
        ...state,
        systemInfoError: action.payload,
        systemInfoLoading: false
      }
    
    // Preferences actions
    case ActionTypes.UPDATE_PREFERENCES:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload
        }
      }
    
    case ActionTypes.SET_THEME:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          theme: action.payload
        }
      }
    
    case ActionTypes.SET_SIDEBAR_COLLAPSED:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          sidebarCollapsed: action.payload
        }
      }
    
    case ActionTypes.SET_POLLING_INTERVAL:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          pollingInterval: action.payload
        }
      }
    
    case ActionTypes.UPDATE_NOTIFICATION_SETTINGS:
      return {
        ...state,
        preferences: {
          ...state.preferences,
          notifications: {
            ...state.preferences.notifications,
            ...action.payload
          }
        }
      }
    
    // Status actions
    case ActionTypes.UPDATE_STATUS:
      return {
        ...state,
        status: {
          ...state.status,
          ...action.payload
        }
      }
    
    case ActionTypes.SET_NETWORK_STATUS:
      return {
        ...state,
        status: {
          ...state.status,
          network: action.payload
        }
      }
    
    case ActionTypes.SET_AI_STATUS:
      return {
        ...state,
        status: {
          ...state.status,
          ai: action.payload
        }
      }
    
    case ActionTypes.SET_BACKEND_STATUS:
      return {
        ...state,
        status: {
          ...state.status,
          backend: action.payload
        }
      }
    
    // UI actions
    case ActionTypes.SET_CURRENT_VIEW:
      return {
        ...state,
        ui: {
          ...state.ui,
          currentView: action.payload
        }
      }
    
    case ActionTypes.SET_COMMAND_PALETTE_OPEN:
      return {
        ...state,
        ui: {
          ...state.ui,
          commandPaletteOpen: action.payload
        }
      }
    
    case ActionTypes.SET_SHORTCUTS_OPEN:
      return {
        ...state,
        ui: {
          ...state.ui,
          shortcutsOpen: action.payload
        }
      }
    
    case ActionTypes.SET_TOAST:
      return {
        ...state,
        ui: {
          ...state.ui,
          toast: action.payload
        }
      }
    
    case ActionTypes.CLEAR_TOAST:
      return {
        ...state,
        ui: {
          ...state.ui,
          toast: null
        }
      }
    
    default:
      return state
  }
}

// Create context
const AppContext = createContext()

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  // Use persisted preferences hook
  const { preferences, updatePreferences } = usePersistedPreferences()

  // Sync persisted preferences with state
  useEffect(() => {
    dispatch({
      type: ActionTypes.UPDATE_PREFERENCES,
      payload: preferences
    })
  }, [preferences])

  // System info API call with caching
  const { 
    data: systemInfoData, 
    loading: systemInfoLoading, 
    error: systemInfoError,
    execute: loadSystemInfo 
  } = useCachedApi('http://127.0.0.1:5174/api/system/info', {
    endpoint: 'system-info',
    immediate: true,
    backgroundRefresh: true,
    onCacheHit: (data) => {
      dispatch({ type: ActionTypes.SET_SYSTEM_INFO, payload: data })
    },
    onCacheMiss: (data) => {
      dispatch({ type: ActionTypes.SET_SYSTEM_INFO, payload: data })
    }
  })

  // Update loading state
  useEffect(() => {
    dispatch({ type: ActionTypes.SET_SYSTEM_INFO_LOADING, payload: systemInfoLoading })
  }, [systemInfoLoading])

  // Status checking
  const checkSystemStatus = async () => {
    try {
      // Check network
      const networkStatus = navigator.onLine ? 'online' : 'offline'
      dispatch({ type: ActionTypes.SET_NETWORK_STATUS, payload: networkStatus })
      
      // Check AI status
      try {
        const aiData = await tauriApi.checkAiStatus()
        dispatch({ 
          type: ActionTypes.SET_AI_STATUS, 
          payload: aiData.available ? 'online' : 'offline' 
        })
      } catch (error) {
        dispatch({ type: ActionTypes.SET_AI_STATUS, payload: 'offline' })
      }
      
      // Check backend status (Tauri is always available when running)
      try {
        await tauriApi.getMetrics()
        dispatch({ 
          type: ActionTypes.SET_BACKEND_STATUS, 
          payload: 'online' 
        })
      } catch (error) {
        dispatch({ type: ActionTypes.SET_BACKEND_STATUS, payload: 'offline' })
      }
    } catch (error) {
      console.error('Failed to check system status:', error)
    }
  }

  // Poll system status
  useEffect(() => {
    checkSystemStatus()
    const interval = setInterval(checkSystemStatus, state.preferences.pollingInterval)
    return () => clearInterval(interval)
  }, [state.preferences.pollingInterval])

  // Toast management
  const showToast = (message, type = 'info') => {
    dispatch({
      type: ActionTypes.SET_TOAST,
      payload: { message, type }
    })
    
    // Auto-clear toast after 5 seconds
    setTimeout(() => {
      dispatch({ type: ActionTypes.CLEAR_TOAST })
    }, 5000)
  }

  // Action creators
  const actions = {
    // System info
    loadSystemInfo,
    
    // Preferences
    updatePreferences: (preferences) => {
      updatePreferences(preferences)
      dispatch({ type: ActionTypes.UPDATE_PREFERENCES, payload: preferences })
    },
    
    setTheme: (theme) => 
      dispatch({ type: ActionTypes.SET_THEME, payload: theme }),
    
    setSidebarCollapsed: (collapsed) => 
      dispatch({ type: ActionTypes.SET_SIDEBAR_COLLAPSED, payload: collapsed }),
    
    setPollingInterval: (interval) => 
      dispatch({ type: ActionTypes.SET_POLLING_INTERVAL, payload: interval }),
    
    updateNotificationSettings: (settings) => 
      dispatch({ type: ActionTypes.UPDATE_NOTIFICATION_SETTINGS, payload: settings }),
    
    // Status
    updateStatus: (status) => 
      dispatch({ type: ActionTypes.UPDATE_STATUS, payload: status }),
    
    setNetworkStatus: (status) => 
      dispatch({ type: ActionTypes.SET_NETWORK_STATUS, payload: status }),
    
    setAiStatus: (status) => 
      dispatch({ type: ActionTypes.SET_AI_STATUS, payload: status }),
    
    setBackendStatus: (status) => 
      dispatch({ type: ActionTypes.SET_BACKEND_STATUS, payload: status }),
    
    // UI
    setCurrentView: (view) => 
      dispatch({ type: ActionTypes.SET_CURRENT_VIEW, payload: view }),
    
    setCommandPaletteOpen: (open) => 
      dispatch({ type: ActionTypes.SET_COMMAND_PALETTE_OPEN, payload: open }),
    
    setShortcutsOpen: (open) => 
      dispatch({ type: ActionTypes.SET_SHORTCUTS_OPEN, payload: open }),
    
    showToast,
    clearToast: () => dispatch({ type: ActionTypes.CLEAR_TOAST })
  }

  const value = {
    state,
    actions
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

export default AppContext
