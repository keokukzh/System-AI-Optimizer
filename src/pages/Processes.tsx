import React, { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  MemoryStick,
  Play,
  Square,
  Settings,
  RefreshCw,
  Info,
  Zap,
  TrendingUp
} from 'lucide-react'
import LoadingSkeleton from '../components/LoadingSkeleton'

interface ProcessInfo {
  pid: number
  name: string
  cpu_percent: number
  memory: number  // Backend uses 'memory' in bytes
  status: string
  create_time?: number
  username?: string
}

interface ProcessStats {
  total_processes: number
  cpu_count: number
  cpu_percent: number
  memory_total_gb: number
  memory_used_gb: number
  memory_percent: number
  protected_processes: number
}

interface ProcessActionResponse {
  success: boolean
  message: string
  requires_confirmation: boolean
  risk_level: string
}

const Processes: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessInfo[]>([])
  const [stats, setStats] = useState<ProcessStats | null>(null)
  const [selectedPids, setSelectedPids] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Set<number>>(new Set())
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    show: boolean
    action: string
    pid: number
    processName: string
  }>({ show: false, action: '', pid: 0, processName: '' })

  // Fetch processes
  const fetchProcesses = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5175/api/processes')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      // Backend returns { processes: [...], total: 321 }
      setProcesses(data.processes || data)
      setError(null)
    } catch (err) {
      setError(`Failed to fetch processes: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('http://127.0.0.1:5175/api/metrics')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      // Convert metrics to process stats format
      setStats({
        total_processes: processes.length,
        cpu_count: data.cpu_count || 8,
        cpu_percent: data.cpu_percent || 0,
        memory_total_gb: data.memory_total_gb || 16,
        memory_used_gb: data.memory_used_gb || 8,
        memory_percent: data.memory_percent || 50,
        protected_processes: 0
      })
    } catch (err) {
      console.error('Failed to fetch process stats:', err)
    }
  }, [processes.length])

  // Auto-refresh processes
  useEffect(() => {
    fetchProcesses()
    fetchStats()
    
    const interval = setInterval(() => {
      fetchProcesses()
      fetchStats()
    }, 1000) // Refresh every second

    return () => clearInterval(interval)
  }, [fetchProcesses, fetchStats])

  // Handle process selection
  const toggleProcessSelection = (pid: number) => {
    const newSelection = new Set(selectedPids)
    if (newSelection.has(pid)) {
      newSelection.delete(pid)
    } else {
      newSelection.add(pid)
    }
    setSelectedPids(newSelection)
  }

  // Handle process action
  const handleProcessAction = async (pid: number, action: string, processName: string) => {
    setActionLoading(prev => new Set(prev).add(pid))
    
    try {
      let response: Response
      
      if (action === 'terminate') {
        response = await fetch('http://127.0.0.1:5174/api/process/terminate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pid, force: false })
        })
      } else if (action.startsWith('priority_')) {
        const priority = action.split('_')[1]
        response = await fetch('http://127.0.0.1:5174/api/process/priority', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pid, priority })
        })
      } else {
        throw new Error('Unknown action')
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ProcessActionResponse = await response.json()
      
      if (result.success) {
        // Show success message
        // Success: ${result.message}
        // Refresh processes
        fetchProcesses()
      } else {
        // Show error or confirmation dialog
        if (result.requires_confirmation) {
          setShowConfirmDialog({
            show: true,
            action: action,
            pid: pid,
            processName: processName
          })
        } else {
          setError(result.message)
        }
      }
    } catch (err) {
      setError(`Failed to ${action} process: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(pid)
        return newSet
      })
    }
  }

  // Get risk level color
  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  // Get CPU/Memory warning color
  const getUsageColor = (percent: number, type: 'cpu' | 'memory') => {
    if (percent > 80) return 'text-red-500 bg-red-50'
    if (percent > 50) return 'text-yellow-500 bg-yellow-50'
    return 'text-green-500 bg-green-50'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Process Manager</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor and manage system processes
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchProcesses}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Banner with modern design */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-xl flex items-center space-x-3 shadow-md animate-slideInRight">
          <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
          <span className="text-red-800 font-medium flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 w-8 h-8 bg-red-200 hover:bg-red-300 rounded-full flex items-center justify-center text-red-700 font-bold transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards with glass-morphism */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card group hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total_processes}</p>
            <span className="text-sm font-medium text-gray-600">Total Processes</span>
          </div>

          <div className="glass-card group hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${stats.cpu_percent > 80 ? 'bg-red-100 text-red-700' : stats.cpu_percent > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                {stats.cpu_percent > 80 ? 'High' : stats.cpu_percent > 50 ? 'Medium' : 'Low'}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.cpu_percent}%</p>
            <span className="text-sm font-medium text-gray-600">CPU Usage</span>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${stats.cpu_percent > 80 ? 'bg-red-500' : stats.cpu_percent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(stats.cpu_percent, 100)}%` }}
              />
            </div>
          </div>

          <div className="glass-card group hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <MemoryStick className="h-6 w-6 text-white" />
              </div>
              <div className={`text-xs font-semibold px-2 py-1 rounded-full ${stats.memory_percent > 80 ? 'bg-red-100 text-red-700' : stats.memory_percent > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                {stats.memory_percent > 80 ? 'High' : stats.memory_percent > 50 ? 'Medium' : 'Low'}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.memory_percent}%</p>
            <span className="text-sm font-medium text-gray-600">Memory Usage</span>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${stats.memory_percent > 80 ? 'bg-red-500' : stats.memory_percent > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(stats.memory_percent, 100)}%` }}
              />
            </div>
          </div>

          <div className="glass-card group hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                <Info className="h-6 w-6 text-white" />
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.protected_processes}</p>
            <span className="text-sm font-medium text-gray-600">Protected Processes</span>
          </div>
        </div>
      )}

      {/* Processes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    aria-label="Select all processes"
                    title="Select all processes"
                    checked={selectedPids.size === processes.length && processes.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPids(new Set(processes.map(p => p.pid)))
                      } else {
                        setSelectedPids(new Set())
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  PID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  CPU %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Memory %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Memory (MB)
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
              {processes.map((process) => (
                <tr key={process.pid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      aria-label={`Select process ${process.name} (PID ${process.pid})`}
                      title={`Select process ${process.name} (PID ${process.pid})`}
                      checked={selectedPids.has(process.pid)}
                      onChange={() => toggleProcessSelection(process.pid)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                    {process.pid}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {process.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(process.cpu_percent, 'cpu')}`}>
                      {process.cpu_percent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(0, 'memory')}`}>
                      N/A
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {(process.memory / 1024 / 1024).toFixed(1)} MB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {process.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleProcessAction(process.pid, 'terminate', process.name)}
                      disabled={actionLoading.has(process.pid)}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      title="Terminate Process"
                    >
                      <Square className="h-4 w-4" />
                    </button>
                    
                    <div className="relative inline-block">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleProcessAction(process.pid, `priority_${e.target.value}`, process.name)
                            e.target.value = '' // Reset selection
                          }
                        }}
                        disabled={actionLoading.has(process.pid)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      >
                        <option value="">Priority</option>
                        <option value="high">High</option>
                        <option value="above_normal">Above Normal</option>
                        <option value="normal">Normal</option>
                        <option value="below_normal">Below Normal</option>
                        <option value="idle">Idle</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Action
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to {showConfirmDialog.action} the process "{showConfirmDialog.processName}" (PID: {showConfirmDialog.pid})?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog({ show: false, action: '', pid: 0, processName: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleProcessAction(showConfirmDialog.pid, showConfirmDialog.action, showConfirmDialog.processName)
                  setShowConfirmDialog({ show: false, action: '', pid: 0, processName: '' })
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Processes
