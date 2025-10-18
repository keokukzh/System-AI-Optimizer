import React from 'react';
import { AlertTriangle, X, RefreshCw, Info, CheckCircle } from 'lucide-react';

const ErrorMessage = ({ 
  error, 
  onRetry, 
  onDismiss, 
  type = 'error',
  showRetry = true,
  showDismiss = true,
  className = '',
  title,
  children 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      case 'success':
        return 'text-green-800';
      default:
        return 'text-red-800';
    }
  };

  const getUserFriendlyMessage = (error) => {
    if (!error) return 'An unexpected error occurred.';
    
    const message = error.message?.toLowerCase() || error.toString().toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (message.includes('permission') || message.includes('access')) {
      return 'Permission denied. Please ensure you have the necessary access rights.';
    }
    
    if (message.includes('timeout')) {
      return 'Request timed out. The server might be busy. Please try again.';
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource was not found.';
    }
    
    if (message.includes('server') || message.includes('500')) {
      return 'Server error occurred. Please try again later.';
    }
    
    if (message.includes('llm') || message.includes('ai')) {
      return 'AI service is temporarily unavailable. Using fallback suggestions.';
    }
    
    if (message.includes('disk') || message.includes('space')) {
      return 'Insufficient disk space. Please free up some space and try again.';
    }
    
    if (message.includes('protected') || message.includes('system')) {
      return 'Cannot access protected system directories. Please choose a different location.';
    }
    
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  };

  const getSuggestions = (error) => {
    if (!error) return [];
    
    const message = error.message?.toLowerCase() || error.toString().toLowerCase();
    const suggestions = [];
    
    if (message.includes('network') || message.includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('Check if the server is running');
    }
    
    if (message.includes('permission') || message.includes('access')) {
      suggestions.push('Run the application as administrator');
      suggestions.push('Check file/folder permissions');
      suggestions.push('Try a different directory');
    }
    
    if (message.includes('disk') || message.includes('space')) {
      suggestions.push('Free up disk space');
      suggestions.push('Delete temporary files');
      suggestions.push('Move files to external storage');
    }
    
    if (message.includes('protected') || message.includes('system')) {
      suggestions.push('Choose a user directory instead');
      suggestions.push('Scan Documents or Downloads folder');
      suggestions.push('Avoid system directories');
    }
    
    return suggestions;
  };

  const suggestions = getSuggestions(error);

  return (
    <div className={`border rounded-lg p-4 ${getBackgroundColor()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${getTextColor()} mb-1`}>
              {title}
            </h3>
          )}
          
          <div className={`text-sm ${getTextColor()}`}>
            {children || getUserFriendlyMessage(error)}
          </div>
          
          {suggestions.length > 0 && (
            <div className="mt-3">
              <p className={`text-xs font-medium ${getTextColor()} mb-1`}>
                Suggestions:
              </p>
              <ul className={`text-xs ${getTextColor()} list-disc list-inside space-y-1`}>
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {(showRetry || showDismiss) && (
            <div className="mt-3 flex space-x-2">
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded ${getTextColor()} bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </button>
              )}
              
              {showDismiss && onDismiss && (
                <button
                  onClick={onDismiss}
                  className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded ${getTextColor()} bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
        
        {showDismiss && onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className={`inline-flex ${getTextColor()} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
