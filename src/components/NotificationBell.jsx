import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellOff, X } from 'lucide-react'
import NotificationCenter from './NotificationCenter'
import useNotifications from '../hooks/useNotifications'

/**
 * NotificationBell - Bell icon in header with unread badge and dropdown
 * Integrates with NotificationCenter for a complete notification system
 */
const NotificationBell = ({ 
  position = 'header', // 'header', 'floating'
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    isMuted,
    dismissNotification,
    clearAll,
    handleAction,
    toggleMute,
    getStats
  } = useNotifications()

  const stats = getStats()
  const hasNotifications = notifications.length > 0

  const bellVariants = {
    initial: { scale: 1 },
    pulse: { 
      scale: [1, 1.1, 1],
      transition: { duration: 0.5, repeat: Infinity }
    },
    hover: { scale: 1.1 },
    tap: { scale: 0.9 }
  }

  const badgeVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Bell Button */}
      <motion.button
        variants={bellVariants}
        initial="initial"
        animate={hasNotifications && !isMuted ? "pulse" : "initial"}
        whileHover="hover"
        whileTap="tap"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-lg transition-all duration-200
          ${hasNotifications 
            ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/20' 
            : 'bg-dark-surface/50 text-dark-muted border border-dark-border hover:bg-dark-surface hover:text-dark-text'
          }
          ${isMuted ? 'opacity-50' : ''}
        `}
        title={isMuted ? 'Notifications muted' : `${stats.unread} unread notifications`}
      >
        {isMuted ? (
          <BellOff className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}

        {/* Unread Badge */}
        <AnimatePresence>
          {stats.unread > 0 && !isMuted && (
            <motion.div
              variants={badgeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg"
            >
              {stats.unread > 9 ? '9+' : stats.unread}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mute Indicator */}
        {isMuted && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-dark-muted rounded-full border-2 border-dark-bg" />
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 bg-dark-card/95 backdrop-blur-xl border border-dark-border rounded-xl shadow-glass overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-dark-border">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-neon-cyan" />
                <span className="font-medium text-dark-text text-sm">Notifications</span>
                {stats.unread > 0 && (
                  <span className="px-2 py-0.5 bg-neon-cyan/20 text-neon-cyan text-xs rounded-full">
                    {stats.unread}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMute}
                  className="p-1 rounded text-dark-muted hover:text-dark-text transition-colors duration-200"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <BellOff className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                </button>
                
                {hasNotifications && (
                  <button
                    onClick={clearAll}
                    className="p-1 rounded text-dark-muted hover:text-red-500 transition-colors duration-200"
                    title="Clear all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-dark-muted text-sm">
                  <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-dark-border">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 hover:bg-dark-surface/30 transition-colors duration-200 ${
                        !notification.read ? 'bg-dark-surface/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          notification.type === 'success' ? 'bg-neon-emerald' :
                          notification.type === 'error' ? 'bg-red-500' :
                          notification.type === 'warning' ? 'bg-neon-amber' :
                          'bg-neon-cyan'
                        }`} />
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-dark-text text-sm truncate">
                            {notification.title}
                          </p>
                          <p className="text-dark-muted text-xs mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-dark-muted mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => dismissNotification(notification.id)}
                          className="p-1 rounded text-dark-muted hover:text-dark-text transition-colors duration-200 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 5 && (
              <div className="p-2 border-t border-dark-border bg-dark-surface/20">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    // Open full notification center
                  }}
                  className="w-full text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors duration-200"
                >
                  View all {notifications.length} notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Notification Center (when needed) */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}

export default NotificationBell
