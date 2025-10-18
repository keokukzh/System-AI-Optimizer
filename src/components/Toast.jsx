import React from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const Toast = ({ message, type = 'info', onClose }) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const Icon = icons[type] || Info

  const typeClasses = {
    success: 'toast-success',
    error: 'toast-error',
    warning: 'toast-warning',
    info: ''
  }

  return (
    <div className={`toast ${typeClasses[type]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${
            type === 'success' ? 'text-success-600' :
            type === 'error' ? 'text-danger-600' :
            type === 'warning' ? 'text-warning-600' :
            'text-primary-600'
          }`} />
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${
            type === 'success' ? 'text-success-800' :
            type === 'error' ? 'text-danger-800' :
            type === 'warning' ? 'text-warning-800' :
            'text-gray-800'
          }`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onClose}
            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'success' ? 'text-success-500 hover:bg-success-100 focus:ring-success-600' :
              type === 'error' ? 'text-danger-500 hover:bg-danger-100 focus:ring-danger-600' :
              type === 'warning' ? 'text-warning-500 hover:bg-warning-100 focus:ring-warning-600' :
              'text-gray-400 hover:bg-gray-100 focus:ring-gray-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toast
