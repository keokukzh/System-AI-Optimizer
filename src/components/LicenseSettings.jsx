import React, { useState, useEffect } from 'react'
import { Shield, Key, CheckCircle, XCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react'

const LicenseSettings = () => {
  const [licenseStatus, setLicenseStatus] = useState(null)
  const [licenseInfo, setLicenseInfo] = useState(null)
  const [licenseKey, setLicenseKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadLicenseStatus()
    loadLicenseInfo()
  }, [])

  const loadLicenseStatus = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5174/api/license/status')
      if (response.ok) {
        const data = await response.json()
        setLicenseStatus(data)
      }
    } catch (error) {
      console.error('Failed to load license status:', error)
    }
  }

  const loadLicenseInfo = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5174/api/license/info')
      if (response.ok) {
        const data = await response.json()
        setLicenseInfo(data)
      }
    } catch (error) {
      console.error('Failed to load license info:', error)
    }
  }

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter a license key' })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:5174/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: licenseKey })
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        setLicenseKey('')
        loadLicenseStatus()
        loadLicenseInfo()
      } else {
        setMessage({ type: 'error', text: data.detail || 'Activation failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to activate license' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivateLicense = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://127.0.0.1:5174/api/license/deactivate', {
        method: 'POST'
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        loadLicenseStatus()
        loadLicenseInfo()
      } else {
        setMessage({ type: 'error', text: data.detail || 'Deactivation failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to deactivate license' })
    } finally {
      setIsLoading(false)
    }
  }

  const copyDeviceId = () => {
    if (licenseInfo?.device_id) {
      navigator.clipboard.writeText(licenseInfo.device_id)
      setMessage({ type: 'success', text: 'Device ID copied to clipboard' })
    }
  }

  const getFeatureStatus = (feature) => {
    return licenseStatus?.features?.[feature] ? 'enabled' : 'disabled'
  }

  const getFeatureIcon = (feature) => {
    const status = getFeatureStatus(feature)
    return status === 'enabled' ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-gray-400" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">License & Settings</h2>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          {message.type === 'success' ? 
            <CheckCircle className="w-5 h-5" /> : 
            <AlertCircle className="w-5 h-5" />
          }
          <span>{message.text}</span>
        </div>
      )}

      {/* License Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">License Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                licenseStatus?.license_type === 'pro'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {licenseStatus?.license_type?.toUpperCase() || 'FREE'}
              </div>
              {licenseStatus?.activated ? 
                <CheckCircle className="w-5 h-5 text-green-500" /> : 
                <XCircle className="w-5 h-5 text-gray-400" />
              }
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Device ID:</strong> {licenseInfo?.device_id || 'Loading...'}</p>
              {licenseStatus?.activation_date && (
                <p><strong>Activated:</strong> {new Date(licenseStatus.activation_date).toLocaleDateString()}</p>
              )}
              {licenseStatus?.expiry_date && (
                <p><strong>Expires:</strong> {new Date(licenseStatus.expiry_date).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={copyDeviceId}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Device ID
            </button>
          </div>
        </div>
      </div>

      {/* License Activation */}
      {!licenseStatus?.activated && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activate License</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                License Key
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="OPTIAI-XXXX-XXXX-XXXX-XXXX"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleActivateLicense}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Key className="w-4 h-4" />
                {isLoading ? 'Activating...' : 'Activate License'}
              </button>
              
              <button
                onClick={() => window.open('https://optiai.com/purchase', '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Purchase License
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'basic_scan', label: 'Basic System Scan', description: 'Scan files and directories' },
            { key: 'ai_suggestions', label: 'AI Suggestions', description: 'AI-powered optimization recommendations' },
            { key: 'file_management', label: 'File Management', description: 'Move, delete, and organize files' },
            { key: 'advanced_optimization', label: 'Advanced Optimization', description: 'Advanced system optimization tools' },
            { key: 'batch_operations', label: 'Batch Operations', description: 'Process multiple files at once' },
            { key: 'priority_support', label: 'Priority Support', description: 'Priority customer support' }
          ].map((feature) => (
            <div key={feature.key} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {getFeatureIcon(feature.key)}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{feature.label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Statistics */}
      {licenseInfo?.usage_stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Usage Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {licenseInfo.usage_stats.scans_performed || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Scans Performed</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {licenseInfo.usage_stats.files_optimized || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Files Optimized</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {licenseInfo.usage_stats.last_scan ? 
                  new Date(licenseInfo.usage_stats.last_scan).toLocaleDateString() : 
                  'Never'
                }
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Scan</p>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate License */}
      {licenseStatus?.activated && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">License Management</h3>
          
          <button
            onClick={handleDeactivateLicense}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Deactivating...' : 'Deactivate License'}
          </button>
        </div>
      )}
    </div>
  )
}

export default LicenseSettings
