import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Bell, 
  BellOff,
  Settings,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import useReducedMotion from '../hooks/useReducedMotion'
import { usePersistedNotifications } from '../hooks/usePersistedState'

/**
 * NotificationCenter - Advanced notification system with categories and actions
 * Replaces simple Toast with persistent notifications and queue management
 */
const NotificationCenter = ({ 
  notifications = [], 
  onDismiss, 
  onDismissAll, 
  onAction,
  maxVisible = 5,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  
  // Use persisted notifications if no notifications prop provided
  const {
    notifications: persistedNotifications,
    dismissNotification,
    markAsRead,
    clearAll: clearAllPersisted
  } = usePersistedNotifications()
  
  // Use provided notifications or fall back to persisted
  const actualNotifications = notifications.length > 0 ? notifications : persistedNotifications
  const actualOnDismiss = onDismiss || dismissNotification
  const actualOnDismissAll = onDismissAll || clearAllPersisted

  // Get unread count
  const unreadCount = actualNotifications.filter(n => !n.read).length

  // Get visible notifications (limited by maxVisible)
  const visibleNotifications = actualNotifications.slice(0, maxVisible)

  // Notification categories with icons and colors
  const categoryConfig = {
    success: {
      icon: CheckCircle,
      color: 'text-neon-emerald',
      bgColor: 'bg-neon-emerald/10',
      borderColor: 'border-neon-emerald/30'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-neon-amber',
      bgColor: 'bg-neon-amber/10',
      borderColor: 'border-neon-amber/30'
    },
    info: {
      icon: Info,
      color: 'text-neon-cyan',
      bgColor: 'bg-neon-cyan/10',
      borderColor: 'border-neon-cyan/30'
    }
  }

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  const containerVariants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  }

  const notificationVariants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  } : {
    hidden: { opacity: 0, x: 300, scale: 0.8 },
    visible: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: 300, scale: 0.8 }
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-sm w-full`}>
      {/* Notification Bell (if collapsed) */}
      {!isExpanded && notifications.length > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(true)}
          className="relative p-3 bg-dark-card/80 backdrop-blur-xl border border-dark-border rounded-full shadow-glass hover:shadow-neon-cyan transition-all duration-200"
        >
          <Bell className={`w-6 h-6 ${isMuted ? 'text-dark-muted' : 'text-neon-cyan'}`} />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </motion.button>
      )}

      {/* Expanded Notification Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
            className="bg-dark-card/90 backdrop-blur-xl border border-dark-border rounded-xl shadow-glass overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-border">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-neon-cyan" />
                <h3 className="font-semibold text-dark-text">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-neon-cyan/20 text-neon-cyan text-xs rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 rounded text-dark-muted hover:text-dark-text transition-colors duration-200"
                  title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
                >
                  {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </button>
                
                {notifications.length > 0 && (
                  <button
                    onClick={onDismissAll}
                    className="p-1 rounded text-dark-muted hover:text-red-500 transition-colors duration-200"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded text-dark-muted hover:text-dark-text transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {visibleNotifications.length === 0 ? (
                <div className="p-6 text-center text-dark-muted">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                <AnimatePresence>
                  {visibleNotifications.map((notification, index) => {
                    const config = categoryConfig[notification.type] || categoryConfig.info
                    const Icon = config.icon
                    
                    return (
                      <motion.div
                        key={notification.id}
                        variants={notificationVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ 
                          delay: prefersReducedMotion ? 0 : index * 0.05,
                          duration: prefersReducedMotion ? 0.1 : 0.2 
                        }}
                        className={`p-4 border-b border-dark-border last:border-b-0 hover:bg-dark-surface/30 transition-colors duration-200 ${
                          !notification.read ? 'bg-dark-surface/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`p-2 rounded-lg ${config.bgColor} ${config.borderColor} border flex-shrink-0`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-dark-text text-sm mb-1">
                                  {notification.title}
                                </h4>
                                <p className="text-dark-muted text-sm leading-relaxed">
                                  {notification.message}
                                </p>
                                
                                {/* Timestamp */}
                                <p className="text-xs text-dark-muted mt-2">
                                  {new Date(notification.timestamp).toLocaleTimeString()}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {notification.actions && notification.actions.length > 0 && (
                                  <div className="flex gap-1">
                                    {notification.actions.map((action, actionIndex) => (
                                      <button
                                        key={actionIndex}
                                        onClick={() => onAction && onAction(notification.id, action.id)}
                                        className="px-2 py-1 text-xs bg-dark-surface/50 text-dark-text rounded hover:bg-dark-surface transition-colors duration-200"
                                      >
                                        {action.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                
                                <button
                                  onClick={() => onDismiss && onDismiss(notification.id)}
                                  className="p-1 rounded text-dark-muted hover:text-dark-text transition-colors duration-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > maxVisible && (
              <div className="p-3 border-t border-dark-border bg-dark-surface/20">
                <p className="text-xs text-dark-muted text-center">
                  Showing {maxVisible} of {notifications.length} notifications
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationCenter
