import React, { useState, useEffect } from 'react'
import { Brain, AlertTriangle, CheckCircle, Clock, Zap, Trash2, Move, Archive, Eye, EyeOff, ChevronDown, ChevronRight, Shield } from 'lucide-react'
import RiskBadge from './RiskBadge'

const AISuggestionsTab = ({ scanResult }) => {
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedActions, setSelectedActions] = useState(new Set())
  const [isExecuting, setIsExecuting] = useState(false)
  const [previewMode, setPreviewMode] = useState(true)
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [policyValidation, setPolicyValidation] = useState(null)
  const [requiresDoubleConfirm, setRequiresDoubleConfirm] = useState(false)

  const generateSuggestions = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://127.0.0.1:5174/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_id: 'latest',
          user_preferences: {
            risk_tolerance: 'low',
            focus_areas: ['temp_files', 'duplicates', 'large_files']
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        const actions = data.actions || []
        setSuggestions(actions)
        
        // Validate against policy
        if (actions.length > 0) {
          await validateActionPlan({ actions })
        }
      } else {
        setError('Failed to generate AI suggestions')
      }
    } catch (err) {
      setError('Network error while generating suggestions')
    } finally {
      setIsLoading(false)
    }
  }

  const executeSelectedActions = async () => {
    if (selectedActions.size === 0) return

    setIsExecuting(true)
    const results = []

    try {
      for (const actionIndex of selectedActions) {
        const action = suggestions[actionIndex]
        
        const response = await fetch('http://127.0.0.1:5174/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: action.action,
            target_path: action.target,
            destination: action.dest || undefined
          })
        })

        if (response.ok) {
          const result = await response.json()
          results.push({ success: true, action: action.action, result })
        } else {
          results.push({ success: false, action: action.action, error: 'Failed to execute' })
        }
      }

      // Clear selection and refresh suggestions
      setSelectedActions(new Set())
      await generateSuggestions()
      
    } catch (err) {
      setError('Failed to execute some actions')
    } finally {
      setIsExecuting(false)
    }
  }

  const validateActionPlan = async (plan) => {
    try {
      const response = await fetch('http://127.0.0.1:5174/api/policy/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      if (response.ok) {
        const validation = await response.json()
        setPolicyValidation(validation)
        setRequiresDoubleConfirm(validation.summary?.requires_double_confirmation || false)
      }
    } catch (err) {
      console.error('Policy validation failed:', err)
    }
  }

  const toggleActionSelection = (index) => {
    const newSelection = new Set(selectedActions)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedActions(newSelection)
  }

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const getActionIcon = (action) => {
    switch (action) {
      case 'send_to_trash':
        return <Trash2 className="w-4 h-4" />
      case 'move':
        return <Move className="w-4 h-4" />
      case 'compress':
        return <Archive className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'high':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalSavings = Array.from(selectedActions).reduce((sum, index) => {
    return sum + (suggestions[index]?.estimated_savings || 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Optimization Suggestions</h2>
        </div>
        <div className="flex items-center space-x-3">
          {/* Preview Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                previewMode 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {previewMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {previewMode ? 'Preview Only' : 'Allow Execution'}
              </span>
            </button>
          </div>
          
          <button
            onClick={generateSuggestions}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Generate Suggestions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {selectedActions.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800">
                {selectedActions.size} action{selectedActions.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-800">
                Estimated savings: <strong>{formatBytes(totalSavings)}</strong>
              </span>
              <button
                onClick={executeSelectedActions}
                disabled={isExecuting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isExecuting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Execute Selected</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions yet</h3>
            <p className="text-gray-600">Click "Generate Suggestions" to get AI-powered optimization recommendations</p>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg border-2 p-6 transition-all ${
                selectedActions.has(index)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={selectedActions.has(index)}
                    onChange={() => toggleActionSelection(index)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                {/* Action Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getActionIcon(suggestion.action)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {suggestion.action.replace('_', ' ')}
                    </h3>
                    <div className="flex items-center space-x-3">
                      <RiskBadge level={suggestion.risk || 'low'} />
                      <span className="text-sm font-medium text-green-600">
                        ~{formatBytes(suggestion.estimated_savings)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-500 font-mono truncate flex-1 mr-4">
                      {suggestion.target}
                    </div>
                    <button
                      onClick={() => toggleExpanded(index)}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <span>Why?</span>
                      {expandedItems.has(index) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {expandedItems.has(index) && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">{suggestion.reason}</p>
                      {suggestion.dest && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Destination:</strong> {suggestion.dest}
                        </p>
                      )}
                    </div>
                  )}

                  {!previewMode && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <p className="text-xs text-amber-800">
                        ⚠️ Execution mode enabled - actions will be performed when selected
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">
            AI suggestions are generated using local Ollama model (llama3.1:8b)
          </span>
        </div>
      </div>
    </div>
  )
}

export default AISuggestionsTab
