import { useState, useEffect } from 'react'

/**
 * Custom hook to detect user's motion preferences
 * Respects prefers-reduced-motion for accessibility (WCAG 2.1)
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    // Listen for changes
    const listener = (e) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', listener)
    
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])
  
  return prefersReducedMotion
}

/**
 * Get animation variants based on motion preference
 * @param {Object} options - Animation configuration
 * @returns {Object} Framer Motion animation props
 */
export const getMotionProps = (prefersReducedMotion, options = {}) => {
  const {
    initialY = 20,
    hoverScale = 1.02,
    hoverY = -4,
    duration = 0.2,
  } = options

  if (prefersReducedMotion) {
    // Minimal animation - only opacity
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.15 }
    }
  }

  // Full animations
  return {
    initial: { opacity: 0, y: initialY },
    animate: { opacity: 1, y: 0 },
    whileHover: { scale: hoverScale, y: hoverY },
    transition: { duration, ease: 'easeOut' }
  }
}

export default useReducedMotion

