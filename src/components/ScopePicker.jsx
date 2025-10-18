import React, { useState } from 'react'
import { FolderOpen, X, Plus } from 'lucide-react'

const ScopePicker = ({ currentPath, onPathChange, excludes, onExcludesChange }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempPath, setTempPath] = useState(currentPath)

  const recommendedExcludes = ['node_modules', '.git', 'tmp', '.cache', 'logs', 'temp']

  const handlePathSubmit = () => {
    onPathChange(tempPath)
    setIsEditing(false)
  }

  const handleExcludeToggle = (exclude) => {
    if (excludes.includes(exclude)) {
      onExcludesChange(excludes.filter(e => e !== exclude))
    } else {
      onExcludesChange([...excludes, exclude])
    }
  }

  const addCustomExclude = (exclude) => {
    if (exclude && !excludes.includes(exclude)) {
      onExcludesChange([...excludes, exclude])
    }
  }

  return (
    <div className="space-y-4">
      {/* Path Picker */}
      <div className="flex items-center gap-3">
        <FolderOpen className="w-5 h-5 text-gray-600" />
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={tempPath}
              onChange={(e) => setTempPath(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Choose path..."
              autoFocus
            />
            <button
              onClick={handlePathSubmit}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setTempPath(currentPath)
                setIsEditing(false)
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1 text-sm">
              <span className="text-gray-600">Scanning:</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                {currentPath}
              </span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
            >
              Change...
            </button>
          </div>
        )}
      </div>

      {/* Exclude Chips */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Exclude:</span>
          <div className="flex flex-wrap gap-2">
            {excludes.map((exclude) => (
              <button
                key={exclude}
                onClick={() => handleExcludeToggle(exclude)}
                className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200 transition-colors"
              >
                {exclude}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Recommended:</span>
          <div className="flex flex-wrap gap-2">
            {recommendedExcludes
              .filter(exclude => !excludes.includes(exclude))
              .map((exclude) => (
                <button
                  key={exclude}
                  onClick={() => handleExcludeToggle(exclude)}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {exclude}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScopePicker
