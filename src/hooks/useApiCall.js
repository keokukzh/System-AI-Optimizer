import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useApiCall - Simple API call hook with proper error handling
 * Provides loading states, error handling, and request cancellation
 */
const useApiCall = (url, options = {}) => {
  const {
    immediate = true,
    onSuccess = null,
    onError = null,
    ...fetchOptions
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(null)
  
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort()
        } catch (error) {
          // Ignore abort errors during cleanup
          console.debug('AbortController cleanup:', error.message)
        }
      }
    }
  }, [])

  // Execute API call
  const execute = useCallback(async (customOptions = {}) => {
    if (!isMountedRef.current) return

    // Cleanup previous request
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort()
      } catch (error) {
        // Ignore abort errors during cleanup
        console.debug('AbortController cleanup in execute:', error.message)
      }
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const requestOptions = {
        ...fetchOptions,
        ...customOptions,
        signal: abortControllerRef.current.signal
      }

      const response = await fetch(url, requestOptions)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()

      if (!isMountedRef.current) return

      setData(responseData)
      setError(null)
      setLastFetch(Date.now())

      if (onSuccess) {
        onSuccess(responseData)
      }

      return responseData
    } catch (err) {
      if (!isMountedRef.current) return

      // Don't set error for aborted requests
      if (err.name !== 'AbortError') {
        setError(err)
        if (onError) {
          onError(err)
        }
      }

      throw err
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [url, fetchOptions, onSuccess, onError])

  // Cancel current request
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setLoading(false)
    setError(null)
  }, [])

  // Reset state
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setData(null)
    setLoading(false)
    setError(null)
    setLastFetch(null)
  }, [])

  // Auto-fetch on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    data,
    loading,
    error,
    lastFetch,
    execute,
    cancel,
    reset
  }
}

export default useApiCall