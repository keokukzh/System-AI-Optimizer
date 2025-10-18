/**
 * Centralized error handling utilities for OptiAI
 */

// Error types for categorization
export const ERROR_TYPES = {
  NETWORK: 'network',
  PERMISSION: 'permission',
  TIMEOUT: 'timeout',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  LLM: 'llm',
  DISK_SPACE: 'disk_space',
  PROTECTED_PATH: 'protected_path',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Categorizes an error based on its message and properties
 */
export const categorizeError = (error) => {
  if (!error) return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.MEDIUM };
  
  const message = (error.message || error.toString()).toLowerCase();
  const status = error.status || error.statusCode;
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || 
      message.includes('connection') || status === 0) {
    return { type: ERROR_TYPES.NETWORK, severity: ERROR_SEVERITY.MEDIUM };
  }
  
  // Permission errors
  if (message.includes('permission') || message.includes('access') || 
      message.includes('denied') || status === 403) {
    return { type: ERROR_TYPES.PERMISSION, severity: ERROR_SEVERITY.HIGH };
  }
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return { type: ERROR_TYPES.TIMEOUT, severity: ERROR_SEVERITY.MEDIUM };
  }
  
  // Not found errors
  if (message.includes('not found') || status === 404) {
    return { type: ERROR_TYPES.NOT_FOUND, severity: ERROR_SEVERITY.LOW };
  }
  
  // Server errors
  if (message.includes('server') || status >= 500) {
    return { type: ERROR_TYPES.SERVER, severity: ERROR_SEVERITY.HIGH };
  }
  
  // LLM/AI errors
  if (message.includes('llm') || message.includes('ai') || 
      message.includes('model') || message.includes('ollama')) {
    return { type: ERROR_TYPES.LLM, severity: ERROR_SEVERITY.MEDIUM };
  }
  
  // Disk space errors
  if (message.includes('disk') || message.includes('space') || 
      message.includes('storage') || message.includes('full')) {
    return { type: ERROR_TYPES.DISK_SPACE, severity: ERROR_SEVERITY.HIGH };
  }
  
  // Protected path errors
  if (message.includes('protected') || message.includes('system') || 
      message.includes('windows') || message.includes('program files')) {
    return { type: ERROR_TYPES.PROTECTED_PATH, severity: ERROR_SEVERITY.MEDIUM };
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || 
      message.includes('required') || status === 400) {
    return { type: ERROR_TYPES.VALIDATION, severity: ERROR_SEVERITY.LOW };
  }
  
  return { type: ERROR_TYPES.UNKNOWN, severity: ERROR_SEVERITY.MEDIUM };
};

/**
 * Gets user-friendly error message based on error type
 */
