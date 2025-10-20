/**
 * Debug Logger
 * Color-coded console logging with request/response tracking and error logging
 */

class DebugLogger {
  constructor() {
    this.requestLog = []
    this.errorLog = []
    this.maxLogSize = 100
    this.isEnabled = true
    
    // Initialize localStorage logs
    this.loadLogs()
    
    // Override console methods for enhanced logging
    this.setupConsoleOverrides()
  }

  /**
   * Load logs from localStorage
   */
  loadLogs() {
    try {
      const requestLog = localStorage.getItem('debug_request_log')
      const errorLog = localStorage.getItem('debug_error_log')
      
      this.requestLog = requestLog ? JSON.parse(requestLog) : []
      this.errorLog = errorLog ? JSON.parse(errorLog) : []
    } catch (error) {
      console.warn('Failed to load debug logs:', error)
      this.requestLog = []
      this.errorLog = []
    }
  }

  /**
   * Save logs to localStorage
   */
  saveLogs() {
    try {
      localStorage.setItem('debug_request_log', JSON.stringify(this.requestLog))
      localStorage.setItem('debug_error_log', JSON.stringify(this.errorLog))
    } catch (error) {
      console.warn('Failed to save debug logs:', error)
    }
  }

  /**
   * Setup console method overrides for enhanced logging
   */
  setupConsoleOverrides() {
    if (!this.isEnabled) return

    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn
    const originalInfo = console.info

    // Enhanced console.log
    console.log = (...args) => {
      this.log('log', args)
      originalLog.apply(console, args)
    }

    // Enhanced console.error
    console.error = (...args) => {
      this.log('error', args)
      this.addErrorLog(args.join(' '))
      originalError.apply(console, args)
    }

    // Enhanced console.warn
    console.warn = (...args) => {
      this.log('warn', args)
      originalWarn.apply(console, args)
    }

    // Enhanced console.info
    console.info = (...args) => {
      this.log('info', args)
      originalInfo.apply(console, args)
    }
  }

  /**
   * Log with color coding
   */
  log(level, args) {
    if (!this.isEnabled) return

    const timestamp = new Date().toISOString()
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')

    const colors = {
      log: '#00ff00',    // Green
      error: '#ff0000',  // Red
      warn: '#ffaa00',   // Orange
      info: '#00aaff'    // Blue
    }

    const color = colors[level] || '#ffffff'
    
    // Enhanced console output with styling
    console.log(
      `%c[${timestamp}] %c[${level.toUpperCase()}] %c${message}`,
      'color: #666; font-size: 11px;',
      `color: ${color}; font-weight: bold; font-size: 11px;`,
      'color: #fff; font-size: 12px;'
    )
  }

  /**
   * Log API request
   */
  logRequest(method, url, status, responseTime, error = null) {
    if (!this.isEnabled) return

    const request = {
      timestamp: Date.now(),
      method,
      url,
      status,
      responseTime,
      error: error ? error.message : null,
      success: status >= 200 && status < 300
    }

    this.requestLog.push(request)
    
    // Keep only last maxLogSize entries
    if (this.requestLog.length > this.maxLogSize) {
      this.requestLog = this.requestLog.slice(-this.maxLogSize)
    }

    this.saveLogs()

    // Color-coded console output
    const color = request.success ? '#00ff00' : '#ff0000'
    const statusText = request.success ? 'SUCCESS' : 'FAILED'
    
    console.log(
      `%c[API] %c${method} %c${url} %c${status} %c${responseTime}ms %c${statusText}`,
      'color: #00aaff; font-weight: bold;',
      `color: ${color}; font-weight: bold;`,
      'color: #fff;',
      `color: ${color}; font-weight: bold;`,
      'color: #ffaa00;',
      `color: ${color}; font-weight: bold;`
    )

    if (error) {
      console.error(`%c[API ERROR] %c${error.message}`, 'color: #ff0000; font-weight: bold;', 'color: #fff;')
    }
  }

  /**
   * Log error
   */
  addErrorLog(message) {
    if (!this.isEnabled) return

    const error = {
      timestamp: Date.now(),
      message: typeof message === 'string' ? message : JSON.stringify(message),
      stack: new Error().stack
    }

    this.errorLog.push(error)
    
    // Keep only last maxLogSize entries
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize)
    }

    this.saveLogs()
  }

  /**
   * Log performance timing
   */
  logPerformance(name, startTime, endTime, metadata = {}) {
    if (!this.isEnabled) return

    const duration = endTime - startTime
    const color = duration < 100 ? '#00ff00' : duration < 500 ? '#ffaa00' : '#ff0000'
    
    console.log(
      `%c[PERF] %c${name} %c${duration.toFixed(2)}ms`,
      'color: #00aaff; font-weight: bold;',
      'color: #fff;',
      `color: ${color}; font-weight: bold;`
    )

    if (Object.keys(metadata).length > 0) {
      console.log(`%c[PERF] %cMetadata: %c${JSON.stringify(metadata, null, 2)}`,
        'color: #00aaff; font-weight: bold;',
        'color: #fff;',
        'color: #ccc; font-size: 11px;'
      )
    }
  }

  /**
   * Log component lifecycle
   */
  logComponent(componentName, lifecycle, props = {}) {
    if (!this.isEnabled) return

    const colors = {
      mount: '#00ff00',
      unmount: '#ff0000',
      update: '#ffaa00',
      render: '#00aaff'
    }

    const color = colors[lifecycle] || '#ffffff'
    
    console.log(
      `%c[COMPONENT] %c${componentName} %c${lifecycle.toUpperCase()}`,
      'color: #00aaff; font-weight: bold;',
      'color: #fff; font-weight: bold;',
      `color: ${color}; font-weight: bold;`
    )

    if (Object.keys(props).length > 0) {
      console.log(`%c[COMPONENT] %cProps: %c${JSON.stringify(props, null, 2)}`,
        'color: #00aaff; font-weight: bold;',
        'color: #fff;',
        'color: #ccc; font-size: 11px;'
      )
    }
  }

  /**
   * Log state changes
   */
  logState(componentName, stateName, oldValue, newValue) {
    if (!this.isEnabled) return

    console.log(
      `%c[STATE] %c${componentName} %c${stateName} %c${JSON.stringify(oldValue)} %c→ %c${JSON.stringify(newValue)}`,
      'color: #00aaff; font-weight: bold;',
      'color: #fff; font-weight: bold;',
      'color: #ffaa00; font-weight: bold;',
      'color: #ff6666;',
      'color: #fff;',
      'color: #66ff66;'
    )
  }

  /**
   * Get request log
   */
  getRequestLog() {
    return [...this.requestLog]
  }

  /**
   * Get error log
   */
  getErrorLog() {
    return [...this.errorLog]
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.requestLog = []
    this.errorLog = []
    this.saveLogs()
    console.log('%c[DEBUG] %cAll logs cleared', 'color: #00aaff; font-weight: bold;', 'color: #fff;')
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.isEnabled = enabled
    console.log(`%c[DEBUG] %cLogging ${enabled ? 'enabled' : 'disabled'}`, 
      'color: #00aaff; font-weight: bold;', 
      'color: #fff;'
    )
  }

  /**
   * Get log statistics
   */
  getStats() {
    const now = Date.now()
    const lastHour = now - (60 * 60 * 1000)
    
    const recentRequests = this.requestLog.filter(req => req.timestamp > lastHour)
    const recentErrors = this.errorLog.filter(err => err.timestamp > lastHour)
    
    const successRate = this.requestLog.length > 0 
      ? (this.requestLog.filter(req => req.success).length / this.requestLog.length * 100).toFixed(1)
      : 0

    const avgResponseTime = this.requestLog.length > 0
      ? (this.requestLog.reduce((sum, req) => sum + req.responseTime, 0) / this.requestLog.length).toFixed(2)
      : 0

    return {
      totalRequests: this.requestLog.length,
      totalErrors: this.errorLog.length,
      recentRequests: recentRequests.length,
      recentErrors: recentErrors.length,
      successRate: `${successRate}%`,
      avgResponseTime: `${avgResponseTime}ms`,
      isEnabled: this.isEnabled
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs() {
    return {
      requestLog: this.requestLog,
      errorLog: this.errorLog,
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    }
  }
}

// Create singleton instance
const debugLogger = new DebugLogger()

// Export both the instance and the class
export default debugLogger
export { DebugLogger }

// Global access for debugging
if (typeof window !== 'undefined') {
  window.debugLogger = debugLogger
}
