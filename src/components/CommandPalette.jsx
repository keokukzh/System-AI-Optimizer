import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, FileSearch, Settings, Terminal, Cpu, HardDrive, Trash2 } from 'lucide-react'

const CommandPalette = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)

  const commands = [
    { id: 1, icon: FileSearch, label: 'Start System Scan', shortcut: 'Ctrl+S', category: 'Actions' },
    { id: 2, icon: Zap, label: 'Generate AI Suggestions', shortcut: 'Ctrl+A', category: 'Actions' },
    { id: 3, icon: Terminal, label: 'Execute Optimization Plan', shortcut: 'Ctrl+E', category: 'Actions' },
    { id: 4, icon: Cpu, label: 'View System Metrics', shortcut: 'Ctrl+M', category: 'Navigation' },
    { id: 5, icon: HardDrive, label: 'Browse Files', shortcut: 'Ctrl+F', category: 'Navigation' },
    { id: 6, icon: Settings, label: 'Open Settings', shortcut: 'Ctrl+,', category: 'Navigation' },
    { id: 7, icon: Trash2, label: 'View Action History', shortcut: 'Ctrl+H', category: 'Navigation' },
  ]

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((prev) => (prev + 1) % filteredCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        // Executing: ${filteredCommands[selected]?.label}
        onClose()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selected, filteredCommands, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Command Palette */}
        <motion.div
          initial={{ scale: 0.95, y: -20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: -20 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glass Container */}
          <div className="bg-dark-card/90 backdrop-blur-xl rounded-2xl shadow-neon-cyan border border-neon-cyan/20 overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-dark-border">
              <Search className="w-5 h-5 text-neon-cyan" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent border-none outline-none text-dark-text text-lg placeholder-dark-muted"
              />
              <kbd className="px-2 py-1 text-xs font-mono bg-dark-surface text-dark-muted rounded border border-dark-border">
                ESC
              </kbd>
            </div>

            {/* Commands List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-dark-muted">
                  No commands found
                </div>
              ) : (
                <div className="p-2">
                  {filteredCommands.map((cmd, idx) => {
                    const Icon = cmd.icon
                    const isSelected = idx === selected
                    
                    return (
                      <motion.div
                        key={cmd.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`
                          flex items-center justify-between p-3 rounded-lg cursor-pointer
                          transition-all duration-150
                          ${isSelected 
                            ? 'bg-neon-cyan/10 border border-neon-cyan/30' 
                            : 'hover:bg-dark-surface/50'
                          }
                        `}
                        onMouseEnter={() => setSelected(idx)}
                        onClick={() => {
                          // Executing: ${cmd.label}
                          onClose()
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            p-2 rounded-lg 
                            ${isSelected ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-dark-surface text-dark-muted'}
                          `}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-dark-text font-medium">{cmd.label}</div>
                            <div className="text-xs text-dark-muted">{cmd.category}</div>
                          </div>
                        </div>
                        
                        {cmd.shortcut && (
                          <kbd className="px-2 py-1 text-xs font-mono bg-dark-surface text-dark-muted rounded border border-dark-border">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-3 border-t border-dark-border bg-dark-surface/50 text-xs text-dark-muted">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-dark-card rounded border border-dark-border">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-dark-card rounded border border-dark-border">↵</kbd>
                  Select
                </span>
              </div>
              <div className="text-neon-cyan font-medium">
                {filteredCommands.length} commands
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CommandPalette

