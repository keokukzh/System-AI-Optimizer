import React from 'react'
import { motion } from 'framer-motion'
import useReducedMotion from '../hooks/useReducedMotion'

const GlassCard = ({ 
  children, 
  className = '', 
  hover = true,
  neonBorder = false,
  neonColor = 'cyan',
  onClick,
  delay = 0
}) => {
  const prefersReducedMotion = useReducedMotion()
  
  const neonColors = {
    cyan: 'hover:shadow-neon-cyan border-neon-cyan/20 hover:border-neon-cyan/40',
    amber: 'hover:shadow-neon-amber border-neon-amber/20 hover:border-neon-amber/40',
    emerald: 'hover:shadow-neon-emerald border-neon-emerald/20 hover:border-neon-emerald/40',
  }

  // Conditional animation based on motion preference
  const animationProps = prefersReducedMotion ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay, duration: 0.15 }
  } : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.2 }, // Reduced from 0.3
    whileHover: hover ? { scale: 1.02, y: -4 } : {},
    whileTap: onClick ? { scale: 0.98 } : {}
  }

  return (
    <motion.div
      {...animationProps}
      className={`
        relative rounded-2xl overflow-hidden
        bg-dark-card/60 backdrop-blur-xl
        border ${neonBorder ? neonColors[neonColor] : 'border-dark-border'}
        shadow-glass
        transition-all duration-200 motion-reduce:transition-none
        ${hover ? 'hover:bg-dark-card/80' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Bottom Glow (optional) */}
      {neonBorder && (
        <div className={`
          absolute bottom-0 left-0 right-0 h-px 
          bg-gradient-to-r from-transparent via-${neonColor === 'cyan' ? 'neon-cyan' : neonColor === 'amber' ? 'neon-amber' : 'neon-emerald'} to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
        `} />
      )}
    </motion.div>
  )
}

export default GlassCard

