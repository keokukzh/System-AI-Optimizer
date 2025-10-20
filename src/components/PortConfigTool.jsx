import React, { useState, useEffect } from 'react'
import { Settings, TestTube, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { API_CONFIG, updateBackendPort } from '../config/environment'

const PortConfigTool = () => {
  const [currentPort, setCurrentPort] = useState(API_CONFIG.BACKEND_PORT)
  const [newPort, setNewPort] = useState(API_CONFIG.BACKEND_PORT)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setCurrentPort(API_CONFIG.BACKEND_PORT)
    setNewPort(API_CONFIG.BACKEND_PORT)
  }, [])

  const testConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const testUrl = `http://127.0.0.1:${newPort}/api/ai/status`
      const response = await fetch(testUrl, {
        method: 'GET',
        timeout: 5000
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult({
          success: true,
          message: `Connection successful! Backend is running on port ${newPort}`,
          data: data
        })
      } else {
        setTestResult({
          success: false,
          message: `Connection failed: HTTP ${response.status} - ${response.statusText}`
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection failed: ${error.message}`
      })
    } finally {
      setIsTesting(false)
    }
  }

  const saveConfiguration = async () => {
    if (newPort === currentPort) {
      return
    }

    setIsSaving(true)
    try {
      // Update the port in the configuration
      updateBackendPort(newPort)
      setCurrentPort(newPort)
      
      // Test the new connection
      await testConnection()
      
      setTestResult({
        success: true,
        message: `Port updated to ${newPort} and connection verified!`
      })
    } catch (error) {
      setTestResult({
        success: false,
        message: `Failed to update port: ${error.message}`
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetToDefault = () => {
    setNewPort(8080)
    setTestResult(null)
  }

  const getTestResultIcon = () => {
    if (!testResult) return null
    
    if (testResult.success) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getTestResultColor = () => {
    if (!testResult) return 'text-gray-400'
    return testResult.success ? 'text-green-400' : 'text-red-400'
  }

  return (
    <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-dark-text">Backend Configuration</h3>
      </div>

      <div className="space-y-6">
        {/* Current Configuration */}
        <div>
          <label className="block text-sm font-medium text-dark-muted mb-2">
            Current Backend Port
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={currentPort}
              disabled
              className="flex-1 px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text disabled:opacity-50"
            />
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle className="w-4 h-4" />
              Active
            </div>
          </div>
        </div>

        {/* New Configuration */}
        <div>
          <label className="block text-sm font-medium text-dark-muted mb-2">
            New Backend Port
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={newPort}
              onChange={(e) => setNewPort(parseInt(e.target.value) || 8080)}
              min="1024"
              max="65535"
              className="flex-1 px-3 py-2 bg-dark-surface border border-dark-border rounded-lg text-dark-text focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
              placeholder="8080"
            />
            <button
              onClick={resetToDefault}
              className="px-3 py-2 bg-dark-surface/50 text-dark-muted rounded-lg hover:bg-dark-surface border border-dark-border transition-colors"
            >
              Reset
            </button>
          </div>
          <p className="text-xs text-dark-muted mt-1">
            Port range: 1024-65535 (default: 8080)
          </p>
        </div>

        {/* Test Connection */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={testConnection}
              disabled={isTesting || newPort === currentPort}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 border border-blue-500/30 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            
            {newPort !== currentPort && (
              <button
                onClick={saveConfiguration}
                disabled={isSaving || !testResult?.success}
                className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 border border-green-500/30 transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save & Apply'}
              </button>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg border ${
              testResult.success 
                ? 'bg-green-900/20 border-green-500/30' 
                : 'bg-red-900/20 border-red-500/30'
            }`}>
              <div className="flex items-start gap-2">
                {getTestResultIcon()}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${getTestResultColor()}`}>
                    {testResult.message}
                  </p>
                  {testResult.data && (
                    <div className="mt-2 text-xs text-dark-muted">
                      <pre className="bg-dark-surface/50 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(testResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-400">
              <p className="font-medium mb-1">Configuration Help</p>
              <ul className="text-xs space-y-1 text-blue-300">
                <li>• Make sure the backend server is running on the specified port</li>
                <li>• Test the connection before saving to avoid breaking the app</li>
                <li>• Changes take effect immediately after saving</li>
                <li>• Default port 8080 is recommended for production</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortConfigTool
