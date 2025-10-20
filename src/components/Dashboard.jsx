import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import SystemMetrics from './SystemMetrics'
import TreemapWithBreadcrumb from './TreemapWithBreadcrumb'
import FileList from './FileList'
import EmptyState from './EmptyState'
import LoadingSpinner from './LoadingSpinner'
import AIStatusIndicator from './AIStatusIndicator'
import useCachedApi from '../hooks/useCachedApi'
import { API_CONFIG } from '../config/environment'

/**
 * Simplified Dashboard Component
 * Pure content display without internal navigation
 * Navigation is handled at App level
 */
const Dashboard = ({ systemInfo, onStartScan, onShowToast }) => {
  const [scanResults, setScanResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState(new Set())

  // Load real-time metrics from API
  const { 
    data: metricsData, 
    loading: metricsLoading, 
    error: metricsError 
  } = useCachedApi(`${API_CONFIG.BASE_URL}/api/metrics`, {
    endpoint: 'dashboard-metrics',
    backgroundRefresh: true,
    deduplicate: true
  })

  useEffect(() => {
    loadLatestScanResults()
  }, [])

  const loadLatestScanResults = async () => {
    try {
      setIsLoading(true)
      console.log('Dashboard: Loading latest scan results...')
      
      // Load real scan results from backend
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/scan/latest`)
      console.log('Dashboard: Scan latest response:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dashboard: Scan data received:', data)
        
        // Extract result object if it's nested
        const scanData = data.result || data
        
        // Ensure items array exists for treemap
        if (!scanData.items) {
          scanData.items = []
        }
        
        setScanResults(scanData)
      } else if (response.status === 404) {
        console.log('Dashboard: No scan results available yet - showing empty state')
        // 404 is expected when no scans have been run yet
        setScanResults(null)
      } else {
        console.log('Dashboard: Error loading scan results:', response.status)
        setScanResults(null)
        if (onShowToast) {
          onShowToast('Failed to load scan results', 'error')
        }
      }
    } catch (error) {
      console.error('Dashboard: Failed to load scan results:', error)
      // Show empty state on error
      setScanResults(null)
      // Only show error toast for network errors, not 404s
      if (error.name !== 'TypeError' && onShowToast) {
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

  const handleRefreshScanResults = () => {
    loadLatestScanResults()
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
        <div className="flex items-center gap-3">
          {scanResults && (
            <button
              onClick={handleRefreshScanResults}
              className="flex items-center gap-2 px-3 py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan rounded-lg transition-colors"
              title="Refresh scan results"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          )}
          <AIStatusIndicator />
        </div>
      </div>

      {/* System Metrics - Always visible */}
      {metricsData && <SystemMetrics metrics={metricsData} />}

      {/* Main Content Area */}
      {scanResults ? (
        <div className="space-y-6">
          {/* Disk Usage Visualization */}
          <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border rounded-xl p-6 shadow-glass">
            <h3 className="text-lg font-semibold text-dark-text mb-4 font-space">
              Disk Usage Analysis
            </h3>
            <TreemapWithBreadcrumb data={scanResults?.items || scanResults?.large_files || []} />
          </div>

          {/* File List */}
          <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border rounded-xl p-6 shadow-glass">
            <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-dark-text font-space">
              Files ({scanResults?.summary?.total_items || scanResults?.items?.length || 0})
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
