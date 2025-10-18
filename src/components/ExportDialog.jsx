import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  X, 
  FileText, 
  FileJson, 
  FileImage, 
  Calendar,
  Filter,
  Eye,
  CheckCircle
} from 'lucide-react'
import { exportScanResults, exportActionHistory, exportSystemMetrics } from '../utils/exportManager'
import useReducedMotion from '../hooks/useReducedMotion'

/**
 * ExportDialog - Modal for export options and preview
 * Allows users to select format, date range, and data type before export
 */
const ExportDialog = ({ 
  isOpen, 
  onClose, 
  dataType = 'scan-results', // 'scan-results', 'action-history', 'system-metrics'
  data = null,
  title = 'Export Data'
}) => {
  const [selectedFormat, setSelectedFormat] = useState('csv')
  const [dateRange, setDateRange] = useState({
    start: null,
    end: null
  })
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)
  
  const prefersReducedMotion = useReducedMotion()

  // Format options
  const formatOptions = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'Comma-separated values for Excel/Google Sheets',
      icon: FileText,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30'
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Structured data format for developers',
      icon: FileJson,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Formatted report for printing/sharing',
      icon: FileImage,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    }
  ]

  // Data type configuration
  const dataTypeConfig = {
    'scan-results': {
      title: 'Export Scan Results',
      description: 'Export file analysis and optimization recommendations',
      defaultFilename: 'optiai-scan-results',
      exportFunction: exportScanResults
    },
    'action-history': {
      title: 'Export Action History',
      description: 'Export performed actions and their results',
      defaultFilename: 'optiai-action-history',
      exportFunction: exportActionHistory
    },
    'system-metrics': {
      title: 'Export System Metrics',
      description: 'Export system performance data',
      defaultFilename: 'optiai-system-metrics',
      exportFunction: exportSystemMetrics
    }
  }

  const config = dataTypeConfig[dataType] || dataTypeConfig['scan-results']

  const containerVariants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  }

  const handleExport = async () => {
    if (!data) {
      console.error('No data to export')
      return
    }

    setIsExporting(true)
    setExportComplete(false)

    try {
      // Filter data by date range if specified
      let filteredData = data
      if (dateRange.start || dateRange.end) {
        filteredData = filterDataByDateRange(data, dateRange)
      }

      // Add metadata if requested
      const exportOptions = {
        includeMetadata,
        dateRange: dateRange.start || dateRange.end ? dateRange : null
      }

      // Call appropriate export function
      await config.exportFunction(filteredData, selectedFormat, exportOptions)
      
      setExportComplete(true)
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
        setExportComplete(false)
      }, 2000)
      
    } catch (error) {
      console.error('Export failed:', error)
      // Handle error (could show toast notification)
    } finally {
      setIsExporting(false)
    }
  }

  const filterDataByDateRange = (data, range) => {
    if (!range.start && !range.end) return data

    const startTime = range.start ? new Date(range.start).getTime() : 0
    const endTime = range.end ? new Date(range.end).getTime() : Date.now()

    if (Array.isArray(data)) {
      return data.filter(item => {
        const itemTime = new Date(item.timestamp || item.date || item.scanned_at).getTime()
        return itemTime >= startTime && itemTime <= endTime
      })
    }

    // For scan results, filter items array
    if (data.items && Array.isArray(data.items)) {
      return {
        ...data,
        items: data.items.filter(item => {
          const itemTime = new Date(item.lastModified || item.timestamp).getTime()
          return itemTime >= startTime && itemTime <= endTime
        })
      }
    }

    return data
  }

  const getPreviewData = () => {
    if (!data) return null

    const filteredData = filterDataByDateRange(data, dateRange)
    
    if (Array.isArray(filteredData)) {
      return filteredData.slice(0, 5) // Show first 5 items
    }

    if (filteredData.items && Array.isArray(filteredData.items)) {
      return filteredData.items.slice(0, 5)
    }

    return filteredData
  }

  const previewData = getPreviewData()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
            className="bg-dark-card/90 backdrop-blur-xl border border-dark-border rounded-xl shadow-glass w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
                  <Download className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-space text-dark-text">
                    {config.title}
                  </h2>
                  <p className="text-dark-muted text-sm">
                    {config.description}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-dark-muted hover:bg-dark-surface/50 hover:text-dark-text transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Format Selection */}
              <div>
                <h3 className="text-lg font-semibold text-dark-text mb-3">Export Format</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {formatOptions.map((format) => {
                    const Icon = format.icon
                    const isSelected = selectedFormat === format.id
                    
                    return (
                      <motion.button
                        key={format.id}
                        whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
                        whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                        onClick={() => setSelectedFormat(format.id)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          isSelected
                            ? `${format.borderColor} ${format.bgColor}`
                            : 'border-dark-border hover:border-dark-border/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`w-5 h-5 ${isSelected ? format.color : 'text-dark-muted'}`} />
                          <span className={`font-medium ${isSelected ? format.color : 'text-dark-text'}`}>
                            {format.name}
                          </span>
                        </div>
                        <p className="text-sm text-dark-muted">
                          {format.description}
                        </p>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <h3 className="text-lg font-semibold text-dark-text mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Date Range (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-muted mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.start || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-muted mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.end || ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div>
                <h3 className="text-lg font-semibold text-dark-text mb-3">Export Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={includeMetadata}
                      onChange={(e) => setIncludeMetadata(e.target.checked)}
                      className="w-4 h-4 text-neon-cyan bg-dark-surface border-dark-border rounded focus:ring-neon-cyan/50"
                    />
                    <span className="text-dark-text">Include metadata and timestamps</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              {showPreview && previewData && (
                <div>
                  <h3 className="text-lg font-semibold text-dark-text mb-3 flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Preview ({previewData.length} items)
                  </h3>
                  <div className="bg-dark-surface/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-dark-muted font-mono">
                      {JSON.stringify(previewData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-dark-border bg-dark-surface/20">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-2 text-dark-muted hover:text-dark-text transition-colors duration-200"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-dark-muted hover:text-dark-text transition-colors duration-200"
                >
                  Cancel
                </button>
                
                <motion.button
                  whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
                  whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
                  onClick={handleExport}
                  disabled={isExporting || !data}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                    exportComplete
                      ? 'bg-green-500 text-white'
                      : isExporting
                      ? 'bg-dark-surface text-dark-muted cursor-not-allowed'
                      : 'bg-neon-cyan text-dark-bg hover:shadow-neon-cyan'
                  }`}
                >
                  {exportComplete ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Exported!
                    </>
                  ) : isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-dark-muted border-t-transparent rounded-full animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export {selectedFormat.toUpperCase()}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ExportDialog
