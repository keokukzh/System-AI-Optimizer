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
  const cleanupRef = useRef(false)

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
        } catch (err) {
          // Ignore any abort errors during cleanup
          console.debug('Cleanup abort error:', err)
        }
      }
    }
  }, [])

  // Execute API call with caching
  const execute = useCallback(async (customOptions = {}) => {
    console.log(`useCachedApi: execute called for ${url}`)
    if (!isMountedRef.current) return
    
    // Reset abort controller
    if (abortControllerRef.current?.signal.aborted) {
      abortControllerRef.current = new AbortController()
    }

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
            // Handle AbortError gracefully
            if (err.name === 'AbortError') {
              return // Don't treat abort as an error
            }
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
      // Check if already aborted before attempting to abort
      if (!abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort()
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

      console.log(`useCachedApi: making fetch request to ${url}`)
      const response = await fetch(url, requestOptions)
      console.log(`useCachedApi: fetch response status: ${response.status}`)
      
      // Add to deduplicator if enabled
      if (deduplicate && !isBackground) {
        requestDeduplicator.addPendingRequest(finalCacheKey, Promise.resolve(response.clone()))
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()
      console.log(`useCachedApi: received data:`, responseData)

      if (!isMountedRef.current) return

      // Cache the data if caching is enabled
      if (shouldCache) {
        apiCache.set(finalCacheKey, responseData, finalTTL)
      }

      console.log(`useCachedApi: setting data:`, responseData)
      setData(responseData)
      setFromCache(false)
      setError(null)
      setLastFetch(Date.now())
      if (!isBackground) {
        setLoading(false)
      }

      if (onCacheMiss && !isBackground) {
        onCacheMiss(responseData)
      }

      return responseData
    } catch (err) {
      if (!isMountedRef.current) return

      // Clear loading state on error
      if (!isBackground) {
        setLoading(false)
      }

      // Handle AbortError gracefully - don't treat it as an error
      if (err.name === 'AbortError') {
        // Request was aborted, this is expected behavior
        return
      }

      // Handle other errors
      setError(err)
      if (!isBackground) {
        setLoading(false)
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
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort()
    }
    setLoading(false)
    setError(null)
  }, [])

  // Reset state
  const reset = useCallback(() => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
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

  // Auto-fetch on mount with stagger to prevent race conditions
  useEffect(() => {
    if (apiOptions.immediate !== false) {
      // Add small delay to stagger multiple component mounts
      const delay = Math.random() * 100 // 0-100ms random delay
      const timer = setTimeout(() => {
        execute()
      }, delay)
      
      return () => clearTimeout(timer)
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
