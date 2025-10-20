import React, { useState, useEffect } from 'react'
import { Play, FolderOpen, Trash2, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { API_CONFIG } from '../config/environment'

const InstalledAppsTab = () => {
  const [apps, setApps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [installing, setInstalling] = useState(false)
  const [githubUrl, setGithubUrl] = useState('')

  useEffect(() => {
    loadInstalledApps()
  }, [])

  const loadInstalledApps = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/installer/apps`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setApps(data.apps || [])
        } else {
          setError(data.error || 'Failed to load apps')
        }
      } else {
        setError(`HTTP error! status: ${response.status}`)
      }
    } catch (err) {
      setError(`Failed to load apps: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstall = async () => {
    if (!githubUrl.trim()) return

    setInstalling(true)
    setError('')
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/installer/github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: githubUrl.trim(),
          prefer_zip: false 
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setGithubUrl('')
        loadInstalledApps() // Reload the list
      } else {
        setError(data.error || 'Installation failed')
      }
    } catch (err) {
      setError(`Installation failed: ${err.message}`)
    } finally {
      setInstalling(false)
    }
  }

  const handleLaunch = async (appId) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/installer/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // App launched successfully
        // App ${appId} launched with PID: ${data.pid}
      } else {
        setError(data.error || 'Failed to launch app')
      }
    } catch (err) {
      setError(`Launch failed: ${err.message}`)
    }
  }

  const handleUninstall = async (appId) => {
    if (!confirm(`Are you sure you want to uninstall ${appId}?`)) return

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/installer/app/${appId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        loadInstalledApps() // Reload the list
      } else {
        setError(data.error || 'Uninstall failed')
      }
    } catch (err) {
      setError(`Uninstall failed: ${err.message}`)
    }
  }

  const handleOpenFolder = (path) => {
    // Open folder in file explorer
    window.electron?.shell?.openPath?.(path) || {
      // Open folder: ${path}
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getProjectTypeIcon = (type) => {
    switch (type) {
      case 'python': return '🐍'
      case 'node': return '📦'
      case 'rust': return '🦀'
      case 'go': return '🐹'
      default: return '📁'
    }
  }

  const getProjectTypeColor = (type) => {
    switch (type) {
      case 'python': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'node': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'rust': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'go': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Installed Apps</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your installed GitHub repositories and applications
        </p>
      </div>

      {/* Install New App */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Install from GitHub</h3>
        
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleInstall}
            disabled={installing || !githubUrl.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {installing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{installing ? 'Installing...' : 'Install'}</span>
          </button>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Paste a GitHub repository URL to automatically download, install dependencies, and create a launcher.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Apps List */}
      {apps.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Installed Applications ({apps.length})
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {apps.map((app) => (
              <div
                key={app.app_id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getProjectTypeIcon(app.project_type)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {app.owner}/{app.repo}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {app.project_type} project
                      </p>
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProjectTypeColor(app.project_type)}`}>
                    {app.project_type}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Installed: {formatDate(app.installed_at)}</span>
                  </div>
                  
                  {app.launcher && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Command:</span> {app.launcher.description}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {app.launcher && (
                    <button
                      onClick={() => handleLaunch(app.app_id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex items-center justify-center space-x-1"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleOpenFolder(app.path)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleUninstall(app.app_id)}
                    className="px-3 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 text-sm rounded-md hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No apps installed
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Install your first GitHub repository using the form above.
          </p>
        </div>
      )}
    </div>
  )
}

export default InstalledAppsTab
