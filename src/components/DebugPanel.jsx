import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Trash2, 
  Activity,
  Server,
  Database,
  Wifi,
  AlertTriangle,
  Info
} from 'lucide-react'
import connectionValidator from '../utils/connectionValidator'
import apiCache from '../utils/apiCache'
import { API_CONFIG } from '../config/environment'

const DebugPanel = ({ isOpen, onClose }) => {
  const [validationResults, setValidationResults] = useState(null)
  const [isValidating, setIsValidating] = useState(false)
  const [cacheStats, setCacheStats] = useState(null)
  const [requestLog, setRequestLog] = useState([])
  const [errorLog, setErrorLog] = useState([])

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadCacheStats()
      loadRequestLog()
      loadErrorLog()
    }
  }, [isOpen])

  const loadCacheStats = () => {
    const stats = apiCache.getStats()
    setCacheStats(stats)
  }

  const loadRequestLog = () => {
    // Get last 20 requests from console (simplified)
    const log = JSON.parse(localStorage.getItem('debug_request_log') || '[]')
    setRequestLog(log.slice(-20))
  }

  const loadErrorLog = () => {
    // Get last 20 errors from console (simplified)
    const log = JSON.parse(localStorage.getItem('debug_error_log') || '[]')
    setErrorLog(log.slice(-20))
  }

  const runValidation = async () => {
    setIsValidating(true)
    try {
      const results = await connectionValidator.validate()
      setValidationResults(results)
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setIsValidating(false)
    }
  }

  const clearCache = () => {
    apiCache.clear()
    loadCacheStats()
  }

  const clearLogs = () => {
    localStorage.removeItem('debug_request_log')
    localStorage.removeItem('debug_error_log')
    setRequestLog([])
    setErrorLog([])
  }

  const clearBrowserCache = () => {
    const success = connectionValidator.clearCache()
    if (success) {
      // Reload page to clear all caches
      window.location.reload()
    }
  }

  const getStatusIcon = (success) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const getStatusColor = (success) => {
    return success ? 'text-green-500' : 'text-red-500'
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-dark-card border border-dark-border rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <Bug className="w-6 h-6 text-neon-cyan" />
            <h2 className="text-xl font-bold text-dark-text">Debug Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-surface rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-dark-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Connection Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark-text flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Connection Status
                </h3>
                <button
                  onClick={runValidation}
                  disabled={isValidating}
                  className="flex items-center gap-2 px-3 py-2 bg-neon-cyan/10 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 border border-neon-cyan/30 transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
                  {isValidating ? 'Testing...' : 'Test Connection'}
                </button>
              </div>

              <div className="bg-dark-surface/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-dark-muted">Backend URL:</span>
                  <code className="text-neon-cyan text-sm">{API_CONFIG.BASE_URL}</code>
                </div>
                
                {validationResults && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-dark-muted">Backend Status:</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(validationResults.backend?.connected)}
                        <span className={getStatusColor(validationResults.backend?.connected)}>
                          {validationResults.backend?.connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                    
                    {validationResults.backend?.connected && (
                      <div className="flex items-center justify-between">
                        <span className="text-dark-muted">Response Time:</span>
                        <span className="text-dark-text">{validationResults.backend.responseTime}ms</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* API Endpoints */}
              {validationResults && (
                <div className="space-y-2">
                  <h4 className="text-md font-medium text-dark-text">API Endpoints</h4>
                  <div className="space-y-2">
                    {Object.entries(validationResults.endpoints).map(([path, result]) => (
                      <div key={path} className="flex items-center justify-between bg-dark-surface/30 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.success)}
                          <div>
                            <div className="text-sm font-medium text-dark-text">{result.name}</div>
                            <div className="text-xs text-dark-muted">{path}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-dark-text">{result.responseTime}ms</div>
                          {result.error && (
                            <div className="text-xs text-red-500">{result.error}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cache & Performance */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-dark-text flex items-center gap-2">
                <Database className="w-5 h-5" />
                Cache & Performance
              </h3>

              {cacheStats && (
                <div className="bg-dark-surface/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-dark-muted">Total Entries:</span>
                    <span className="text-dark-text">{cacheStats.totalEntries}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-muted">Valid Entries:</span>
                    <span className="text-green-500">{cacheStats.validEntries}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-muted">Expired Entries:</span>
                    <span className="text-red-500">{cacheStats.expiredEntries}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-dark-muted">Memory Usage:</span>
                    <span className="text-dark-text">{(cacheStats.memoryUsage / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              )}

              {/* Cache Actions */}
              <div className="space-y-2">
                <button
                  onClick={clearCache}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 border border-red-500/30 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear API Cache
                </button>
                <button
                  onClick={clearBrowserCache}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500/20 border border-orange-500/30 transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Browser Cache & Reload
                </button>
              </div>

              {/* Request Log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-dark-text">Recent Requests</h4>
                  <button
                    onClick={clearLogs}
                    className="text-xs text-dark-muted hover:text-dark-text"
                  >
                    Clear Logs
                  </button>
                </div>
                <div className="bg-dark-surface/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {requestLog.length > 0 ? (
                    <div className="space-y-1">
                      {requestLog.map((req, index) => (
                        <div key={index} className="text-xs text-dark-muted">
                          <span className="text-neon-cyan">{req.method}</span> {req.url} - {req.status}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-dark-muted">No requests logged</div>
                  )}
                </div>
              </div>

              {/* Error Log */}
              <div className="space-y-2">
                <h4 className="text-md font-medium text-dark-text">Recent Errors</h4>
                <div className="bg-dark-surface/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {errorLog.length > 0 ? (
                    <div className="space-y-1">
                      {errorLog.map((error, index) => (
                        <div key={index} className="text-xs text-red-500">
                          {error.message}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-dark-muted">No errors logged</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {validationResults?.errors && validationResults.errors.length > 0 && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h4 className="text-md font-medium text-red-500">Validation Errors</h4>
              </div>
              <div className="space-y-1">
                {validationResults.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-400">{error}</div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Summary */}
          {validationResults?.performance && (
            <div className="mt-6 p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-neon-cyan" />
                <h4 className="text-md font-medium text-neon-cyan">Performance Summary</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-dark-muted">Total Time</div>
                  <div className="text-dark-text font-medium">{validationResults.performance.totalTime}ms</div>
                </div>
                <div>
                  <div className="text-dark-muted">Endpoints Tested</div>
                  <div className="text-dark-text font-medium">{validationResults.performance.endpointCount}</div>
                </div>
                <div>
                  <div className="text-dark-muted">Successful</div>
                  <div className="text-green-500 font-medium">{validationResults.performance.successCount}</div>
                </div>
                <div>
                  <div className="text-dark-muted">Critical Failures</div>
                  <div className="text-red-500 font-medium">{validationResults.performance.criticalFailures}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default DebugPanel
