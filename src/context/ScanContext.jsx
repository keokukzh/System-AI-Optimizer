import React, { createContext, useContext, useReducer, useEffect } from 'react'
import useApiCall from '../hooks/useApiCall'

/**
 * ScanContext - Scan-specific state management
 * Handles scan data, history, selected files, and filter preferences
 */

// Initial state
const initialState = {
  // Active scan
  activeScan: null,
  scanHistory: [],
  
  // Scan results
  scanResults: null,
  scanResultsLoading: false,
  scanResultsError: null,
  
  // File selection
  selectedFiles: new Set(),
  selectedFileCount: 0,
  totalFileSize: 0,
  
  // Filters and sorting
  filters: {
    fileSize: { min: 0, max: null },
    dateRange: { start: null, end: null },
    fileTypes: [],
    riskLevel: 'all', // 'all', 'low', 'medium', 'high'
    status: 'all' // 'all', 'selected', 'unselected'
  },
  
  // Sort preferences
  sortBy: 'size', // 'size', 'name', 'date', 'type'
  sortOrder: 'desc', // 'asc', 'desc'
  
  // Filter presets
  filterPresets: [
    {
      id: 'large-files',
      name: 'Large Files (>100MB)',
      filters: { fileSize: { min: 104857600, max: null } }
    },
    {
      id: 'old-files',
      name: 'Old Files (>1 year)',
      filters: { 
        dateRange: { 
          start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), 
          end: null 
        } 
      }
    },
    {
      id: 'temp-files',
      name: 'Temporary Files',
      filters: { 
        fileTypes: ['.tmp', '.temp', '.log', '.cache'] 
      }
    }
  ],
  
  // UI state
  ui: {
    showFilters: false,
    showPreview: false,
    previewFile: null
  }
}

// Action types
const ActionTypes = {
  // Scan management
  SET_ACTIVE_SCAN: 'SET_ACTIVE_SCAN',
  CLEAR_ACTIVE_SCAN: 'CLEAR_ACTIVE_SCAN',
  ADD_SCAN_TO_HISTORY: 'ADD_SCAN_TO_HISTORY',
  CLEAR_SCAN_HISTORY: 'CLEAR_SCAN_HISTORY',
  
  // Scan results
  SET_SCAN_RESULTS: 'SET_SCAN_RESULTS',
  SET_SCAN_RESULTS_LOADING: 'SET_SCAN_RESULTS_LOADING',
  SET_SCAN_RESULTS_ERROR: 'SET_SCAN_RESULTS_ERROR',
  
  // File selection
  SELECT_FILE: 'SELECT_FILE',
  DESELECT_FILE: 'DESELECT_FILE',
  SELECT_ALL_FILES: 'SELECT_ALL_FILES',
  DESELECT_ALL_FILES: 'DESELECT_ALL_FILES',
  TOGGLE_FILE_SELECTION: 'TOGGLE_FILE_SELECTION',
  UPDATE_SELECTION_STATS: 'UPDATE_SELECTION_STATS',
  
  // Filters
  UPDATE_FILTERS: 'UPDATE_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
  APPLY_FILTER_PRESET: 'APPLY_FILTER_PRESET',
  SAVE_FILTER_PRESET: 'SAVE_FILTER_PRESET',
  DELETE_FILTER_PRESET: 'DELETE_FILTER_PRESET',
  
  // Sorting
  SET_SORT_BY: 'SET_SORT_BY',
  SET_SORT_ORDER: 'SET_SORT_ORDER',
  
  // UI
  SET_SHOW_FILTERS: 'SET_SHOW_FILTERS',
  SET_SHOW_PREVIEW: 'SET_SHOW_PREVIEW',
  SET_PREVIEW_FILE: 'SET_PREVIEW_FILE'
}

