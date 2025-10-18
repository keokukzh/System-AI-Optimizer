import React, { useState, useEffect } from 'react'
import { Play, Square, RefreshCw, HardDrive, FileText, AlertCircle, Plus, X } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'
import ConfirmationDialog from './ConfirmationDialog'
import { validateScanPath } from '../utils/validation'

const ScanPanel = ({ onComplete, onError, onCancel }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatus, setScanStatus] = useState('idle')
  const [scanId, setScanId] = useState(null)
  const [scanResults, setScanResults] = useState(null)
  const [scanPaths, setScanPaths] = useState(['C:\\Users'])
  const [maxWorkers, setMaxWorkers] = useState(4)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [newPath, setNewPath] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const validatePaths = () => {
    const errors = {};
    let isValid = true;

    scanPaths.forEach((path, index) => {
      const validation = validateScanPath(path);
      if (!validation.isValid) {
        errors[index] = validation.errors[0];
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const addPath = () => {
    if (!newPath.trim()) return;

    const validation = validateScanPath(newPath);
    if (!validation.isValid) {
      setValidationErrors({ newPath: validation.errors[0] });
      return;
    }

    if (scanPaths.includes(newPath)) {
      setValidationErrors({ newPath: 'Path already exists in scan list' });
      return;
    }

    setScanPaths([...scanPaths, newPath]);
    setNewPath('');
    setValidationErrors({});
  };

  const removePath = (index) => {
    if (scanPaths.length <= 1) {
      setValidationErrors({ general: 'At least one scan path is required' });
      return;
    }

    setScanPaths(scanPaths.filter((_, i) => i !== index));
    setValidationErrors({});
  };

  const startScan = async () => {
    if (!validatePaths()) {
      setError('Please fix validation errors before starting scan');
      return;
    }

    try {
      setIsScanning(true)
      setScanProgress(0)
      setScanStatus('starting')
      setError(null)

      const response = await fetch('http://127.0.0.1:5174/api/scan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          paths: scanPaths,
          max_workers: maxWorkers
        })
      })

      if (response.ok) {
        const data = await response.json()
        setScanId(data.scan_id)
        setScanStatus('scanning')
        
        // Start polling for progress
        pollScanProgress(data.scan_id)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`HTTP ${response.status}: ${errorData.detail || response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to start scan:', error)
      setError(error.message)
      setIsScanning(false)
      setScanStatus('failed')
    }
  }

  const pollScanProgress = async (scanId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://127.0.0.1:5174/api/scan/${scanId}/status`)
        if (response.ok) {
          const data = await response.json()
          
          setScanProgress(data.progress || 0)
          setScanStatus(data.status)

          if (data.status === 'completed') {
            clearInterval(pollInterval)
            setIsScanning(false)
            setScanResults(data.result)
            onComplete(scanId)
          } else if (data.status === 'failed') {
            clearInterval(pollInterval)
            setIsScanning(false)
            setError(data.error || 'Scan failed')
            onError(data.error || 'Scan failed')
          }
        }
      } catch (error) {
        console.error('Failed to poll scan progress:', error)
        clearInterval(pollInterval)
        setIsScanning(false)
        setError('Failed to check scan progress')
      }
    }, 1000) // Poll every second
  }

  const stopScan = () => {
    setIsScanning(false)
    setScanStatus('stopped')
    setScanProgress(0)
  }

  const resetScan = () => {
    setIsScanning(false)
    setScanProgress(0)
    setScanStatus('idle')
    setScanId(null)
    setScanResults(null)
    setError(null)
  }

  const getStatusIcon = () => {
    switch (scanStatus) {
      case 'scanning':
        return <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
      case 'completed':
        return <HardDrive className="w-5 h-5 text-success-600" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-danger-600" />
      default:
        return <Play className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = () => {
    switch (scanStatus) {
      case 'starting':
        return 'Starting scan...'
      case 'scanning':
        return 'Scanning system...'
      case 'completed':
        return 'Scan completed successfully'
      case 'failed':
        return 'Scan failed'
      case 'stopped':
        return 'Scan stopped'
      default:
        return 'Ready to scan'
    }
  }

  const getStatusColor = () => {
    switch (scanStatus) {
      case 'scanning':
        return 'text-primary-600'
      case 'completed':
        return 'text-success-600'
      case 'failed':
        return 'text-danger-600'
      case 'stopped':
        return 'text-warning-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Scan</h2>
          <p className="text-gray-600">Analyze your system for optimization opportunities</p>
        </div>
        <button
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Scan Configuration */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan Paths
            </label>
            
            {/* Error display */}
            {validationErrors.general && (
              <ErrorMessage 
                error={{ message: validationErrors.general }}
                type="error"
                className="mb-3"
              />
            )}
            
            <div className="space-y-2">
              {scanPaths.map((path, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={path}
                      onChange={(e) => {
                        const newPaths = [...scanPaths]
                        newPaths[index] = e.target.value
                        setScanPaths(newPaths)
                        // Clear validation error for this path
                        if (validationErrors[index]) {
                          const newErrors = { ...validationErrors }
                          delete newErrors[index]
                          setValidationErrors(newErrors)
                        }
                      }}
                      className={`input flex-1 ${validationErrors[index] ? 'border-red-500' : ''}`}
                      placeholder="Enter path to scan"
                    />
                    {scanPaths.length > 1 && (
                      <button
                        onClick={() => {
                          setConfirmAction(() => () => removePath(index));
                          setShowConfirmDialog(true);
                        }}
                        className="btn btn-danger text-sm p-2"
                        title="Remove path"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {validationErrors[index] && (
                    <p className="text-sm text-red-600">{validationErrors[index]}</p>
                  )}
                </div>
              ))}
              
              {/* Add new path */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newPath}
                    onChange={(e) => {
                      setNewPath(e.target.value);
                      if (validationErrors.newPath) {
                        const newErrors = { ...validationErrors };
                        delete newErrors.newPath;
                        setValidationErrors(newErrors);
                      }
                    }}
                    className={`input flex-1 ${validationErrors.newPath ? 'border-red-500' : ''}`}
                    placeholder="Add new scan path"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addPath();
                      }
                    }}
                  />
                  <button
                    onClick={addPath}
                    className="btn btn-primary text-sm p-2"
                    title="Add path"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {validationErrors.newPath && (
                  <p className="text-sm text-red-600">{validationErrors.newPath}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Workers
            </label>
            <select
              value={maxWorkers}
              onChange={(e) => setMaxWorkers(parseInt(e.target.value))}
              className="input"
            >
              <option value={1}>1 Worker</option>
              <option value={2}>2 Workers</option>
              <option value={4}>4 Workers</option>
              <option value={8}>8 Workers</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              More workers = faster scan, but higher CPU usage
            </p>
          </div>
        </div>
      </div>

      {/* Scan Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Scan Status</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {isScanning && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-danger-600 mr-2" />
              <span className="text-danger-800">{error}</span>
            </div>
          </div>
        )}

        {/* Scan Results Summary */}
        {scanResults && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">
                {scanResults.total_files?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">Files Found</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-success-600">
                {scanResults.total_directories?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">Directories</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-warning-600">
                {scanResults.total_size ? 
                  `${(scanResults.total_size / (1024**3)).toFixed(1)} GB` : 
                  '0 GB'
                }
              </div>
              <div className="text-sm text-gray-500">Total Size</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!isScanning ? (
            <button
              onClick={startScan}
              disabled={scanPaths.some(path => !path.trim())}
              className="btn btn-primary disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Scan
            </button>
          ) : (
            <button
              onClick={stopScan}
              className="btn btn-warning"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Scan
            </button>
          )}
          
          {scanStatus === 'completed' && (
            <button
              onClick={resetScan}
              className="btn btn-secondary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              New Scan
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setScanPaths(['/tmp', '/var/tmp', '/var/log'])}
            className="btn btn-secondary text-left"
          >
            <FileText className="w-5 h-5 mr-2" />
            Scan Temp Files
          </button>
          <button
            onClick={() => setScanPaths(['/home'])}
            className="btn btn-secondary text-left"
          >
            <HardDrive className="w-5 h-5 mr-2" />
            Scan Home Directory
          </button>
          <button
            onClick={() => setScanPaths(['/'])}
            className="btn btn-secondary text-left"
          >
            <HardDrive className="w-5 h-5 mr-2" />
            Full System Scan
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Scan Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Start with specific directories like /tmp or /var/log for quick results</li>
          <li>• Full system scans may take several minutes depending on disk size</li>
          <li>• More workers will speed up the scan but use more CPU</li>
          <li>• The scan will automatically detect large files, duplicates, and temp files</li>
        </ul>
      </div>
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
        }}
        title="Remove Scan Path"
        message="Are you sure you want to remove this scan path? This action cannot be undone."
        type="warning"
        confirmText="Remove"
        cancelText="Cancel"
        destructive={true}
      />
    </div>
  )
}

export default ScanPanel
