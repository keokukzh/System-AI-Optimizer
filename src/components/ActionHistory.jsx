import React, { useState, useEffect } from 'react'
import { History, Undo, Trash2, Move, Archive, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'

const ActionHistory = ({ onShowToast }) => {
  const [history, setHistory] = useState([])
  const [undoableActions, setUndoableActions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUndoing, setIsUndoing] = useState(false)

  useEffect(() => {
    loadActionHistory()
  }, [])

  const loadActionHistory = async () => {
    try {
      setIsLoading(true)
      
      const [historyResponse, undoableResponse] = await Promise.all([
        fetch('http://127.0.0.1:5175/api/actions/history'),
        fetch('http://127.0.0.1:5175/api/actions/undoable')
      ])

      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setHistory(historyData.actions || [])
      }

      if (undoableResponse.ok) {
        const undoableData = await undoableResponse.json()
        setUndoableActions(undoableData.undoable_actions || [])
      }
    } catch (error) {
      console.error('Failed to load action history:', error)
      onShowToast('Failed to load action history', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUndo = async (actionId) => {
    try {
      setIsUndoing(true)
      
      const response = await fetch('http://127.0.0.1:5175/api/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_id: actionId })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          onShowToast('Action undone successfully', 'success')
          loadActionHistory() // Refresh the list
        } else {
          onShowToast(`Failed to undo action: ${result.message}`, 'error')
        }
      } else {
        throw new Error('Failed to undo action')
      }
    } catch (error) {
      console.error('Failed to undo action:', error)
      onShowToast('Failed to undo action', 'error')
    } finally {
      setIsUndoing(false)
    }
  }

  const handleUndoLast = async () => {
    if (undoableActions.length > 0) {
      const lastAction = undoableActions[undoableActions.length - 1]
      await handleUndo(lastAction.action_id)
    }
  }

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'delete':
        return <Trash2 className="w-4 h-4" />
      case 'move':
        return <Move className="w-4 h-4" />
      case 'compress':
        return <Archive className="w-4 h-4" />
      case 'backup':
        return <Archive className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-danger-600" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-warning-600" />
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success'
      case 'failed':
        return 'badge-danger'
      case 'in_progress':
        return 'badge-warning'
      case 'pending':
        return 'badge-info'
      default:
        return 'badge-info'
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const isUndoable = (actionId) => {
    return undoableActions.some(action => action.action_id === actionId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <History className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-pulse" />
          <p className="text-gray-500">Loading action history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Action History</h3>
          <p className="text-gray-600">View and manage your optimization actions</p>
        </div>
        <div className="flex space-x-2">
          {undoableActions.length > 0 && (
            <button
              onClick={handleUndoLast}
              disabled={isUndoing}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isUndoing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Undoing...</span>
                </>
              ) : (
                <>
                  <Undo className="w-4 h-4" />
                  <span>Undo Last</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={loadActionHistory}
            className="btn btn-secondary"
          >
            <History className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-2xl font-bold text-primary-600">
            {history.length}
          </div>
          <div className="text-sm text-gray-500">Total Actions</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-success-600">
            {history.filter(action => action.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-warning-600">
            {undoableActions.length}
          </div>
          <div className="text-sm text-gray-500">Undoable</div>
        </div>
      </div>

      {/* Action List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((action, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getActionIcon(action.action_type)}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {action.action_type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {action.action_id.slice(-8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 truncate max-w-xs">
                      {action.original_path}
                    </div>
                    {action.target_path && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        → {action.target_path}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(action.status)}
                      <span className={`ml-2 badge ${getStatusColor(action.status)}`}>
                        {action.status}
                      </span>
                    </div>
                    {action.error_message && (
                      <div className="text-xs text-danger-600 mt-1 truncate max-w-xs">
                        {action.error_message}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(action.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {isUndoable(action.action_id) && action.status === 'completed' && (
                      <button
                        onClick={() => handleUndo(action.action_id)}
                        disabled={isUndoing}
                        className="text-primary-600 hover:text-primary-900 disabled:opacity-50"
                        title="Undo this action"
                      >
                        <Undo className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No actions performed yet</p>
            <p className="text-sm">Start optimizing your system to see action history</p>
          </div>
        )}
      </div>

      {/* Undoable Actions */}
      {undoableActions.length > 0 && (
        <div className="card">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Undoable Actions</h4>
          <div className="space-y-2">
            {undoableActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getActionIcon(action.action_type)}
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {action.action_type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {action.original_path}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(action.timestamp)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleUndo(action.action_id)}
                  disabled={isUndoing}
                  className="btn btn-warning text-sm disabled:opacity-50"
                >
                  <Undo className="w-4 h-4 mr-1" />
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ActionHistory
