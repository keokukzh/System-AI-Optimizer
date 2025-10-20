import React, { useState } from 'react'
import { ChevronDown, Play, HardDrive, Home, Settings, Loader2 } from 'lucide-react'

const ScanDropdown = ({ onStartScan, isScanning, scanProgress }) => {
  const [isOpen, setIsOpen] = useState(false)

  const scanOptions = [
    {
      id: 'quick',
      label: 'Quick Scan (Home)',
      description: 'Scan user home directory',
      icon: Home,
      paths: ['C:\\Users'],
      estimatedTime: '1-2 min'
    },
    {
      id: 'full',
      label: 'Full System Scan',
      description: 'Scan all drives and directories',
      icon: HardDrive,
      paths: ['C:\\'],
      estimatedTime: '5-10 min'
    },
    {
      id: 'custom',
      label: 'Custom Scan',
      description: 'Choose specific paths',
      icon: Settings,
      paths: [],
      estimatedTime: 'Variable'
    }
  ]

  const handleScanStart = (option) => {
    setIsOpen(false)
    onStartScan(option)
  }

  const handleStop = () => {
    // Implement stop functionality
    // Stopping scan...
  }

  if (isScanning) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span className="text-sm text-gray-600">Scanning...</span>
        </div>
        
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${scanProgress}%` }}
          />
        </div>
        
        <button
          onClick={handleStop}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Stop
        </button>
        
        <button
          onClick={() => {
            // Run in background
          }}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Background
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Play className="w-4 h-4" />
        <span>Start New Scan</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              {scanOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.id}
                    onClick={() => handleScanStart(option)}
                    className="w-full flex items-start gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Estimated time: {option.estimatedTime}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ScanDropdown
