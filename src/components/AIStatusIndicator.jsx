import React, { useState, useEffect, useRef } from 'react'
import { Brain, Wifi, WifiOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { API_CONFIG } from '../config/environment'

const AIStatusIndicator = ({ className = "" }) => {
  const [aiStatus, setAiStatus] = useState({
    available: false,
    status: 'offline',
    model: null,
    model_loaded: false,
    fallback_mode: false,
    available_models: [],
    message: null,
    error: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    checkAIStatus()
    // Check status every 30 seconds
    const interval = setInterval(checkAIStatus, 30000)
    return () => {
      clearInterval(interval)
      // Cleanup abort controller
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

  const checkAIStatus = async () => {
    try {
      // Cleanup previous request
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort()
        } catch (error) {
          // Ignore abort errors during cleanup
          console.debug('AbortController cleanup in checkAIStatus:', error.message)
        }
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()

      setIsLoading(true)
          const response = await fetch(`${API_CONFIG.BASE_URL}/api/ai/status`, {
        signal: abortControllerRef.current.signal
      })
      
      if (response.ok) {
        const status = await response.json()
        setAiStatus(status)
      } else {
        setAiStatus(prev => ({ ...prev, available: false, status: 'offline' }))
      }
    } catch (error) {
      // Don't log AbortError as it's expected during cleanup
      if (error.name !== 'AbortError') {
        console.error('Failed to check AI status:', error)
        setAiStatus(prev => ({ ...prev, available: false, status: 'offline' }))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    }

    if (aiStatus.fallback_mode) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }

    if (aiStatus.available && aiStatus.model_loaded) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }

    return <WifiOff className="w-4 h-4 text-red-500" />
  }

  const getStatusText = () => {
    if (isLoading) return 'Checking...'
    if (aiStatus.fallback_mode) return 'Fallback Mode'
    if (aiStatus.available) {
      const modelName = aiStatus.model || 'Unknown'
      const shortName = modelName.split(':')[0] // Extract base name
      return `AI: ${shortName}`
    }
    return 'AI Offline'
  }

  const getStatusColor = () => {
    if (isLoading) return 'text-blue-500'
    if (aiStatus.fallback_mode) return 'text-yellow-500'
    if (aiStatus.available && aiStatus.model_loaded) return 'text-green-500'
    return 'text-red-500'
  }

  const getTooltipText = () => {
    if (aiStatus.message) {
      return aiStatus.message
    }
    if (aiStatus.error) {
      if (aiStatus.error.includes('Connection refused') || aiStatus.error.includes('not running')) {
        return 'Ollama not installed. Install from ollama.ai for AI features'
      }
      return `Error: ${aiStatus.error}`
    }
    if (aiStatus.fallback_mode) {
      return 'Using rule-based suggestions (Ollama not detected)'
    }
    if (aiStatus.available) {
      const models = aiStatus.available_models?.length || 0
      return `AI online: ${aiStatus.model || 'Unknown'} (${models} models available)`
    }
    return 'Ollama not installed. Install from ollama.ai for AI features'
  }

  return (
    <div className={className}>
      <div 
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-dark-card/40 backdrop-blur-sm border border-dark-border/50"
        title={getTooltipText()}
      >
        <Brain className="w-4 h-4 text-dark-text/70" />
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      {!aiStatus.available && !isLoading && (
        <div className="text-xs text-gray-400 mt-1 px-3">
          {aiStatus.error?.includes('Connection refused') || aiStatus.error?.includes('not running')
            ? 'Install Ollama from ollama.ai for AI features'
            : aiStatus.message || 'AI service unavailable'}
        </div>
      )}
    </div>
  )
}

export default AIStatusIndicator
