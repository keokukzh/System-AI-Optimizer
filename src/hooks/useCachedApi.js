import { useState, useEffect, useCallback, useRef } from 'react'
import apiCache, { cacheHelpers, requestDeduplicator } from '../utils/apiCache'

/**
 * useCachedApi - Wrapper around useApiCall with intelligent caching
 * Provides smart invalidation, background refresh, and request deduplication
 */
const useCachedApi = (url, options = {}) => {
  const {
    endpoint = 'default',
    cacheKey = null,
    ttl = null,
    backgroundRefresh = true,
    deduplicate = true,
    onCacheHit = null,
    onCacheMiss = null,
    ...apiOptions
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)
  const [lastFetch, setLastFetch] = useState(null)
  
  const abortControllerRef = useRef(null)
  const isMountedRef = useRef(true)

  // Get cache configuration
  const finalCacheKey = cacheKey || cacheHelpers.getCacheKey(endpoint, apiOptions.params)
  const finalTTL = ttl || cacheHelpers.getTTL(endpoint)
  const shouldCache = cacheHelpers.shouldCache(endpoint)

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

  // Execute API call with caching
  const execute = useCallback(async (customOptions = {}) => {
    if (!isMountedRef.current) return

    // Check cache first
    if (shouldCache) {
      const cachedData = apiCache.get(finalCacheKey)
      if (cachedData) {
        setData(cachedData)
        setFromCache(true)
        setError(null)
        
        if (onCacheHit) {
          onCacheHit(cachedData)
        }

        // Background refresh if data is getting stale
        if (backgroundRefresh) {
          const cacheItem = apiCache.cache.get(finalCacheKey)
          if (cacheItem) {
            const age = Date.now() - cacheItem.timestamp
            const staleThreshold = cacheItem.ttl * 0.8 // Refresh when 80% of TTL has passed
            
            if (age > staleThreshold) {
              // Refresh in background without showing loading
              fetchData(true, {})
            }
          }
        }

        return cachedData
      }
    }

    // Check for pending request (deduplication)
    if (deduplicate) {
      const pendingRequest = requestDeduplicator.getPendingRequest(finalCacheKey)
      if (pendingRequest) {
        try {
          const result = await pendingRequest
          if (isMountedRef.current) {
            setData(result)
            setFromCache(false)
            setError(null)
          }
          return result
        } catch (err) {
          if (isMountedRef.current) {
            setError(err)
          }
          throw err
        }
      }
    }

    // Fetch new data
    return fetchData(false, customOptions)
  }, [url, finalCacheKey, finalTTL, shouldCache, backgroundRefresh, deduplicate, onCacheHit, onCacheMiss, apiOptions])

  // Internal fetch function
  const fetchData = useCallback(async (isBackground = false, customOptions = {}) => {
    if (!isMountedRef.current) return

    // Cleanup previous request
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort()
      } catch (error) {
        // Ignore abort errors during cleanup
        console.debug('AbortController cleanup in fetchData:', error.message)
      }
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    if (!isBackground) {
      setLoading(true)
      setError(null)
      setFromCache(false)
    }

    try {
      const requestOptions = {
        ...apiOptions,
        ...customOptions,
        signal: abortControllerRef.current.signal
      }

      // Create request promise
      const requestPromise = fetch(url, requestOptions)
      
      // Add to deduplicator if enabled
      if (deduplicate && !isBackground) {
        requestDeduplicator.addPendingRequest(finalCacheKey, requestPromise)
      }

      const response = await requestPromise

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()

      if (!isMountedRef.current) return

      // Cache the data if caching is enabled
      if (shouldCache) {
        apiCache.set(finalCacheKey, responseData, finalTTL)
      }

      setData(responseData)
      setFromCache(false)
      setError(null)
      setLastFetch(Date.now())

      if (onCacheMiss && !isBackground) {
        onCacheMiss(responseData)
      }

      return responseData
    } catch (err) {
      if (!isMountedRef.current) return

      // Don't set error for aborted requests
      if (err.name !== 'AbortError') {
        setError(err)
        if (!isBackground) {
          setLoading(false)
        }
      }

      throw err
    } finally {
      if (!isBackground && isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [url, finalCacheKey, finalTTL, shouldCache, deduplicate, onCacheHit, onCacheMiss, apiOptions])

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
    setFromCache(false)
    setLastFetch(null)
  }, [])

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    if (shouldCache) {
      apiCache.delete(finalCacheKey)
    }
  }, [shouldCache, finalCacheKey])

  // Refresh data (force fetch)
  const refresh = useCallback(() => {
    if (shouldCache) {
      apiCache.delete(finalCacheKey)
    }
    return execute()
  }, [shouldCache, finalCacheKey, execute])

  // Get cache info
  const getCacheInfo = useCallback(() => {
    if (!shouldCache) return null

    const cacheItem = apiCache.cache.get(finalCacheKey)
    if (!cacheItem) return null

    const age = Date.now() - cacheItem.timestamp
    const remaining = cacheItem.ttl - age

    return {
      key: finalCacheKey,
      age,
      remaining,
      isExpired: remaining <= 0,
      isStale: age > cacheItem.ttl * 0.8
    }
  }, [shouldCache, finalCacheKey])

  // Auto-fetch on mount if immediate is true
  useEffect(() => {
    if (apiOptions.immediate !== false) {
      execute()
    }
  }, [execute, apiOptions.immediate])

  return {
    data,
    loading,
    error,
    fromCache,
    lastFetch,
    execute,
    cancel,
    reset,
    invalidateCache,
    refresh,
    getCacheInfo,
    isCached: shouldCache && apiCache.has(finalCacheKey)
  }
}

export default useCachedApi
