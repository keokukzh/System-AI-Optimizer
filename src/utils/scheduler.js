/**
 * Scheduler Utility - Schedule storage and execution queue
 * Provides cron-like scheduling for automated scans and actions
 */

/**
 * Schedule storage with localStorage persistence
 */
class ScheduleStorage {
  constructor() {
    this.storageKey = 'optiai-schedules'
    this.schedules = this.loadSchedules()
  }

  loadSchedules() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load schedules:', error)
      return []
    }
  }

  saveSchedules() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.schedules))
    } catch (error) {
      console.error('Failed to save schedules:', error)
    }
  }

  addSchedule(schedule) {
    const newSchedule = {
      id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastRun: null,
      nextRun: null,
      runCount: 0,
      enabled: true,
      ...schedule
    }
    
    this.schedules.push(newSchedule)
    this.saveSchedules()
    return newSchedule.id
  }

  updateSchedule(id, updates) {
    const index = this.schedules.findIndex(s => s.id === id)
    if (index !== -1) {
      this.schedules[index] = { ...this.schedules[index], ...updates }
      this.saveSchedules()
      return true
    }
    return false
  }

  removeSchedule(id) {
    const index = this.schedules.findIndex(s => s.id === id)
    if (index !== -1) {
      this.schedules.splice(index, 1)
      this.saveSchedules()
      return true
    }
    return false
  }

  getSchedule(id) {
    return this.schedules.find(s => s.id === id)
  }

  getAllSchedules() {
    return [...this.schedules]
  }

  getEnabledSchedules() {
    return this.schedules.filter(s => s.enabled)
  }
}

/**
 * Cron-like expression parser
 * Supports: minute hour day month dayOfWeek
 * Examples: "0 9 * * 1-5" (9 AM weekdays), "30 */2 * * *" (every 2 hours at 30 minutes)
 */
class CronParser {
  static parse(expression) {
    const parts = expression.trim().split(/\s+/)
    if (parts.length !== 5) {
      throw new Error('Cron expression must have 5 parts: minute hour day month dayOfWeek')
    }

    return {
      minute: this.parseField(parts[0], 0, 59),
      hour: this.parseField(parts[1], 0, 23),
      day: this.parseField(parts[2], 1, 31),
      month: this.parseField(parts[3], 1, 12),
      dayOfWeek: this.parseField(parts[4], 0, 6) // 0 = Sunday
    }
  }

  static parseField(field, min, max) {
    if (field === '*') {
      return { type: 'any', values: [] }
    }

    if (field.includes(',')) {
      const values = field.split(',').map(v => parseInt(v.trim()))
      return { type: 'list', values: values.filter(v => v >= min && v <= max) }
    }

    if (field.includes('-')) {
      const [start, end] = field.split('-').map(v => parseInt(v.trim()))
      const values = []
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) values.push(i)
      }
      return { type: 'range', values }
    }

    if (field.includes('/')) {
      const [base, step] = field.split('/')
      const baseValue = base === '*' ? min : parseInt(base)
      const stepValue = parseInt(step)
      const values = []
      for (let i = baseValue; i <= max; i += stepValue) {
        values.push(i)
      }
      return { type: 'step', values }
    }

    const value = parseInt(field)
    if (value >= min && value <= max) {
      return { type: 'single', values: [value] }
    }

    throw new Error(`Invalid field value: ${field}`)
  }

  static getNextRun(cronExpression, fromDate = new Date()) {
    try {
      const cron = this.parse(cronExpression)
      const next = new Date(fromDate)
      next.setSeconds(0, 0) // Reset seconds and milliseconds

      // Find next valid minute
      while (true) {
        const minute = next.getMinutes()
        const hour = next.getHours()
        const day = next.getDate()
        const month = next.getMonth() + 1
        const dayOfWeek = next.getDay()

        if (this.matchesField(cron.minute, minute) &&
            this.matchesField(cron.hour, hour) &&
            this.matchesField(cron.day, day) &&
            this.matchesField(cron.month, month) &&
            this.matchesField(cron.dayOfWeek, dayOfWeek)) {
          return next
        }

        // Move to next minute
        next.setMinutes(minute + 1)
        
        // Prevent infinite loop (max 1 year ahead)
        if (next.getTime() - fromDate.getTime() > 365 * 24 * 60 * 60 * 1000) {
          throw new Error('No valid next run time found within 1 year')
        }
      }
    } catch (error) {
      console.error('Failed to calculate next run time:', error)
      return null
    }
  }

  static matchesField(field, value) {
    switch (field.type) {
      case 'any':
        return true
      case 'single':
      case 'list':
      case 'range':
      case 'step':
        return field.values.includes(value)
      default:
        return false
    }
  }
}

