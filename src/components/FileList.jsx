import React, { useState, useMemo } from 'react'
import { File, Folder, HardDrive, Download, Trash2, Archive, Move } from 'lucide-react'

const FileList = ({ files = [], selectedFiles, onFileSelect, onSelectAll }) => {
  const [sortBy, setSortBy] = useState('size')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const sortedAndFilteredFiles = useMemo(() => {
    let filtered = files

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.path.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(file => file.kind === filter)
    }

    // Sort files
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'size':
          aValue = a.bytes || 0
          bValue = b.bytes || 0
          break
        case 'name':
          aValue = a.path.toLowerCase()
          bValue = b.path.toLowerCase()
          break
        case 'modified':
          aValue = a.mtime || 0
          bValue = b.mtime || 0
          break
        default:
          aValue = a.bytes || 0
          bValue = b.bytes || 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [files, sortBy, sortOrder, filter, searchTerm])

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const getFileIcon = (file) => {
    if (file.kind === 'dir') {
      return <Folder className="file-icon text-blue-500" />
    }
    
    const extension = file.path.split('.').pop()?.toLowerCase()
    const iconMap = {
      'txt': '📄',
      'pdf': '📕',
      'doc': '📘',
      'docx': '📘',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'mp4': '🎬',
      'avi': '🎬',
      'mp3': '🎵',
      'wav': '🎵',
      'zip': '📦',
      'rar': '📦',
      'exe': '⚙️',
      'dll': '⚙️'
    }
    
    return <span className="file-icon text-lg">{iconMap[extension] || '📄'}</span>
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleSelectAll = () => {
    onSelectAll(sortedAndFilteredFiles)
  }

  const isAllSelected = sortedAndFilteredFiles.length > 0 && 
    sortedAndFilteredFiles.every(file => selectedFiles.has(file.path))

  const isPartiallySelected = sortedAndFilteredFiles.some(file => selectedFiles.has(file.path)) && !isAllSelected

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input text-sm"
          >
            <option value="all">All Types</option>
            <option value="file">Files</option>
            <option value="dir">Directories</option>
            <option value="symlink">Symlinks</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [column, order] = e.target.value.split('-')
              setSortBy(column)
              setSortOrder(order)
            }}
            className="input text-sm"
          >
            <option value="size-desc">Size (Large to Small)</option>
            <option value="size-asc">Size (Small to Large)</option>
            <option value="name-asc">Name (A to Z)</option>
            <option value="name-desc">Name (Z to A)</option>
            <option value="modified-desc">Modified (Newest)</option>
            <option value="modified-asc">Modified (Oldest)</option>
          </select>
        </div>
      </div>

      {/* File List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isPartiallySelected
                    }}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('size')}
                >
                  Size
                  {sortBy === 'size' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('modified')}
                >
                  Modified
                  {sortBy === 'modified' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAndFilteredFiles.map((file, index) => (
                <tr
                  key={index}
                  className={`file-item hover:bg-gray-50 ${
                    selectedFiles.has(file.path) ? 'bg-primary-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.path)}
                      onChange={(e) => onFileSelect(file.path, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getFileIcon(file)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {file.path.split('/').pop() || file.path}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {file.path}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatBytes(file.bytes || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(file.mtime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      file.kind === 'dir' ? 'badge-info' :
                      file.kind === 'file' ? 'badge-success' :
                      'badge-warning'
                    }`}>
                      {file.kind}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onFileSelect(file.path, !selectedFiles.has(file.path))}
                        className="text-primary-600 hover:text-primary-900"
                        title="Select/Deselect"
                      >
                        {selectedFiles.has(file.path) ? '✓' : '○'}
                      </button>
                      <button
                        className="text-danger-600 hover:text-danger-900"
                        title="Move to trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        className="text-warning-600 hover:text-warning-900"
                        title="Compress"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="Move"
                      >
                        <Move className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedAndFilteredFiles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <File className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No files found</p>
            {searchTerm && (
              <p className="text-sm">Try adjusting your search terms</p>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div>
          Showing {sortedAndFilteredFiles.length} of {files.length} files
        </div>
        <div>
          {selectedFiles.size} selected
        </div>
      </div>
    </div>
  )
}

export default FileList