export const getUserFriendlyMessage = (error) => {
  const { type } = categorizeError(error);
  
  const messages = {
    [ERROR_TYPES.NETWORK]: 'Network connection issue. Please check your internet connection and try again.',
    [ERROR_TYPES.PERMISSION]: 'Permission denied. Please ensure you have the necessary access rights.',
    [ERROR_TYPES.TIMEOUT]: 'Request timed out. The server might be busy. Please try again.',
    [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
    [ERROR_TYPES.SERVER]: 'Server error occurred. Please try again later.',
    [ERROR_TYPES.LLM]: 'AI service is temporarily unavailable. Using fallback suggestions.',
    [ERROR_TYPES.DISK_SPACE]: 'Insufficient disk space. Please free up some space and try again.',
    [ERROR_TYPES.PROTECTED_PATH]: 'Cannot access protected system directories. Please choose a different location.',
    [ERROR_TYPES.VALIDATION]: 'Invalid input provided. Please check your data and try again.',
    [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  };
  
  return messages[type] || messages[ERROR_TYPES.UNKNOWN];
};

/**
 * Gets actionable suggestions based on error type
 */
export const getErrorSuggestions = (error) => {
  const { type } = categorizeError(error);
  
  const suggestions = {
    [ERROR_TYPES.NETWORK]: [
      'Check your internet connection',
      'Try refreshing the page',
      'Check if the server is running',
      'Disable VPN or proxy if active'
    ],
    [ERROR_TYPES.PERMISSION]: [
      'Run the application as administrator',
      'Check file/folder permissions',
      'Try a different directory',
      'Ensure you have write access'
    ],
    [ERROR_TYPES.TIMEOUT]: [
      'Wait a moment and try again',
      'Check server status',
      'Try a smaller operation',
      'Check your network speed'
    ],
    [ERROR_TYPES.NOT_FOUND]: [
      'Verify the path exists',
      'Check spelling and case',
      'Try a different location',
      'Ensure the resource is available'
    ],
    [ERROR_TYPES.SERVER]: [
      'Try again in a few minutes',
      'Check server status',
      'Contact support if persistent',
      'Restart the application'
    ],
    [ERROR_TYPES.LLM]: [
      'AI will use fallback suggestions',
      'Check if LLM server is running',
      'Try again later',
      'Use rule-based optimization'
    ],
    [ERROR_TYPES.DISK_SPACE]: [
      'Free up disk space',
      'Delete temporary files',
      'Move files to external storage',
      'Empty recycle bin'
    ],
    [ERROR_TYPES.PROTECTED_PATH]: [
      'Choose a user directory instead',
      'Scan Documents or Downloads folder',
      'Avoid system directories',
      'Use a different drive'
    ],
    [ERROR_TYPES.VALIDATION]: [
      'Check your input data',
      'Ensure all required fields are filled',
      'Verify file formats',
      'Check for special characters'
    ],
    [ERROR_TYPES.UNKNOWN]: [
      'Try again',
      'Restart the application',
      'Check system resources',
      'Contact support if persistent'
    ]
  };
  
  return suggestions[type] || suggestions[ERROR_TYPES.UNKNOWN];
};

/**
 * Determines if an error is retryable
 */
export const isRetryable = (error) => {
  const { type, severity } = categorizeError(error);
  
  // Critical errors are usually not retryable
  if (severity === ERROR_SEVERITY.CRITICAL) return false;
  
  // These error types are typically retryable
  const retryableTypes = [
    ERROR_TYPES.NETWORK,
    ERROR_TYPES.TIMEOUT,
    ERROR_TYPES.SERVER,
    ERROR_TYPES.LLM
  ];
  
  return retryableTypes.includes(type);
};

/**
 * Gets retry delay in milliseconds based on error type and attempt count
 */
export const getRetryDelay = (error, attemptCount = 0) => {
  const { type } = categorizeError(error);
  
  // Base delays by error type
  const baseDelays = {
    [ERROR_TYPES.NETWORK]: 1000,
    [ERROR_TYPES.TIMEOUT]: 2000,
    [ERROR_TYPES.SERVER]: 3000,
    [ERROR_TYPES.LLM]: 1500,
    [ERROR_TYPES.UNKNOWN]: 1000
  };
  
  const baseDelay = baseDelays[type] || 1000;
  
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attemptCount);
  const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
  
  return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
};

/**
 * Logs error to console and external service
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message || error.toString(),
    stack: error.stack,
    type: categorizeError(error).type,
    severity: categorizeError(error).severity,
    timestamp: new Date().toISOString(),
    context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Console logging
  console.error('OptiAI Error:', errorInfo);
  
  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error reporting service
    // sendToErrorService(errorInfo);
  }
  
  return errorInfo;
};

/**
 * Creates a standardized error object
 */
export const createError = (message, type = ERROR_TYPES.UNKNOWN, originalError = null) => {
  const error = new Error(message);
  error.type = type;
  error.originalError = originalError;
  error.timestamp = new Date().toISOString();
  return error;
};

/**
 * Handles API errors specifically
 */
export const handleApiError = (error) => {
  let message = 'An API error occurred';
  let type = ERROR_TYPES.UNKNOWN;
  
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data;
    
    message = data?.message || data?.error || `Server error (${status})`;
    
    if (status >= 500) type = ERROR_TYPES.SERVER;
    else if (status === 404) type = ERROR_TYPES.NOT_FOUND;
    else if (status === 403) type = ERROR_TYPES.PERMISSION;
    else if (status === 400) type = ERROR_TYPES.VALIDATION;
    
  } else if (error.request) {
    // Request was made but no response received
    message = 'No response from server';
    type = ERROR_TYPES.NETWORK;
    
  } else {
    // Something else happened
    message = error.message || 'Unknown API error';
  }
  
  return createError(message, type, error);
};

export default {
  categorizeError,
  getUserFriendlyMessage,
  getErrorSuggestions,
  isRetryable,
  getRetryDelay,
  logError,
  createError,
  handleApiError,
  ERROR_TYPES,
  ERROR_SEVERITY
};
