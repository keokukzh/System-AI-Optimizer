import React, { useState, useEffect, useCallback } from 'react'
import { 
  Play, 
  Square, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Shield,
  RefreshCw,
  Trash2
} from 'lucide-react'

interface StartupItem {
  name: string
  path: string
  scope: string
  status: string
  registry_path: string
}

interface StartupListResponse {
  items: StartupItem[]
  total_count: number
  user_count: number
  machine_count: number
  enabled_count: number
  disabled_count: number
}

interface StartupActionResponse {
  success: boolean
  message: string
  requires_admin: boolean
}

interface StartupStatusResponse {
  platform: string
  is_windows: boolean
  registry_available: boolean
  startup_management_available: boolean
  message: string
}

const Startup: React.FC = () => {
  const [startupItems, setStartupItems] = useState<StartupItem[]>([])
  const [startupStats, setStartupStats] = useState<StartupListResponse | null>(null)
  const [startupStatus, setStartupStatus] = useState<StartupStatusResponse | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set())
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    show: boolean
    action: string
    item: StartupItem
  }>({ show: false, action: '', item: { name: '', path: '', scope: '', status: '', registry_path: '' } })

  // Fetch startup status
  const fetchStartupStatus = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5174/api/startup/status')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setStartupStatus(data)
    } catch (err) {
      console.error('Failed to fetch startup status:', err)
    }
  }, [])

  // Fetch startup items
  const fetchStartupItems = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5174/api/startup/list')
      if (!response.ok) {
        if (response.status === 501) {
          setError('Startup management is only available on Windows with registry access')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setStartupItems(data.items)
      setStartupStats(data)
      setError(null)
    } catch (err) {
      setError(`Failed to fetch startup items: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  // Auto-refresh startup items
  useEffect(() => {
    fetchStartupStatus()
    fetchStartupItems()
    
    const interval = setInterval(() => {
      fetchStartupItems()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [fetchStartupStatus, fetchStartupItems])

  // Handle item selection
  const toggleItemSelection = (itemKey: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(itemKey)) {
      newSelection.delete(itemKey)
    } else {
      newSelection.add(itemKey)
    }
    setSelectedItems(newSelection)
  }

  // Handle startup action
  const handleStartupAction = async (item: StartupItem, action: string) => {
    const itemKey = `${item.scope}_${item.name}`
    setActionLoading(prev => new Set(prev).add(itemKey))
    
    try {
      let response: Response
      
      if (action === 'enable') {
        response = await fetch('http://127.0.0.1:5174/api/startup/enable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: item.name, 
            path: item.path, 
            scope: item.scope 
          })
        })
      } else if (action === 'disable') {
        response = await fetch('http://127.0.0.1:5174/api/startup/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: item.name, 
            scope: item.scope 
          })
        })
      } else if (action === 'remove') {
        response = await fetch('http://127.0.0.1:5174/api/startup/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: item.name, 
            scope: item.scope 
          })
        })
      } else if (action === 'restore') {
        response = await fetch('http://127.0.0.1:5174/api/startup/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: item.name, 
            scope: item.scope 
          })
        })
      } else {
        throw new Error('Unknown action')
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: StartupActionResponse = await response.json()
      
      if (result.success) {
        // Show success message
        // Success: ${result.message}
        // Refresh startup items
        fetchStartupItems()
      } else {
        // Show error or confirmation dialog
        if (result.requires_admin) {
          setShowConfirmDialog({
            show: true,
            action: action,
            item: item
          })
        } else {
          setError(result.message)
        }
      }
    } catch (err) {
      setError(`Failed to ${action} startup item: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemKey)
        return newSet
      })
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled': return 'text-green-500 bg-green-50'
      case 'disabled': return 'text-red-500 bg-red-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  // Get scope color
  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'user': return 'text-blue-500 bg-blue-50'
      case 'machine': return 'text-purple-500 bg-purple-50'
      default: return 'text-gray-500 bg-gray-50'
    }
  }

  // Check if startup management is available
  if (startupStatus && !startupStatus.startup_management_available) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Play className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Startup Manager</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage Windows startup applications
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Startup Management Not Available</h3>
              <p className="text-yellow-700 mt-1">
                {startupStatus.message}
              </p>
              <p className="text-yellow-600 text-sm mt-2">
                Startup management is only available on Windows systems with registry access.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Play className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Startup Manager</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage Windows startup applications
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchStartupItems}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {startupStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Items</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{startupStats.total_count}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Enabled</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{startupStats.enabled_count}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Square className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Disabled</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{startupStats.disabled_count}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">User Scope</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{startupStats.user_count}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Machine Scope</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{startupStats.machine_count}</p>
          </div>
        </div>
      )}

      {/* Startup Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === startupItems.length && startupItems.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(startupItems.map(item => `${item.scope}_${item.name}`)))
                      } else {
                        setSelectedItems(new Set())
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Path
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Scope
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {startupItems.map((item) => {
                const itemKey = `${item.scope}_${item.name}`
                return (
                  <tr key={itemKey} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(itemKey)}
                        onChange={() => toggleItemSelection(itemKey)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {item.path}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScopeColor(item.scope)}`}>
                        {item.scope}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {item.status === 'enabled' ? (
                        <button
                          onClick={() => handleStartupAction(item, 'disable')}
                          disabled={actionLoading.has(itemKey)}
                          className="text-yellow-500 hover:text-yellow-700 disabled:opacity-50"
                          title="Disable Startup Item"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartupAction(item, 'enable')}
                          disabled={actionLoading.has(itemKey)}
                          className="text-green-500 hover:text-green-700 disabled:opacity-50"
                          title="Enable Startup Item"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleStartupAction(item, 'restore')}
                        disabled={actionLoading.has(itemKey)}
                        className="text-blue-500 hover:text-blue-700 disabled:opacity-50"
                        title="Restore Startup Item"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleStartupAction(item, 'remove')}
                        disabled={actionLoading.has(itemKey)}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        title="Remove Startup Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Administrator Privileges Required
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This action requires administrator privileges. Please run OptiAI as administrator to perform this action.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog({ show: false, action: '', item: { name: '', path: '', scope: '', status: '', registry_path: '' } })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleStartupAction(showConfirmDialog.item, showConfirmDialog.action)
                  setShowConfirmDialog({ show: false, action: '', item: { name: '', path: '', scope: '', status: '', registry_path: '' } })
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Try Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Startup
