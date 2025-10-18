import React from 'react'
import { motion } from 'framer-motion'
import useReducedMotion from '../hooks/useReducedMotion'

/**
 * LoadingSpinner - Professional loading component with multiple sizes
 * Enhanced with shimmer effects and motion preferences
 */
const LoadingSpinner = ({ size = 'medium', message = 'Loading...', className = '' }) => {
  const prefersReducedMotion = useReducedMotion()

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  }

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
    xlarge: 'text-lg'
  }

  const spinnerVariants = prefersReducedMotion ? {
    animate: { opacity: [0.5, 1, 0.5] }
  } : {
    animate: { 
      rotate: 360,
      opacity: [0.5, 1, 0.5]
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {/* Spinner */}
      <motion.div
        variants={spinnerVariants}
        animate="animate"
        transition={prefersReducedMotion ? 
          { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } :
          { duration: 1, repeat: Infinity, ease: 'linear' }
        }
        className={`
          ${sizeClasses[size]} 
          border-2 border-dark-border border-t-neon-cyan 
          rounded-full
        `}
      />
      
      {/* Loading Message */}
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${textSizes[size]} text-dark-muted font-medium`}
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}

export default LoadingSpinner
