import React, { useState, useEffect } from 'react'
import { Trash2, RotateCcw, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

const QuarantineTab = ({ onShowToast }) => {
  const [quarantineFiles, setQuarantineFiles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRestoring, setIsRestoring] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)

  useEffect(() => {
    loadQuarantineFiles()
  }, [])

  const loadQuarantineFiles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://127.0.0.1:5175/api/quarantine/list')
      
      if (response.ok) {
        const data = await response.json()
        setQuarantineFiles(data.quarantine_files || [])
      } else {
        onShowToast('Failed to load quarantine files', 'error')
      }
    } catch (error) {
      console.error('Failed to load quarantine files:', error)
      onShowToast('Failed to load quarantine files', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async (filePath) => {
    try {
      setIsRestoring(true)
      
      const response = await fetch('http://127.0.0.1:5175/api/quarantine/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath })
      })

      const result = await response.json()
      
      if (result.success) {
        onShowToast('File restored successfully', 'success')
        loadQuarantineFiles() // Refresh the list
      } else {
        onShowToast(`Failed to restore file: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Failed to restore file:', error)
      onShowToast('Failed to restore file', 'error')
    } finally {
      setIsRestoring(false)
    }
  }

  const handleCleanup = async () => {
    try {
      setIsCleaning(true)
      
      const response = await fetch('http://127.0.0.1:5175/api/quarantine/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()
      
      if (result.success) {
        onShowToast(`Cleaned up ${result.deleted_count} expired files`, 'success')
        loadQuarantineFiles() // Refresh the list
      } else {
        onShowToast(`Failed to cleanup: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Failed to cleanup quarantine:', error)
      onShowToast('Failed to cleanup quarantine', 'error')
    } finally {
      setIsCleaning(false)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getTimeUntilExpiry = (expiresAt) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry - now
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin mx-auto mb-4" />
          <p className="text-dark-muted">Loading quarantine files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dark-text font-space">Quarantine</h2>
          <p className="text-dark-muted">Manage quarantined files and restore deleted items</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadQuarantineFiles}
            className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleCleanup}
            disabled={isCleaning}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isCleaning ? 'Cleaning...' : 'Cleanup Expired'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-neon-cyan" />
            <div>
              <p className="text-2xl font-bold text-dark-text">{quarantineFiles.length}</p>
              <p className="text-sm text-dark-muted">Total Files</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-dark-text">
                {quarantineFiles.filter(f => f.is_expired).length}
              </p>
              <p className="text-sm text-dark-muted">Expired Files</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-dark-text">
                {quarantineFiles.filter(f => !f.is_expired).length}
              </p>
              <p className="text-sm text-dark-muted">Active Files</p>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-dark-text mb-4 font-space">
          Quarantined Files
        </h3>
        
        {quarantineFiles.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="w-16 h-16 text-dark-muted mx-auto mb-4" />
            <p className="text-dark-muted text-lg">No files in quarantine</p>
            <p className="text-dark-muted text-sm">Deleted files will appear here for 7 days</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quarantineFiles.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  file.is_expired 
                    ? 'bg-red-500/5 border-red-500/20' 
                    : 'bg-dark-card/40 border-dark-border'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    file.is_expired ? 'bg-red-500/10' : 'bg-neon-cyan/10'
                  }`}>
                    <Trash2 className={`w-5 h-5 ${
                      file.is_expired ? 'text-red-400' : 'text-neon-cyan'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-dark-text">{file.file_name}</p>
                    <p className="text-sm text-dark-muted">{file.file_path}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-dark-muted">
                        {formatBytes(file.size)}
                      </span>
                      <span className="text-xs text-dark-muted">
                        Quarantined: {formatDate(file.quarantined_at)}
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${
                        file.is_expired ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {file.is_expired ? 'Expired' : getTimeUntilExpiry(file.expires_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!file.is_expired && (
                    <button
                      onClick={() => handleRestore(file.file_path)}
                      disabled={isRestoring}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuarantineTab
