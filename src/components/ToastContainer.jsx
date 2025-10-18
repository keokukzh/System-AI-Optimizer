import React from 'react'
import { CheckCircle, XCircle, Info, X, Undo2 } from 'lucide-react'

const ToastContainer = ({ toasts, onRemove }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm p-4 border rounded-lg shadow-lg ${getStyles(toast.type)} animate-in slide-in-from-right-2 duration-300`}
        >
          <div className="flex items-start gap-3">
            {getIcon(toast.type)}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{toast.message}</p>
              
              {toast.action && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      toast.action.onClick()
                      onRemove(toast.id)
                    }}
                    className="flex items-center gap-1 text-xs font-medium hover:underline"
                  >
                    <Undo2 className="w-3 h-3" />
                    {toast.action.label}
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => onRemove(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