// Reducer
const scanReducer = (state, action) => {
  switch (action.type) {
    // Scan management
    case ActionTypes.SET_ACTIVE_SCAN:
      return {
        ...state,
        activeScan: action.payload
      }
    
    case ActionTypes.CLEAR_ACTIVE_SCAN:
      return {
        ...state,
        activeScan: null
      }
    
    case ActionTypes.ADD_SCAN_TO_HISTORY:
      return {
        ...state,
        scanHistory: [action.payload, ...state.scanHistory].slice(0, 50) // Keep last 50 scans
      }
    
    case ActionTypes.CLEAR_SCAN_HISTORY:
      return {
        ...state,
        scanHistory: []
      }
    
    // Scan results
    case ActionTypes.SET_SCAN_RESULTS:
      return {
        ...state,
        scanResults: action.payload,
        scanResultsLoading: false,
        scanResultsError: null
      }
    
    case ActionTypes.SET_SCAN_RESULTS_LOADING:
      return {
        ...state,
        scanResultsLoading: action.payload
      }
    
    case ActionTypes.SET_SCAN_RESULTS_ERROR:
      return {
        ...state,
        scanResultsError: action.payload,
        scanResultsLoading: false
      }
    
    // File selection
    case ActionTypes.SELECT_FILE:
      const newSelectedFiles = new Set(state.selectedFiles)
      newSelectedFiles.add(action.payload)
      return {
        ...state,
        selectedFiles: newSelectedFiles,
        selectedFileCount: newSelectedFiles.size
      }
    
    case ActionTypes.DESELECT_FILE:
      const deselectedFiles = new Set(state.selectedFiles)
      deselectedFiles.delete(action.payload)
      return {
        ...state,
        selectedFiles: deselectedFiles,
        selectedFileCount: deselectedFiles.size
      }
    
    case ActionTypes.SELECT_ALL_FILES:
      const allFiles = new Set(state.scanResults?.items?.map(item => item.path) || [])
      return {
        ...state,
        selectedFiles: allFiles,
        selectedFileCount: allFiles.size
      }
    
    case ActionTypes.DESELECT_ALL_FILES:
      return {
        ...state,
        selectedFiles: new Set(),
        selectedFileCount: 0,
        totalFileSize: 0
      }
    
    case ActionTypes.TOGGLE_FILE_SELECTION:
      const toggledFiles = new Set(state.selectedFiles)
      if (toggledFiles.has(action.payload)) {
        toggledFiles.delete(action.payload)
      } else {
        toggledFiles.add(action.payload)
      }
      return {
        ...state,
        selectedFiles: toggledFiles,
        selectedFileCount: toggledFiles.size
      }
    
    case ActionTypes.UPDATE_SELECTION_STATS:
      return {
        ...state,
        totalFileSize: action.payload
      }
    
    // Filters
    case ActionTypes.UPDATE_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      }
    
    case ActionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters
      }
    
    case ActionTypes.APPLY_FILTER_PRESET:
      const preset = state.filterPresets.find(p => p.id === action.payload)
      if (preset) {
        return {
          ...state,
          filters: {
            ...state.filters,
            ...preset.filters
          }
        }
      }
      return state
    
    case ActionTypes.SAVE_FILTER_PRESET:
      const newPreset = {
        id: `preset-${Date.now()}`,
        name: action.payload.name,
        filters: action.payload.filters
      }
      return {
        ...state,
        filterPresets: [...state.filterPresets, newPreset]
      }
    
    case ActionTypes.DELETE_FILTER_PRESET:
      return {
        ...state,
        filterPresets: state.filterPresets.filter(p => p.id !== action.payload)
      }
    
    // Sorting
    case ActionTypes.SET_SORT_BY:
      return {
        ...state,
        sortBy: action.payload
      }
    
    case ActionTypes.SET_SORT_ORDER:
      return {
        ...state,
        sortOrder: action.payload
      }
    
    // UI
    case ActionTypes.SET_SHOW_FILTERS:
      return {
        ...state,
        ui: {
          ...state.ui,
          showFilters: action.payload
        }
      }
    
    case ActionTypes.SET_SHOW_PREVIEW:
      return {
        ...state,
        ui: {
          ...state.ui,
          showPreview: action.payload
        }
      }
    
    case ActionTypes.SET_PREVIEW_FILE:
      return {
        ...state,
        ui: {
          ...state.ui,
          previewFile: action.payload
        }
      }
    
    default:
      return state
  }
}

// Create context
const ScanContext = createContext()

