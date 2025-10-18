import React, { useState } from 'react'
import { Brain, Zap, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

const OptimizationPanel = ({ scanResults, onOptimize, onShowToast }) => {
  const [optimizations, setOptimizations] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedActions, setSelectedActions] = useState(new Set())
  const [isExecuting, setIsExecuting] = useState(false)

  const generateOptimizations = async () => {
    if (!scanResults) {
      onShowToast('No scan results available', 'warning')
      return
    }

    try {
      setIsGenerating(true)
      
      const response = await fetch('http://127.0.0.1:5174/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_id: 'latest', // In real app, use actual scan ID
          user_preferences: {
            risk_tolerance: 'low',
            preserve_system_files: true,
            backup_before_action: true
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setOptimizations(data)
        onShowToast('Optimization suggestions generated', 'success')
      } else {
        throw new Error('Failed to generate optimizations')
      }
    } catch (error) {
      console.error('Failed to generate optimizations:', error)
      onShowToast('Failed to generate optimizations', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleActionSelect = (actionIndex, selected) => {
    const newSelected = new Set(selectedActions)
    if (selected) {
      newSelected.add(actionIndex)
    } else {
      newSelected.delete(actionIndex)
    }
    setSelectedActions(newSelected)
  }

  const handleSelectAll = () => {
    if (!optimizations) return
    
    const allActions = [
      ...optimizations.rule_based,
      ...optimizations.ai_suggestions
    ]
    
    if (selectedActions.size === allActions.length) {
      setSelectedActions(new Set())
    } else {
      setSelectedActions(new Set(allActions.map((_, index) => index)))
    }
  }

  const executeSelectedActions = async () => {
    if (selectedActions.size === 0) {
      onShowToast('No actions selected', 'warning')
      return
    }

    try {
      setIsExecuting(true)
      
      const allActions = [
        ...optimizations.rule_based,
        ...optimizations.ai_suggestions
      ]
      
      const selectedActionObjects = Array.from(selectedActions).map(index => allActions[index])
      
      // Execute each selected action
      const results = []
      for (const action of selectedActionObjects) {
        const response = await fetch('http://127.0.0.1:5174/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: action.action || 'send_to_trash',
            target_path: action.target || action.target_files?.[0]?.path,
            dry_run: false
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          results.push(result)
        }
      }

      const successCount = results.filter(r => r.success).length
      onShowToast(`Successfully executed ${successCount}/${selectedActions.size} actions`, 'success')
      
      // Clear selection and refresh
      setSelectedActions(new Set())
      generateOptimizations()
      
    } catch (error) {
      console.error('Failed to execute actions:', error)
      onShowToast('Failed to execute actions', 'error')
    } finally {
      setIsExecuting(false)
    }
  }

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'low':
        return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-warning-600" />
      case 'high':
        return <Shield className="w-4 h-4 text-danger-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low':
        return 'badge-success'
      case 'medium':
        return 'badge-warning'
      case 'high':
        return 'badge-danger'
      default:
        return 'badge-info'
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  if (!scanResults) {
    return (
      <div className="card text-center py-12">
        <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scan Data</h3>
        <p className="text-gray-600 mb-4">Start a system scan to generate optimization suggestions</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Optimization</h3>
          <p className="text-gray-600">Get intelligent suggestions to optimize your system</p>
        </div>
        <button
          onClick={generateOptimizations}
          disabled={isGenerating}
          className="btn btn-primary disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <LoadingSpinner size="small" className="mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Generate Suggestions
            </>
          )}
        </button>
      </div>

      {/* Summary */}
      {optimizations?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-2xl font-bold text-primary-600">
              {optimizations.summary.total_suggestions}
            </div>
            <div className="text-sm text-gray-500">Total Suggestions</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-success-600">
              {formatBytes(optimizations.summary.total_estimated_savings)}
            </div>
            <div className="text-sm text-gray-500">Potential Savings</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-warning-600">
              {optimizations.summary.high_priority_count}
            </div>
            <div className="text-sm text-gray-500">High Priority</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold text-info-600">
              {optimizations.summary.low_priority_count}
            </div>
            <div className="text-sm text-gray-500">Low Risk</div>
          </div>
        </div>
      )}

      {/* Rule-based Suggestions */}
      {optimizations?.rule_based && optimizations.rule_based.length > 0 && (
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Rule-based Suggestions</h4>
          <div className="space-y-3">
            {optimizations.rule_based.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  selectedActions.has(index) ? 'border-primary-300 bg-primary-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={selectedActions.has(index)}
                        onChange={(e) => handleActionSelect(index, e.target.checked)}
                        className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <h5 className="font-medium text-gray-900">{suggestion.rule_name}</h5>
                      <span className={`ml-2 badge ${getRiskColor(suggestion.risk_level)}`}>
                        {suggestion.risk_level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                    <p className="text-sm text-gray-500 mb-2">{suggestion.reasoning}</p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-success-600 font-medium">
                        Saves: {formatBytes(suggestion.estimated_savings)}
                      </span>
                      <span className="text-gray-500">
                        Confidence: {Math.round(suggestion.confidence * 100)}%
                      </span>
                      <span className="text-gray-500">
                        Priority: {suggestion.priority_score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    {getRiskIcon(suggestion.risk_level)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {optimizations?.ai_suggestions && optimizations.ai_suggestions.length > 0 && (
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Suggestions</h4>
          <div className="space-y-3">
            {optimizations.ai_suggestions.map((suggestion, index) => {
              const adjustedIndex = index + (optimizations.rule_based?.length || 0)
              return (
                <div
                  key={index}
                  className={`p-4 border rounded-lg ${
                    selectedActions.has(adjustedIndex) ? 'border-primary-300 bg-primary-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={selectedActions.has(adjustedIndex)}
                          onChange={(e) => handleActionSelect(adjustedIndex, e.target.checked)}
                          className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <h5 className="font-medium text-gray-900">{suggestion.action}</h5>
                        <span className={`ml-2 badge ${getRiskColor(suggestion.risk_level)}`}>
                          {suggestion.risk_level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.reason}</p>
                      <div className="flex items-center space-x-4 text-sm mb-2">
                        <span className="text-success-600 font-medium">
                          Saves: {suggestion.estimated_savings}
                        </span>
                        <span className="text-gray-500">
                          Confidence: {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                      {suggestion.step_by_step && suggestion.step_by_step.length > 0 && (
                        <div className="text-sm text-gray-500">
                          <p className="font-medium mb-1">Steps:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            {suggestion.step_by_step.map((step, stepIndex) => (
                              <li key={stepIndex}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {getRiskIcon(suggestion.risk_level)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action Controls */}
      {optimizations && (
        <div className="card">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="btn btn-secondary"
              >
                {selectedActions.size === (optimizations.rule_based?.length || 0) + (optimizations.ai_suggestions?.length || 0)
                  ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-sm text-gray-500">
                {selectedActions.size} actions selected
              </span>
            </div>
            <button
              onClick={executeSelectedActions}
              disabled={selectedActions.size === 0 || isExecuting}
              className="btn btn-primary disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Executing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Execute Selected Actions
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* No optimizations state */}
      {!optimizations && !isGenerating && (
        <div className="card text-center py-12">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Optimize</h3>
          <p className="text-gray-600 mb-4">Click "Generate Suggestions" to get AI-powered optimization recommendations</p>
        </div>
      )}
    </div>
  )
}

export default OptimizationPanel
