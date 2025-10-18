import React, { useState, useEffect } from 'react'
import { Brain, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

const AILoadingScreen = ({ onComplete, onError }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [aiStatus, setAiStatus] = useState({
    available: false,
    model_loaded: false,
    fallback_mode: false,
    last_error: null
  })

  const steps = [
    { id: 'checking', label: 'Checking AI availability...', icon: Loader2 },
    { id: 'loading', label: 'Loading AI model...', icon: Brain },
    { id: 'initializing', label: 'Initializing AI engine...', icon: Loader2 },
    { id: 'ready', label: 'AI ready!', icon: CheckCircle }
  ]

  useEffect(() => {
    initializeAI()
  }, [])

  const initializeAI = async () => {
    try {
      // Step 1: Check AI status
      setCurrentStep(0)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate check time
      
      const statusResponse = await fetch('http://127.0.0.1:5174/api/ai/status')
      if (!statusResponse.ok) {
        throw new Error('Failed to check AI status')
      }
      
      const status = await statusResponse.json()
      setAiStatus(status)

      // Step 2: Initialize LLM if not already loaded
      if (!status.model_loaded && !status.fallback_mode) {
        setCurrentStep(1)
        await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate loading time
        
        const initResponse = await fetch('http://127.0.0.1:5174/api/ai/init', {
          method: 'POST'
        })
        
        if (!initResponse.ok) {
          throw new Error('Failed to initialize AI model')
        }
      }

      // Step 3: Final initialization
      setCurrentStep(2)
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 4: Complete
      setCurrentStep(3)
      await new Promise(resolve => setTimeout(resolve, 500))

      if (onComplete) {
        onComplete(status)
      }

    } catch (error) {
      console.error('AI initialization failed:', error)
      if (onError) {
        onError(error)
      }
    }
  }

  const getStepIcon = (stepIndex) => {
    const step = steps[stepIndex]
    const Icon = step.icon
    
    if (stepIndex < currentStep) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (stepIndex === currentStep) {
      return <Icon className="w-5 h-5 text-blue-500 animate-spin" />
    } else {
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepText = (stepIndex) => {
    const step = steps[stepIndex]
    if (stepIndex < currentStep) {
      return `${step.label} ✓`
    } else if (stepIndex === currentStep) {
      return step.label
    } else {
      return step.label
    }
  }

  const getStepColor = (stepIndex) => {
    if (stepIndex < currentStep) {
      return 'text-green-500'
    } else if (stepIndex === currentStep) {
      return 'text-blue-500'
    } else {
      return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="max-w-md w-full mx-4">
        <div className="bg-dark-card/60 backdrop-blur-xl border border-dark-border rounded-xl p-8 shadow-glass">
          <div className="text-center mb-8">
            <div className="relative mb-4">
              <Brain className="w-16 h-16 mx-auto text-primary-500" />
              <div className="absolute -top-1 -right-1">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-dark-text mb-2">
              Initializing AI
            </h1>
            <p className="text-dark-muted">
              Setting up intelligent optimization engine...
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-3">
                {getStepIcon(index)}
                <span className={`text-sm font-medium ${getStepColor(index)}`}>
                  {getStepText(index)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-dark-muted mt-2 text-center">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
            </p>
          </div>

          {aiStatus.fallback_mode && (
            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-400">
                  Using rule-based fallback (AI model not available)
                </span>
              </div>
            </div>
          )}

          {aiStatus.last_error && (
            <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-400">
                  {aiStatus.last_error}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AILoadingScreen
