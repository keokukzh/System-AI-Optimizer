import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import GlassCard from './GlassCard'
import LoadingSpinner from './LoadingSpinner'
import useReducedMotion from '../hooks/useReducedMotion'
import scheduler from '../utils/scheduler'

/**
 * ScheduleManager - Create and manage scheduled scans and automation
 * Provides cron-like interface for scheduling system tasks
 */
const ScheduleManager = () => {
  const [schedules, setSchedules] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [executionHistory, setExecutionHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // Form state for creating/editing schedules
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cronExpression: '',
    type: 'scan',
    enabled: true,
    config: {
      paths: ['C:\\'],
      options: {}
    }
  })

  // Load schedules on mount
  useEffect(() => {
    loadSchedules()
    loadExecutionHistory()
    
    // Start scheduler if not running
    if (!scheduler.isRunning()) {
      scheduler.start()
    }

    // Set up callbacks
    scheduler.onScheduleRun((schedule) => {
      // Schedule started: ${schedule.name}
      loadExecutionHistory() // Refresh history
    })

    scheduler.onScheduleComplete((schedule, execution) => {
      // Schedule completed: ${schedule.name}
      loadExecutionHistory() // Refresh history
    })

    scheduler.onScheduleError((schedule, error, execution) => {
      console.error('Schedule failed:', schedule.name, error)
      loadExecutionHistory() // Refresh history
    })

    return () => {
      // Cleanup if needed
    }
  }, [])

  const loadSchedules = () => {
    const allSchedules = scheduler.getAllSchedules()
    setSchedules(allSchedules)
  }

  const loadExecutionHistory = () => {
    const history = scheduler.getExecutionHistory()
    setExecutionHistory(history.slice(-20)) // Show last 20 executions
  }

  const handleCreateSchedule = () => {
    setIsCreating(true)
    setEditingSchedule(null)
    setFormData({
      name: '',
      description: '',
      cronExpression: '',
      type: 'scan',
      enabled: true,
      config: {
        paths: ['C:\\'],
        options: {}
      }
    })
  }

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule.id)
    setFormData({
      name: schedule.name,
      description: schedule.description,
      cronExpression: schedule.cronExpression,
      type: schedule.type,
      enabled: schedule.enabled,
      config: schedule.config
    })
    setIsCreating(true)
  }

  const handleSaveSchedule = () => {
    if (!formData.name || !formData.cronExpression) {
      alert('Please fill in all required fields')
      return
    }

    // Validate cron expression
    const validation = scheduler.validateCronExpression(formData.cronExpression)
    if (!validation.valid) {
      alert(`Invalid cron expression: ${validation.error}`)
      return
    }

    try {
      if (editingSchedule) {
        // Update existing schedule
        scheduler.updateSchedule(editingSchedule, formData)
      } else {
        // Create new schedule
        scheduler.addSchedule(formData)
      }
      
      loadSchedules()
      setIsCreating(false)
      setEditingSchedule(null)
    } catch (error) {
      console.error('Failed to save schedule:', error)
      alert('Failed to save schedule')
    }
  }

  const handleDeleteSchedule = (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      scheduler.removeSchedule(id)
      loadSchedules()
    }
  }

  const handleToggleSchedule = (id) => {
    const schedule = scheduler.getSchedule(id)
    if (schedule) {
      scheduler.updateSchedule(id, { enabled: !schedule.enabled })
      loadSchedules()
    }
  }

  const handleUseTemplate = (template) => {
    setFormData({
      name: template.name,
      description: template.description,
      cronExpression: template.cronExpression,
      type: template.type,
      enabled: true,
      config: template.config
    })
    setShowTemplates(false)
  }

  const getNextRunTime = (cronExpression) => {
    try {
      const nextRun = scheduler.getNextRunTime(cronExpression)
      return nextRun ? nextRun.toLocaleString() : 'Invalid expression'
    } catch (error) {
      return 'Invalid expression'
    }
  }

  const getStatusColor = (schedule) => {
    if (!schedule.enabled) return 'text-dark-muted'
    if (schedule.lastRun) {
      const lastRun = new Date(schedule.lastRun)
      const now = new Date()
      const hoursSinceLastRun = (now - lastRun) / (1000 * 60 * 60)
      
      if (hoursSinceLastRun < 1) return 'text-neon-emerald'
      if (hoursSinceLastRun < 24) return 'text-neon-amber'
      return 'text-neon-pink'
    }
    return 'text-neon-cyan'
  }

  const getExecutionStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-neon-emerald" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <LoadingSpinner size="small" />
      default:
        return <Clock className="w-4 h-4 text-dark-muted" />
    }
  }

  const containerVariants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-space text-dark-text">Schedule Manager</h2>
          <p className="text-dark-muted mt-1">Automate scans and system maintenance tasks</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface/50 text-dark-text rounded-lg hover:bg-dark-surface border border-dark-border transition-colors duration-200"
          >
            <Copy className="w-4 h-4" />
            Templates
          </button>
          
          <button
            onClick={handleCreateSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-dark-bg rounded-lg hover:shadow-neon-cyan transition-all duration-200 font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Schedule
          </button>
        </div>
      </div>

      {/* Templates Panel */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Schedule Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scheduler.templates.map((template, index) => (
                  <motion.button
                    key={index}
                    variants={itemVariants}
                    whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
                    whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                    onClick={() => handleUseTemplate(template)}
                    className="text-left p-4 bg-dark-surface/50 rounded-lg border border-dark-border hover:border-neon-cyan/50 transition-colors duration-200"
                  >
                    <h4 className="font-semibold text-dark-text">{template.name}</h4>
                    <p className="text-sm text-dark-muted mt-1">{template.description}</p>
                    <p className="text-xs text-neon-cyan mt-2 font-mono">{template.cronExpression}</p>
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-dark-text">
                  {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-2 text-dark-muted hover:text-dark-text hover:bg-dark-surface/50 rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Schedule Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-transparent"
                      placeholder="e.g., Daily System Scan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-transparent"
                      rows={3}
                      placeholder="Describe what this schedule does..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Cron Expression *
                    </label>
                    <input
                      type="text"
                      value={formData.cronExpression}
                      onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-transparent font-mono"
                      placeholder="0 9 * * 1-5 (9 AM weekdays)"
                    />
                    <p className="text-xs text-dark-muted mt-1">
                      Format: minute hour day month dayOfWeek
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Schedule Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-transparent"
                    >
                      <option value="scan">System Scan</option>
                      <option value="cleanup">Cleanup</option>
                      <option value="notification">Notification</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Next Run Time
                    </label>
                    <div className="p-3 bg-dark-surface/30 border border-dark-border rounded-lg text-dark-text font-mono text-sm">
                      {formData.cronExpression ? getNextRunTime(formData.cronExpression) : 'Enter cron expression'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4 text-neon-cyan bg-dark-surface border-dark-border rounded focus:ring-neon-cyan/50"
                    />
                    <label htmlFor="enabled" className="text-sm text-dark-text">
                      Enable this schedule
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveSchedule}
                      className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-dark-bg rounded-lg hover:shadow-neon-cyan transition-all duration-200 font-semibold"
                    >
                      <Save className="w-4 h-4" />
                      {editingSchedule ? 'Update' : 'Create'}
                    </button>
                    
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 bg-dark-surface/50 text-dark-text rounded-lg hover:bg-dark-surface border border-dark-border transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Schedules List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {schedules.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Clock className="w-12 h-12 text-dark-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-text mb-2">No Schedules</h3>
            <p className="text-dark-muted mb-4">Create your first automated schedule to get started</p>
            <button
              onClick={handleCreateSchedule}
              className="px-4 py-2 bg-neon-cyan text-dark-bg rounded-lg hover:shadow-neon-cyan transition-all duration-200 font-semibold"
            >
              Create Schedule
            </button>
          </GlassCard>
        ) : (
          schedules.map((schedule) => (
            <motion.div key={schedule.id} variants={itemVariants}>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-dark-text">{schedule.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        schedule.enabled 
                          ? 'bg-neon-emerald/20 text-neon-emerald' 
                          : 'bg-dark-muted/20 text-dark-muted'
                      }`}>
                        {schedule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    
                    <p className="text-dark-muted text-sm mb-3">{schedule.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-dark-muted">Cron:</span>
                        <span className="ml-2 font-mono text-neon-cyan">{schedule.cronExpression}</span>
                      </div>
                      <div>
                        <span className="text-dark-muted">Next Run:</span>
                        <span className="ml-2 text-dark-text">{getNextRunTime(schedule.cronExpression)}</span>
                      </div>
                      <div>
                        <span className="text-dark-muted">Last Run:</span>
                        <span className="ml-2 text-dark-text">
                          {schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleSchedule(schedule.id)}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        schedule.enabled
                          ? 'text-neon-amber hover:bg-neon-amber/20'
                          : 'text-neon-emerald hover:bg-neon-emerald/20'
                      }`}
                      title={schedule.enabled ? 'Disable' : 'Enable'}
                    >
                      {schedule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={() => handleEditSchedule(schedule)}
                      className="p-2 text-dark-muted hover:text-dark-text hover:bg-dark-surface/50 rounded-lg transition-colors duration-200"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-dark-text mb-4">Recent Executions</h3>
          <div className="space-y-2">
            {executionHistory.map((execution) => (
              <div key={execution.id} className="flex items-center justify-between p-3 bg-dark-surface/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {getExecutionStatusIcon(execution.status)}
                  <div>
                    <p className="text-sm text-dark-text">
                      {schedules.find(s => s.id === execution.scheduleId)?.name || 'Unknown Schedule'}
                    </p>
                    <p className="text-xs text-dark-muted">
                      {new Date(execution.startTime).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-dark-text">
                    {execution.duration ? `${execution.duration}ms` : 'Running...'}
                  </p>
                  {execution.error && (
                    <p className="text-xs text-red-500">{execution.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

export default ScheduleManager