/**
 * Schedule execution queue and background runner
 */
class ScheduleRunner {
  constructor() {
    this.storage = new ScheduleStorage()
    this.running = false
    this.intervalId = null
    this.executionQueue = []
    this.callbacks = {
      onScheduleRun: null,
      onScheduleComplete: null,
      onScheduleError: null
    }
  }

  start() {
    if (this.running) return
    
    this.running = true
    this.intervalId = setInterval(() => {
      this.checkSchedules()
    }, 60000) // Check every minute

    // Schedule runner started
  }

  stop() {
    if (!this.running) return
    
    this.running = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    // Schedule runner stopped
  }

  checkSchedules() {
    const now = new Date()
    const enabledSchedules = this.storage.getEnabledSchedules()

    for (const schedule of enabledSchedules) {
      try {
        const nextRun = CronParser.getNextRun(schedule.cronExpression, schedule.lastRun ? new Date(schedule.lastRun) : now)
        
        if (nextRun && nextRun <= now) {
          this.executeSchedule(schedule)
        }
      } catch (error) {
        console.error(`Error checking schedule ${schedule.id}:`, error)
      }
    }
  }

  async executeSchedule(schedule) {
    try {
      // Executing schedule: ${schedule.name}
      
      // Update schedule state
      this.storage.updateSchedule(schedule.id, {
        lastRun: Date.now(),
        runCount: schedule.runCount + 1,
        nextRun: CronParser.getNextRun(schedule.cronExpression, new Date()).getTime()
      })

      // Add to execution queue
      this.executionQueue.push({
        id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        scheduleId: schedule.id,
        startTime: Date.now(),
        status: 'running'
      })

      // Notify callback
      if (this.callbacks.onScheduleRun) {
        this.callbacks.onScheduleRun(schedule)
      }

      // Execute the scheduled action
      await this.runScheduledAction(schedule)

      // Mark as completed
      const execution = this.executionQueue.find(e => e.scheduleId === schedule.id && e.status === 'running')
      if (execution) {
        execution.status = 'completed'
        execution.endTime = Date.now()
        execution.duration = execution.endTime - execution.startTime
      }

      if (this.callbacks.onScheduleComplete) {
        this.callbacks.onScheduleComplete(schedule, execution)
      }

    } catch (error) {
      console.error(`Error executing schedule ${schedule.id}:`, error)
      
      // Mark as failed
      const execution = this.executionQueue.find(e => e.scheduleId === schedule.id && e.status === 'running')
      if (execution) {
        execution.status = 'failed'
        execution.endTime = Date.now()
        execution.duration = execution.endTime - execution.startTime
        execution.error = error.message
      }

      if (this.callbacks.onScheduleError) {
        this.callbacks.onScheduleError(schedule, error, execution)
      }
    }
  }

  async runScheduledAction(schedule) {
    switch (schedule.type) {
      case 'scan':
        return this.runScheduledScan(schedule)
      case 'cleanup':
        return this.runScheduledCleanup(schedule)
      case 'notification':
        return this.runScheduledNotification(schedule)
      default:
        throw new Error(`Unknown schedule type: ${schedule.type}`)
    }
  }

  async runScheduledScan(schedule) {
    const { paths, options = {} } = schedule.config
    
    // Simulate scan execution
    // Running scheduled scan on paths: ${paths.join(', ')}
    
    // In a real implementation, this would call the actual scan API
    return new Promise((resolve) => {
      setTimeout(() => {
        // Scheduled scan completed
        resolve({ success: true, filesFound: Math.floor(Math.random() * 100) })
      }, 2000)
    })
  }

