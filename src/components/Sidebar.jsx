import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Activity, 
  Brain, 
  FolderOpen, 
  Zap, 
  History, 
  Settings,
  Shield,
  Monitor,
  Search,
  Download,
  Cpu,
  Play,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react'

/**
 * Sidebar Navigation Component
 * Collapsible sidebar with smooth transitions
 */
const Sidebar = ({ activeView, onViewChange, collapsed = false, onToggleCollapse }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'processes', label: 'Processes', icon: Cpu },
    { id: 'startup', label: 'Startup', icon: Play },
    { id: 'ai', label: 'AI Suggestions', icon: Brain },
    { id: 'discover', label: 'Discover', icon: Search },
    { id: 'installed', label: 'Apps', icon: Download },
    { id: 'automation', label: 'Automation', icon: Clock },
    { id: 'vault', label: 'Vault', icon: Shield },
    { id: 'history', label: 'History', icon: History },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <motion.aside
      initial={{ width: collapsed ? 72 : 240 }}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="bg-dark-card/60 backdrop-blur-xl border-r border-dark-border flex-shrink-0 relative"
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-dark-border">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold font-space bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                    OptiAI
                  </h2>
                  <p className="text-xs text-dark-muted">System Optimizer</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center"
              >
                <span className="text-white font-bold text-sm">AI</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeView === tab.id

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onViewChange(tab.id)}
                  whileHover={{ x: collapsed ? 0 : 4 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 shadow-neon-cyan' 
                      : 'text-dark-muted hover:text-dark-text hover:bg-dark-surface/50'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                  
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {tab.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
        </nav>

        {/* Collapse Toggle Button */}
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={onToggleCollapse}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg
              text-dark-muted hover:text-neon-cyan hover:bg-dark-surface/50
              transition-all duration-200
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}

export default Sidebar
