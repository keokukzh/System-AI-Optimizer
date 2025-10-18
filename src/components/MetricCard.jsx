import React from 'react'
import { motion } from 'framer-motion'
import useReducedMotion from '../hooks/useReducedMotion'

/**
 * MetricCard - Compact, professional metric display component
 * Horizontal layout for better space efficiency
 */
const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  percent, 
  color = 'cyan',
  delay = 0 
}) => {
  const prefersReducedMotion = useReducedMotion()

  const colorClasses = {
    cyan: {
      bg: 'from-neon-cyan/10 to-neon-cyan/5',
      border: 'border-neon-cyan/20',
      text: 'text-neon-cyan',
      bar: 'bg-neon-cyan'
    },
    amber: {
      bg: 'from-neon-amber/10 to-neon-amber/5',
      border: 'border-neon-amber/20',
      text: 'text-neon-amber',
      bar: 'bg-neon-amber'
    },
    emerald: {
      bg: 'from-neon-emerald/10 to-neon-emerald/5',
      border: 'border-neon-emerald/20',
      text: 'text-neon-emerald',
      bar: 'bg-neon-emerald'
    },
    purple: {
      bg: 'from-neon-purple/10 to-neon-purple/5',
      border: 'border-neon-purple/20',
      text: 'text-neon-purple',
      bar: 'bg-neon-purple'
    }
  }

  const colors = colorClasses[color]

  const animationProps = prefersReducedMotion ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay, duration: 0.15 }
  } : {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    whileHover: { scale: 1.02, y: -2 },
    transition: { delay, duration: 0.2 }
  }

  return (
    <motion.div
      {...animationProps}
      className={`
        relative rounded-xl p-4
        bg-gradient-to-br ${colors.bg}
        border ${colors.border}
        backdrop-blur-xl shadow-glass
        transition-all duration-200
      `}
    >
      {/* Icon & Label Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-dark-surface/50 ${colors.text}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium text-dark-muted">{label}</span>
        </div>
        
        {/* Value */}
        <span className={`text-2xl font-bold font-mono ${colors.text}`}>
          {value}
        </span>
      </div>

      {/* Progress Bar */}
      {percent !== undefined && (
        <div className="mb-2">
          <div className="h-2 bg-dark-surface/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ delay: delay + 0.2, duration: 0.5, ease: 'easeOut' }}
              className={`h-full ${colors.bar} rounded-full`}
            />
          </div>
        </div>
      )}

      {/* Sub Value */}
      {subValue && (
        <div className="text-xs text-dark-muted font-mono">
          {subValue}
        </div>
      )}
    </motion.div>
  )
}

export default MetricCard

