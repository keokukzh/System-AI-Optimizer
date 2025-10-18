import React from 'react'
import { Trash2, Move, Archive, X } from 'lucide-react'

const StickyActionBar = ({ 
  selectedCount, 
  estimatedBytes, 
  onTrash, 
  onMove, 
  onCompress, 
  onClearSelection 
}) => {
  if (selectedCount === 0) return null

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40
                    bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl px-4 py-3
                    flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300">
      
      {/* Selection Info */}
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-gray-900">
          {selectedCount} selected
        </div>
        <div className="text-sm text-gray-600">
          · ~{formatBytes(estimatedBytes)}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTrash}
          className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          Move to Trash
        </button>
        
        <button
          onClick={onMove}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <Move className="w-4 h-4" />
          Move...
        </button>
        
        <button
          onClick={onCompress}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          <Archive className="w-4 h-4" />
          Compress
        </button>
      </div>

      {/* Clear Selection */}
      <button
        onClick={onClearSelection}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        title="Clear selection"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default StickyActionBar
