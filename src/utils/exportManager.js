/**
 * Export Manager - Handles data export in multiple formats (CSV, JSON, PDF)
 * Generates scan reports, exports action history, and system metrics
 */

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Column definitions with key, label, formatter
 * @returns {string} - CSV string
 */
export const exportToCSV = (data, columns) => {
  if (!data || data.length === 0) {
    return ''
  }

  // Create header row
  const headers = columns.map(col => `"${col.label}"`).join(',')
  
  // Create data rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key]
      
      // Apply formatter if provided
      if (col.formatter && typeof col.formatter === 'function') {
        value = col.formatter(value, item)
      }
      
      // Handle null/undefined values
      if (value === null || value === undefined) {
        value = ''
      }
      
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  })
  
  return [headers, ...rows].join('\n')
}

/**
 * Convert data to JSON format
 * @param {any} data - Data to export
 * @param {Object} options - Export options
 * @returns {string} - JSON string
 */
export const exportToJSON = (data, options = {}) => {
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    data,
    metadata: {
      totalItems: Array.isArray(data) ? data.length : 1,
      exportType: options.type || 'data',
      ...options.metadata
    }
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Generate PDF report (simplified - in real app would use jsPDF or similar)
 * @param {Object} reportData - Report data
 * @param {Object} options - PDF options
 * @returns {string} - HTML string that can be printed to PDF
 */
export const generatePDFReport = (reportData, options = {}) => {
  const {
    title = 'OptiAI Report',
    subtitle = 'System Analysis Report',
    includeCharts = true,
    includeMetadata = true
  } = options

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #22D3EE;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #22D3EE;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 5px 0 0 0;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h2 {
          color: #22D3EE;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 15px 0;
        }
        .metric-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #22D3EE;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #22D3EE;
        }
        .metric-label {
          color: #666;
          font-size: 14px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .data-table th,
        .data-table td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        .data-table th {
          background: #f8f9fa;
          font-weight: bold;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p>${subtitle}</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>

      ${includeMetadata ? `
        <div class="section">
          <h2>Report Summary</h2>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-value">${reportData.summary?.totalFiles || 0}</div>
              <div class="metric-label">Total Files</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${formatBytes(reportData.summary?.totalSize || 0)}</div>
              <div class="metric-label">Total Size</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${formatBytes(reportData.summary?.spaceSaved || 0)}</div>
              <div class="metric-label">Space Saved</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${reportData.summary?.duplicatesFound || 0}</div>
              <div class="metric-label">Duplicates</div>
            </div>
          </div>
        </div>
      ` : ''}

      ${reportData.scanResults ? `
        <div class="section">
          <h2>Scan Results</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>File Path</th>
                <th>Size</th>
                <th>Type</th>
                <th>Risk Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.scanResults.slice(0, 50).map(item => `
                <tr>
                  <td>${item.path}</td>
                  <td>${formatBytes(item.size)}</td>
                  <td>${item.type || 'Unknown'}</td>
                  <td>${item.riskLevel || 'Low'}</td>
                  <td>${item.action || 'None'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${reportData.scanResults.length > 50 ? `<p><em>Showing first 50 of ${reportData.scanResults.length} items</em></p>` : ''}
        </div>
      ` : ''}

      ${reportData.actionHistory ? `
        <div class="section">
          <h2>Action History</h2>
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Items</th>
                <th>Space Freed</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.actionHistory.map(action => `
                <tr>
                  <td>${new Date(action.timestamp).toLocaleDateString()}</td>
                  <td>${action.type}</td>
                  <td>${action.itemCount}</td>
                  <td>${formatBytes(action.spaceFreed)}</td>
                  <td>${action.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        <p>Generated by OptiAI - AI-Powered System Optimizer</p>
        <p>Report ID: ${generateReportId()}</p>
      </div>
    </body>
    </html>
  `
  
  return html
}

/**
 * Download data as file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Export scan results
 * @param {Object} scanData - Scan results data
 * @param {string} format - Export format ('csv', 'json', 'pdf')
 * @param {Object} options - Export options
 */
export const exportScanResults = (scanData, format, options = {}) => {
  const timestamp = new Date().toISOString().split('T')[0]
  const baseFilename = `optiai-scan-${timestamp}`
  
  switch (format) {
    case 'csv':
      const csvColumns = [
        { key: 'path', label: 'File Path' },
        { key: 'size', label: 'Size (Bytes)', formatter: (value) => value || 0 },
        { key: 'type', label: 'File Type' },
        { key: 'riskLevel', label: 'Risk Level' },
        { key: 'action', label: 'Recommended Action' },
        { key: 'lastModified', label: 'Last Modified', formatter: (value) => value ? new Date(value).toLocaleDateString() : '' }
      ]
      
      const csvContent = exportToCSV(scanData.items || [], csvColumns)
      downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv')
      break
      
    case 'json':
      const jsonContent = exportToJSON(scanData, {
        type: 'scan-results',
        metadata: {
          scanDate: scanData.scanned_at,
          totalItems: scanData.items?.length || 0,
          totalSize: scanData.summary?.total_size || 0
        }
      })
      downloadFile(jsonContent, `${baseFilename}.json`, 'application/json')
      break
      
    case 'pdf':
      const pdfContent = generatePDFReport(scanData, {
        title: 'OptiAI Scan Report',
        subtitle: `Scan completed on ${new Date(scanData.scanned_at).toLocaleDateString()}`,
        includeCharts: false,
        includeMetadata: true
      })
      
      // Open in new window for printing
      const printWindow = window.open('', '_blank')
      printWindow.document.write(pdfContent)
      printWindow.document.close()
      printWindow.print()
      break
      
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Export action history
 * @param {Array} actionHistory - Action history data
 * @param {string} format - Export format
 * @param {Object} options - Export options
 */
export const exportActionHistory = (actionHistory, format, options = {}) => {
  const timestamp = new Date().toISOString().split('T')[0]
  const baseFilename = `optiai-actions-${timestamp}`
  
  switch (format) {
    case 'csv':
      const csvColumns = [
        { key: 'timestamp', label: 'Date', formatter: (value) => new Date(value).toLocaleString() },
        { key: 'type', label: 'Action Type' },
        { key: 'itemCount', label: 'Items Affected' },
        { key: 'spaceFreed', label: 'Space Freed (Bytes)', formatter: (value) => value || 0 },
        { key: 'status', label: 'Status' },
        { key: 'description', label: 'Description' }
      ]
      
      const csvContent = exportToCSV(actionHistory, csvColumns)
      downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv')
      break
      
    case 'json':
      const jsonContent = exportToJSON(actionHistory, {
        type: 'action-history',
        metadata: {
          totalActions: actionHistory.length,
          totalSpaceFreed: actionHistory.reduce((sum, action) => sum + (action.spaceFreed || 0), 0)
        }
      })
      downloadFile(jsonContent, `${baseFilename}.json`, 'application/json')
      break
      
    case 'pdf':
      const pdfContent = generatePDFReport({ actionHistory }, {
        title: 'OptiAI Action History',
        subtitle: `Actions performed from ${new Date(Math.min(...actionHistory.map(a => a.timestamp))).toLocaleDateString()} to ${new Date(Math.max(...actionHistory.map(a => a.timestamp))).toLocaleDateString()}`,
        includeCharts: false,
        includeMetadata: true
      })
      
      const printWindow = window.open('', '_blank')
      printWindow.document.write(pdfContent)
      printWindow.document.close()
      printWindow.print()
      break
      
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Export system metrics
 * @param {Object} metricsData - System metrics data
 * @param {string} format - Export format
 * @param {Object} options - Export options
 */
export const exportSystemMetrics = (metricsData, format, options = {}) => {
  const timestamp = new Date().toISOString().split('T')[0]
  const baseFilename = `optiai-metrics-${timestamp}`
  
  switch (format) {
    case 'csv':
      const csvColumns = [
        { key: 'timestamp', label: 'Timestamp', formatter: (value) => new Date(value).toLocaleString() },
        { key: 'cpu.percent', label: 'CPU Usage (%)' },
        { key: 'memory.percent', label: 'Memory Usage (%)' },
        { key: 'disk.percent', label: 'Disk Usage (%)' },
        { key: 'network.status', label: 'Network Status' }
      ]
      
      const csvContent = exportToCSV(metricsData, csvColumns)
      downloadFile(csvContent, `${baseFilename}.csv`, 'text/csv')
      break
      
    case 'json':
      const jsonContent = exportToJSON(metricsData, {
        type: 'system-metrics',
        metadata: {
          totalSamples: metricsData.length,
          timeRange: {
            start: metricsData[0]?.timestamp,
            end: metricsData[metricsData.length - 1]?.timestamp
          }
        }
      })
      downloadFile(jsonContent, `${baseFilename}.json`, 'application/json')
      break
      
    case 'pdf':
      const pdfContent = generatePDFReport({ metricsData }, {
        title: 'OptiAI System Metrics',
        subtitle: `Performance metrics from ${new Date(metricsData[0]?.timestamp).toLocaleDateString()}`,
        includeCharts: true,
        includeMetadata: true
      })
      
      const printWindow = window.open('', '_blank')
      printWindow.document.write(pdfContent)
      printWindow.document.close()
      printWindow.print()
      break
      
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Utility function to format bytes
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate unique report ID
 * @returns {string} - Unique report ID
 */
const generateReportId = () => {
  return 'RPT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase()
}

export default {
  exportToCSV,
  exportToJSON,
  generatePDFReport,
  downloadFile,
  exportScanResults,
  exportActionHistory,
  exportSystemMetrics
}
