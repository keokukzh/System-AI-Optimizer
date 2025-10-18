import React from 'react'
import { motion } from 'framer-motion'

/**
 * StatusBadge - Small icon indicator for header
 * Shows network/AI status with tooltip
 */
const StatusBadge = ({ icon: Icon, status, tooltip, onClick }) => {
  const isOnline = status === 'online' || status === 'active'
  
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <div className={`
        p-2 rounded-lg transition-all duration-200
        ${isOnline 
          ? 'bg-neon-emerald/10 text-neon-emerald' 
          : 'bg-dark-surface/50 text-dark-muted'
        }
      `}>
        <Icon className="w-4 h-4" />
        
        {/* Online indicator dot */}
        {isOnline && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-neon-emerald rounded-full animate-pulse" />
        )}
      </div>
      
      {/* Tooltip */}
      <div className="
        absolute top-full mt-2 left-1/2 transform -translate-x-1/2
        px-2 py-1 rounded bg-dark-card border border-dark-border
        text-xs text-dark-text whitespace-nowrap
        opacity-0 group-hover:opacity-100 pointer-events-none
        transition-opacity duration-200 z-50
      ">
        {tooltip}: {isOnline ? 'Online' : 'Offline'}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-transparent border-b-dark-card" />
      </div>
    </motion.div>
  )
}

export default StatusBadge