  async runScheduledCleanup(schedule) {
    const { actions, options = {} } = schedule.config
    
    // Running scheduled cleanup with actions: ${actions.join(', ')}
    
    // Simulate cleanup execution
    return new Promise((resolve) => {
      setTimeout(() => {
        // Scheduled cleanup completed
        resolve({ success: true, spaceFreed: Math.floor(Math.random() * 1000) + 'MB' })
      }, 1500)
    })
  }

  async runScheduledNotification(schedule) {
    const { message, type = 'info' } = schedule.config
    
    // Sending scheduled notification: ${message}
    
    // In a real implementation, this would trigger a notification
    return new Promise((resolve) => {
      setTimeout(() => {
        // Scheduled notification sent
        resolve({ success: true })
      }, 500)
    })
  }

  // Callback management
  onScheduleRun(callback) {
    this.callbacks.onScheduleRun = callback
  }

  onScheduleComplete(callback) {
    this.callbacks.onScheduleComplete = callback
  }

  onScheduleError(callback) {
    this.callbacks.onScheduleError = callback
  }

  // Getters
  getExecutionHistory() {
    return [...this.executionQueue]
  }

  getRunningExecutions() {
    return this.executionQueue.filter(e => e.status === 'running')
  }

  isRunning() {
    return this.running
  }
}

// Predefined schedule templates
const scheduleTemplates = [
  {
    name: 'Daily System Scan',
    description: 'Scan system for optimization opportunities every day at 9 AM',
    cronExpression: '0 9 * * 1-5', // 9 AM weekdays
    type: 'scan',
    config: {
      paths: ['C:\\'],
      options: {
        includeHidden: false,
        maxDepth: 10
      }
    }
  },
  {
    name: 'Weekly Deep Clean',
    description: 'Deep system cleanup every Sunday at 2 AM',
    cronExpression: '0 2 * * 0', // 2 AM Sunday
    type: 'cleanup',
    config: {
      actions: ['temp-files', 'cache', 'logs'],
      options: {
        aggressive: true
      }
    }
  },
  {
    name: 'Hourly Health Check',
    description: 'Check system health every hour',
    cronExpression: '0 * * * *', // Every hour
    type: 'notification',
    config: {
      message: 'System health check completed',
      type: 'info'
    }
  },
  {
    name: 'Monthly Report',
    description: 'Generate monthly optimization report',
    cronExpression: '0 10 1 * *', // 10 AM on 1st of every month
    type: 'scan',
    config: {
      paths: ['C:\\'],
      options: {
        generateReport: true,
        includeMetrics: true
      }
    }
  }
]

// Create singleton instances
const scheduleStorage = new ScheduleStorage()
const scheduleRunner = new ScheduleRunner()

// Export the main scheduler utility
const scheduler = {
  // Storage operations
  addSchedule: (schedule) => scheduleStorage.addSchedule(schedule),
  updateSchedule: (id, updates) => scheduleStorage.updateSchedule(id, updates),
  removeSchedule: (id) => scheduleStorage.removeSchedule(id),
  getSchedule: (id) => scheduleStorage.getSchedule(id),
  getAllSchedules: () => scheduleStorage.getAllSchedules(),
  getEnabledSchedules: () => scheduleStorage.getEnabledSchedules(),

  // Runner operations
  start: () => scheduleRunner.start(),
  stop: () => scheduleRunner.stop(),
  isRunning: () => scheduleRunner.isRunning(),
  getExecutionHistory: () => scheduleRunner.getExecutionHistory(),
  getRunningExecutions: () => scheduleRunner.getRunningExecutions(),

  // Callbacks
  onScheduleRun: (callback) => scheduleRunner.onScheduleRun(callback),
  onScheduleComplete: (callback) => scheduleRunner.onScheduleComplete(callback),
  onScheduleError: (callback) => scheduleRunner.onScheduleError(callback),

  // Utilities
  CronParser,
  templates: scheduleTemplates,

  // Validation
  validateCronExpression: (expression) => {
    try {
      CronParser.parse(expression)
      return { valid: true }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  },

  getNextRunTime: (cronExpression, fromDate) => {
    return CronParser.getNextRun(cronExpression, fromDate)
  }
}

export default scheduler
