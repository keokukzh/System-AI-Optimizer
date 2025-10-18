import React, { useState, useEffect } from 'react'
import { Brain, Wifi, WifiOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

const AIStatusIndicator = ({ className = "" }) => {
  const [aiStatus, setAiStatus] = useState({
    available: false,
    status: 'offline',
    model_name: null,
    model_loaded: false,
    fallback_mode: false,
    last_error: null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAIStatus()
    // Check status every 30 seconds
    const interval = setInterval(checkAIStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkAIStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://127.0.0.1:5174/api/ai/status')
      if (response.ok) {
        const status = await response.json()
        setAiStatus(status)
      } else {
        setAiStatus(prev => ({ ...prev, available: false, status: 'offline' }))
      }
    } catch (error) {
      console.error('Failed to check AI status:', error)
      setAiStatus(prev => ({ ...prev, available: false, status: 'offline' }))
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
    if (aiStatus.available && aiStatus.model_loaded) {
      return aiStatus.model_name ? `AI: ${aiStatus.model_name}` : 'AI Online'
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
    if (aiStatus.last_error) {
      return `Error: ${aiStatus.last_error}`
    }
    if (aiStatus.fallback_mode) {
      return 'Using rule-based suggestions (AI model not available)'
    }
    if (aiStatus.available && aiStatus.model_loaded) {
      return `AI model loaded: ${aiStatus.model_name || 'Unknown'}`
    }
    return 'AI model not loaded or server unavailable'
  }

  return (
    <div 
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-dark-card/40 backdrop-blur-sm border border-dark-border/50 ${className}`}
      title={getTooltipText()}
    >
      <Brain className="w-4 h-4 text-dark-text/70" />
      {getStatusIcon()}
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  )
}

export default AIStatusIndicator
