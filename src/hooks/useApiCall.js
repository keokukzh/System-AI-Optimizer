import { useState, useEffect, useRef, useCallback } from 'react'
import { categorizeError, getUserFriendlyMessage, getRetryDelay, logError, isRetryable } from '../utils/errorHandler'

/**
 * useApiCall - Unified API call hook with retry logic, timeout, and cancellation
 * Provides consistent error handling and loading states across the app
 */
const useApiCall = (url, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
    retries = 3,
    retryDelay = 1000,
    timeout = 10000,
    immediate = true,
    onSuccess = null,
    onError = null,
    ...fetchOptions
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  
  const abortControllerRef = useRef(null)
  const timeoutRef = useRef(null)
  const retryTimeoutRef = useRef(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [])

  // Execute API call
  const execute = useCallback(async (customOptions = {}) => {
    // Cleanup previous request
    cleanup()
    
    setLoading(true)
    setError(null)

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    // Merge options
    const finalOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...customOptions.headers
      },
      body: body ? JSON.stringify(body) : null,
      signal: abortControllerRef.current.signal,
      ...fetchOptions,
      ...customOptions
    }

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }, timeout)

    try {
      const response = await fetch(url, finalOptions)
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()
      setData(responseData)
      setRetryCount(0)
      
      if (onSuccess) {
        onSuccess(responseData)
      }

      return responseData
    } catch (err) {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Don't retry if request was aborted or cancelled
      if (err.name === 'AbortError') {
        setLoading(false)
        return
      }

      // Log error for debugging
      logError(err, { url, method, retryCount })
      
      const currentRetryCount = retryCount
      
      // Check if error is retryable and we haven't exceeded max retries
      if (isRetryable(err) && currentRetryCount < retries) {
        // Use smart retry delay based on error type
        const delay = getRetryDelay(err, currentRetryCount)
        setRetryCount(prev => prev + 1)
        
        retryTimeoutRef.current = setTimeout(() => {
          execute(customOptions)
        }, delay)
      } else {
        // Max retries reached or error is not retryable
        const enhancedError = {
          ...err,
          userFriendlyMessage: getUserFriendlyMessage(err),
          errorType: categorizeError(err).type,
          severity: categorizeError(err).severity,
          retryCount: currentRetryCount
        }
        
        setError(enhancedError)
        setLoading(false)
        
        if (onError) {
          onError(enhancedError)
        }
      }
    }
  }, [url, method, headers, body, retries, retryDelay, timeout, retryCount, onSuccess, onError, cleanup])

  // Cancel current request
  const cancel = useCallback(() => {
    cleanup()
    setLoading(false)
    setError(null)
  }, [cleanup])

  // Reset state
  const reset = useCallback(() => {
    cleanup()
    setData(null)
    setLoading(false)
    setError(null)
    setRetryCount(0)
  }, [cleanup])

  // Execute immediately if requested
  useEffect(() => {
    if (immediate && url) {
      execute()
    }

    // Cleanup on unmount
    return cleanup
  }, [immediate, url, execute, cleanup])

  return {
    data,
    loading,
    error,
    retryCount,
    execute,
    cancel,
    reset,
    isRetrying: retryCount > 0 && retryCount <= retries
  }
}

export default useApiCall
