import React, { useState, useEffect } from 'react'
import { Clock, Play, Pause, Trash2, Plus, Calendar, Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { API_CONFIG } from '../config/environment'

interface AutomationSchedule {
  id: string
  name: string
  description: string
  schedule_type: 'interval' | 'cron' | 'event'
  schedule_config: any
  actions: any[]
  enabled: boolean
  created_at: string
  last_run?: string
  next_run?: string
  run_count: number
  status: 'active' | 'disabled' | 'error'
}

interface AutomationExecution {
  id: string
  schedule_id: string
  schedule_name: string
  started_at: string
  completed_at?: string
  duration_seconds?: number
  status: 'running' | 'completed' | 'failed'
  actions_executed: number
  actions_failed: number
  result: 'success' | 'failure' | 'partial'
}

const Automation: React.FC = () => {
  const [schedules, setSchedules] = useState<AutomationSchedule[]>([])
  const [executions, setExecutions] = useState<AutomationExecution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState<'schedules' | 'executions'>('schedules')
  
  // New schedule form
  const [showNewSchedule, setShowNewSchedule] = useState(false)
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    schedule_type: 'interval' as const,
    schedule_config: { interval_minutes: 60 },
    actions: [],
    enabled: true
  })

  useEffect(() => {
    loadSchedules()
    loadExecutions()
  }, [])

  const loadSchedules = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/automation/schedules`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSchedules(data.schedules || [])
        } else {
          setError(data.error || 'Failed to load schedules')
        }
      }
    } catch (err) {
      setError(`Failed to load schedules: ${err.message}`)
    }
  }

  const loadExecutions = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/automation/executions`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setExecutions(data.executions || [])
        } else {
          setError(data.error || 'Failed to load executions')
        }
      }
    } catch (err) {
      setError(`Failed to load executions: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSchedule = async () => {
    if (!newSchedule.name.trim()) {
      setError('Schedule name is required')
      return
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/automation/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setNewSchedule({
            name: '',
            description: '',
            schedule_type: 'interval',
            schedule_config: { interval_minutes: 60 },
            actions: [],
            enabled: true
          })
          setShowNewSchedule(false)
          loadSchedules()
          setSuccess('Automation schedule created successfully')
        } else {
          setError(data.error || 'Failed to create schedule')
        }
      }
    } catch (err) {
      setError(`Failed to create schedule: ${err.message}`)
    }
  }

  const handleRunSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/automation/schedules/${scheduleId}/run`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSuccess('Schedule executed successfully')
          loadExecutions()
        } else {
          setError(data.error || 'Failed to run schedule')
        }
      }
    } catch (err) {
      setError(`Failed to run schedule: ${err.message}`)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this automation schedule?')) return

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/automation/schedules/${scheduleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          loadSchedules()
          setSuccess('Schedule deleted successfully')
        } else {
          setError(data.error || 'Failed to delete schedule')
        }
      }
    } catch (err) {
      setError(`Failed to delete schedule: ${err.message}`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'disabled':
      case 'failed':
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'running':
        return <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'success':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900'
      case 'disabled':
      case 'failed':
      case 'failure':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900'
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900'
      case 'error':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900'
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Automation</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Schedule and manage automated system optimization tasks
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 p-4 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'schedules'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Schedules ({schedules.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('executions')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'executions'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Executions ({executions.length})</span>
          </div>
        </button>
      </div>

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {/* Create New Schedule */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Automation Schedules</h3>
              <button
                onClick={() => setShowNewSchedule(!showNewSchedule)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Schedule</span>
              </button>
            </div>

            {showNewSchedule && (
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Schedule Name
                    </label>
                    <input
                      type="text"
                      value={newSchedule.name}
                      onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                      placeholder="e.g., Daily Cleanup"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Schedule Type
                    </label>
                    <select
                      value={newSchedule.schedule_type}
                      onChange={(e) => setNewSchedule({ ...newSchedule, schedule_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="interval">Interval</option>
                      <option value="cron">Cron</option>
                      <option value="event">Event-based</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    placeholder="Describe what this automation does..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleCreateSchedule}
                    disabled={!newSchedule.name.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Schedule
                  </button>
                  <button
                    onClick={() => setShowNewSchedule(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Schedules List */}
          <div className="space-y-4">
            {schedules.length > 0 ? (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {schedule.name}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                          {getStatusIcon(schedule.status)}
                          <span className="ml-1">{schedule.status}</span>
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {schedule.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Type:</span>
                          <span className="ml-1 text-gray-900 dark:text-white capitalize">{schedule.schedule_type}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Runs:</span>
                          <span className="ml-1 text-gray-900 dark:text-white">{schedule.run_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Last Run:</span>
                          <span className="ml-1 text-gray-900 dark:text-white">
                            {schedule.last_run ? formatDate(schedule.last_run) : 'Never'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Next Run:</span>
                          <span className="ml-1 text-gray-900 dark:text-white">
                            {schedule.next_run ? formatDate(schedule.next_run) : 'Not scheduled'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleRunSchedule(schedule.id)}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex items-center space-x-1"
                      >
                        <Play className="w-4 h-4" />
                        <span>Run</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No automation schedules
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create your first automation schedule to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executions Tab */}
      {activeTab === 'executions' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Execution History</h3>
            
            {executions.length > 0 ? (
              <div className="space-y-4">
                {executions.map((execution) => (
                  <div
                    key={execution.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {execution.schedule_name}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                          {getStatusIcon(execution.status)}
                          <span className="ml-1">{execution.status}</span>
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(execution.started_at)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                        <span className="ml-1 text-gray-900 dark:text-white">
                          {execution.duration_seconds ? formatDuration(execution.duration_seconds) : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Actions Executed:</span>
                        <span className="ml-1 text-gray-900 dark:text-white">{execution.actions_executed}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Actions Failed:</span>
                        <span className="ml-1 text-gray-900 dark:text-white">{execution.actions_failed}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Result:</span>
                        <span className="ml-1 text-gray-900 dark:text-white capitalize">{execution.result}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No executions yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Execution history will appear here once schedules start running.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Automation