// Provider component
export const ScanProvider = ({ children }) => {
  const [state, dispatch] = useReducer(scanReducer, initialState)

  // Load scan history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('optiai-scan-history')
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory)
        parsed.forEach(scan => {
          dispatch({ type: ActionTypes.ADD_SCAN_TO_HISTORY, payload: scan })
        })
      } catch (error) {
        console.error('Failed to load scan history from localStorage:', error)
      }
    }
  }, [])

  // Save scan history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('optiai-scan-history', JSON.stringify(state.scanHistory))
  }, [state.scanHistory])

  // Save filter presets to localStorage
  useEffect(() => {
    localStorage.setItem('optiai-filter-presets', JSON.stringify(state.filterPresets))
  }, [state.filterPresets])

  // Load filter presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('optiai-filter-presets')
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets)
        parsed.forEach(preset => {
          dispatch({ type: ActionTypes.SAVE_FILTER_PRESET, payload: preset })
        })
      } catch (error) {
        console.error('Failed to load filter presets from localStorage:', error)
      }
    }
  }, [])

  // Calculate total file size of selected files
  useEffect(() => {
    if (state.scanResults && state.selectedFiles.size > 0) {
      const totalSize = Array.from(state.selectedFiles).reduce((total, filePath) => {
        const file = state.scanResults.items.find(item => item.path === filePath)
        return total + (file?.size || 0)
      }, 0)
      dispatch({ type: ActionTypes.UPDATE_SELECTION_STATS, payload: totalSize })
    } else {
      dispatch({ type: ActionTypes.UPDATE_SELECTION_STATS, payload: 0 })
    }
  }, [state.selectedFiles, state.scanResults])

  // Action creators
  const actions = {
    // Scan management
    setActiveScan: (scan) => 
      dispatch({ type: ActionTypes.SET_ACTIVE_SCAN, payload: scan }),
    
    clearActiveScan: () => 
      dispatch({ type: ActionTypes.CLEAR_ACTIVE_SCAN }),
    
    addScanToHistory: (scan) => 
      dispatch({ type: ActionTypes.ADD_SCAN_TO_HISTORY, payload: scan }),
    
    clearScanHistory: () => 
      dispatch({ type: ActionTypes.CLEAR_SCAN_HISTORY }),
    
    // Scan results
    setScanResults: (results) => 
      dispatch({ type: ActionTypes.SET_SCAN_RESULTS, payload: results }),
    
    setScanResultsLoading: (loading) => 
      dispatch({ type: ActionTypes.SET_SCAN_RESULTS_LOADING, payload: loading }),
    
    setScanResultsError: (error) => 
      dispatch({ type: ActionTypes.SET_SCAN_RESULTS_ERROR, payload: error }),
    
    // File selection
    selectFile: (filePath) => 
      dispatch({ type: ActionTypes.SELECT_FILE, payload: filePath }),
    
    deselectFile: (filePath) => 
      dispatch({ type: ActionTypes.DESELECT_FILE, payload: filePath }),
    
    selectAllFiles: () => 
      dispatch({ type: ActionTypes.SELECT_ALL_FILES }),
    
    deselectAllFiles: () => 
      dispatch({ type: ActionTypes.DESELECT_ALL_FILES }),
    
    toggleFileSelection: (filePath) => 
      dispatch({ type: ActionTypes.TOGGLE_FILE_SELECTION, payload: filePath }),
    
    // Filters
    updateFilters: (filters) => 
      dispatch({ type: ActionTypes.UPDATE_FILTERS, payload: filters }),
    
    resetFilters: () => 
      dispatch({ type: ActionTypes.RESET_FILTERS }),
    
    applyFilterPreset: (presetId) => 
      dispatch({ type: ActionTypes.APPLY_FILTER_PRESET, payload: presetId }),
    
    saveFilterPreset: (name, filters) => 
      dispatch({ type: ActionTypes.SAVE_FILTER_PRESET, payload: { name, filters } }),
    
    deleteFilterPreset: (presetId) => 
      dispatch({ type: ActionTypes.DELETE_FILTER_PRESET, payload: presetId }),
    
    // Sorting
    setSortBy: (sortBy) => 
      dispatch({ type: ActionTypes.SET_SORT_BY, payload: sortBy }),
    
    setSortOrder: (sortOrder) => 
      dispatch({ type: ActionTypes.SET_SORT_ORDER, payload: sortOrder }),
    
    // UI
    setShowFilters: (show) => 
      dispatch({ type: ActionTypes.SET_SHOW_FILTERS, payload: show }),
    
    setShowPreview: (show) => 
      dispatch({ type: ActionTypes.SET_SHOW_PREVIEW, payload: show }),
    
    setPreviewFile: (file) => 
      dispatch({ type: ActionTypes.SET_PREVIEW_FILE, payload: file })
  }

  const value = {
    state,
    actions
  }

  return (
    <ScanContext.Provider value={value}>
      {children}
    </ScanContext.Provider>
  )
}

// Custom hook to use the context
export const useScanContext = () => {
  const context = useContext(ScanContext)
  if (!context) {
    throw new Error('useScanContext must be used within a ScanProvider')
  }
  return context
}

export default ScanContext
