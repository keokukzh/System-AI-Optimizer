import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X, Command } from 'lucide-react'

/**
 * KeyboardShortcuts - Help modal showing available shortcuts
 * Professional design with organized categories
 */
const KeyboardShortcuts = ({ isOpen, onClose }) => {
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0)
  }, [])

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['⌘', 'K'], description: 'Open Command Palette' },
        { keys: ['⌘', 'D'], description: 'Go to Dashboard' },
        { keys: ['⌘', 'F'], description: 'Browse Files' },
        { keys: ['⌘', 'P'], description: 'Manage Processes' },
        { keys: ['⌘', 'U'], description: 'Manage Startup Apps' }
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: ['⌘', 'S'], description: 'Start System Scan' },
        { keys: ['⌘', 'A'], description: 'Generate AI Suggestions' },
        { keys: ['⌘', 'E'], description: 'Execute Optimization Plan' },
        { keys: ['⌘', 'M'], description: 'View System Metrics' }
      ]
    },
    {
      category: 'Interface',
      items: [
        { keys: ['⌘', ','], description: 'Open Settings' },
        { keys: ['⌘', 'H'], description: 'View Action History' },
        { keys: ['⌘', 'I'], description: 'Discover Apps' },
        { keys: ['⌘', 'V'], description: 'Secure Vault' }
      ]
    }
  ]

  const renderKey = (key) => {
    if (key === '⌘') {
      return isMac ? '⌘' : 'Ctrl'
    }
    return key
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-dark-card/95 backdrop-blur-xl border border-dark-border rounded-2xl shadow-elevation-5 w-full max-w-2xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-cyan/10">
                  <Keyboard className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-space text-dark-text">
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-sm text-dark-muted">
                    Speed up your workflow with these shortcuts
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-dark-muted hover:text-dark-text hover:bg-dark-surface/50 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {shortcuts.map((category, categoryIndex) => (
                  <motion.div
                    key={category.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: categoryIndex * 0.1 }}
                  >
                    <h3 className="text-sm font-semibold text-neon-cyan mb-3 uppercase tracking-wide">
                      {category.category}
                    </h3>
                    <div className="space-y-2">
                      {category.items.map((shortcut, itemIndex) => (
                        <motion.div
                          key={itemIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: categoryIndex * 0.1 + itemIndex * 0.05 }}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-dark-surface/30 transition-colors duration-200"
                        >
                          <span className="text-dark-text text-sm">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                <kbd className="px-2 py-1 text-xs font-mono bg-dark-surface border border-dark-border rounded text-dark-text">
                                  {renderKey(key)}
                                </kbd>
                                {keyIndex < shortcut.keys.length - 1 && (
                                  <span className="text-dark-muted text-xs">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-dark-border bg-dark-surface/20">
              <p className="text-xs text-dark-muted text-center">
                💡 Tip: Press <kbd className="px-1 py-0.5 text-xs font-mono bg-dark-surface border border-dark-border rounded">?</kbd> anytime to see this help
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default KeyboardShortcuts

