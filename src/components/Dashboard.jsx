import React, { useState, useEffect } from 'react'
import SystemMetrics from './SystemMetrics'
import TreemapWithBreadcrumb from './TreemapWithBreadcrumb'
import FileList from './FileList'
import EmptyState from './EmptyState'
import LoadingSpinner from './LoadingSpinner'
import AIStatusIndicator from './AIStatusIndicator'

/**
 * Simplified Dashboard Component
 * Pure content display without internal navigation
 * Navigation is handled at App level
 */
const Dashboard = ({ systemInfo, onStartScan, onShowToast }) => {
  const [scanResults, setScanResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState(new Set())

  useEffect(() => {
    loadLatestScanResults()
  }, [])

  const loadLatestScanResults = async () => {
    try {
      setIsLoading(true)
      // Simulate loading - in real app, fetch from backend
      // For now, we'll keep it null to show empty state
      setScanResults(null)
    } catch (error) {
      console.error('Failed to load scan results:', error)
      if (onShowToast) {
        onShowToast('Failed to load scan results', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (filePath, selected) => {
    const newSelected = new Set(selectedFiles)
    if (selected) {
      newSelected.add(filePath)
    } else {
      newSelected.delete(filePath)
    }
    setSelectedFiles(newSelected)
  }

  const handleStartScan = () => {
    if (onStartScan) {
      onStartScan()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Status */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark-text font-space">System Dashboard</h1>
          <p className="text-dark-muted">Monitor and optimize your system performance</p>
        </div>
        <AIStatusIndicator />
      </div>

      {/* System Metrics - Always visible */}
      {systemInfo && <SystemMetrics metrics={systemInfo} />}

      {/* Main Content Area */}
      {scanResults ? (
        <div className="space-y-6">
          {/* Disk Usage Visualization */}
          <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border rounded-xl p-6 shadow-glass">
            <h3 className="text-lg font-semibold text-dark-text mb-4 font-space">
              Disk Usage Analysis
            </h3>
            <TreemapWithBreadcrumb data={scanResults?.items || []} />
          </div>

          {/* File List */}
          <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border rounded-xl p-6 shadow-glass">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-dark-text font-space">
                Files ({scanResults?.items?.length || 0})
              </h3>
              {selectedFiles.size > 0 && (
                <span className="text-sm text-dark-muted">
                  {selectedFiles.size} selected
                </span>
              )}
            </div>
            <FileList
              files={scanResults?.items || []}
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
            />
          </div>
        </div>
      ) : (
        /* Enhanced Empty State */
        <EmptyState type="scan" onAction={handleStartScan} />
      )}
    </div>
  )
}

export default Dashboard
