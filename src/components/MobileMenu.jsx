import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Home, 
  Activity, 
  Brain, 
  FolderOpen, 
  Zap, 
  History, 
  Settings,
  Shield,
  Search,
  Download,
  Cpu,
  Play
} from 'lucide-react'

/**
 * MobileMenu - Responsive navigation for mobile devices
 * Slide-out menu with smooth animations
 */
const MobileMenu = ({ activeView, onViewChange, onClose }) => {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'processes', label: 'Processes', icon: Cpu },
    { id: 'startup', label: 'Startup', icon: Play },
    { id: 'ai', label: 'AI Suggestions', icon: Brain },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'installed', label: 'Apps', icon: Download },
    { id: 'vault', label: 'Vault', icon: Shield },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const handleItemClick = (viewId) => {
    onViewChange(viewId)
    setIsOpen(false)
    onClose()
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-lg text-dark-muted hover:text-dark-text hover:bg-dark-surface/50 transition-colors duration-200"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsOpen(false)}
          >
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-80 h-full bg-dark-card/95 backdrop-blur-xl border-r border-dark-border"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-dark-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AI</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold font-space bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                      OptiAI
                    </h2>
                    <p className="text-xs text-dark-muted">System Optimizer</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-dark-muted hover:text-dark-text hover:bg-dark-surface/50 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="p-4">
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeView === item.id

                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-3 rounded-lg
                          transition-all duration-200
                          ${isActive 
                            ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30' 
                            : 'text-dark-muted hover:text-dark-text hover:bg-dark-surface/50'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </nav>

              {/* Menu Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-border">
                <div className="text-xs text-dark-muted text-center">
                  OptiAI v1.0.0 • System Optimizer
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default MobileMenu

