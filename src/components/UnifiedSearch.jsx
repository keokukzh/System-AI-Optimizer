import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock, Command } from 'lucide-react'
import useCommandSearch from '../hooks/useCommandSearch'
import useReducedMotion from '../hooks/useReducedMotion'

/**
 * UnifiedSearch - Always-visible search bar in header
 * Combines navigation, actions, and help
 * Replaces hidden Command Palette with accessible UI
 */
const UnifiedSearch = ({ onNavigate, onAction }) => {
  const [isFocused, setIsFocused] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef(null)
  const dropdownRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  const {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    filteredCommands,
    groupedCommands,
    recentActions,
    executeCommand,
    reset
  } = useCommandSearch()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !searchRef.current.contains(e.target)
      ) {
        setIsOpen(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      const totalItems = filteredCommands.length

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % totalItems)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          handleSelectCommand(filteredCommands[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false)
        setIsFocused(false)
        searchRef.current?.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex])

  const handleFocus = () => {
    setIsFocused(true)
    setIsOpen(true)
  }

  const handleChange = (e) => {
    setQuery(e.target.value)
    setIsOpen(true)
    setSelectedIndex(0)
  }

  const handleSelectCommand = (command) => {
    executeCommand(command)
    if (onAction) onAction(command)
    setIsOpen(false)
    setIsFocused(false)
    reset()
    searchRef.current?.blur()
  }

  // Contextual suggestions based on time of day
  const contextualSuggestions = () => {
    const hour = new Date().getHours()
    if (hour < 12) {
      return { text: 'Good morning! Start with a Quick Scan?', icon: '🌅' }
    } else if (hour < 18) {
      return { text: 'Need to free up space? Try AI Suggestions', icon: '⚡' }
    } else {
      return { text: 'Evening cleanup? Check Action History', icon: '🌙' }
    }
  }

  const suggestion = contextualSuggestions()

  return (
    <div className="relative flex-1 max-w-xl mx-6">
      {/* Search Input */}
      <div className={`
        relative transition-all duration-200
        ${isFocused ? 'transform scale-105' : ''}
      `}>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-muted">
          <Search className="w-4 h-4" />
        </div>
        
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Search actions, files, settings..."
          className={`
            w-full pl-10 pr-20 py-2.5 rounded-lg
            bg-dark-surface/50 border transition-all duration-200
            text-dark-text placeholder-dark-muted
            focus:outline-none focus:ring-2
            ${isFocused 
              ? 'border-neon-cyan/50 ring-neon-cyan/20 bg-dark-surface' 
              : 'border-dark-border hover:border-dark-border-hover'
            }
          `}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs bg-dark-card border border-dark-border rounded">
            <Command className="w-3 h-3" />
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.2 }}
            className="absolute top-full mt-2 w-full bg-dark-card/95 backdrop-blur-xl rounded-xl shadow-float border border-dark-border z-50 max-h-96 overflow-y-auto"
          >
            {/* Recent Actions */}
            {!query && recentActions.length > 0 && (
              <Section title="Recent" icon={<Clock className="w-4 h-4" />}>
                {recentActions.map((action, index) => (
                  <CommandItem
                    key={action.id}
                    command={action}
                    isSelected={index === selectedIndex}
                    onClick={() => handleSelectCommand(action)}
                  />
                ))}
              </Section>
            )}

            {/* Search Results by Category */}
            {query && Object.entries(groupedCommands).length > 0 ? (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <Section key={category} title={category}>
                  {cmds.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd)
                    return (
                      <CommandItem
                        key={cmd.id}
                        command={cmd}
                        isSelected={globalIndex === selectedIndex}
                        onClick={() => handleSelectCommand(cmd)}
                      />
                    )
                  })}
                </Section>
              ))
            ) : query ? (
              <div className="p-8 text-center text-dark-muted">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found for "{query}"</p>
              </div>
            ) : null}

            {/* Contextual Suggestion */}
            {!query && (
              <div className="p-3 m-2 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-dark-muted">
                  <span className="text-lg">{suggestion.icon}</span>
                  <span>{suggestion.text}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Section Component
const Section = ({ title, icon, children }) => (
  <div className="border-b border-dark-border last:border-b-0">
    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-dark-muted uppercase tracking-wide">
      {icon}
      <span>{title}</span>
    </div>
    <div className="pb-1">
      {children}
    </div>
  </div>
)

// Command Item Component
const CommandItem = ({ command, isSelected, onClick }) => {
  const Icon = command.icon

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4 }}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
        ${isSelected 
          ? 'bg-neon-cyan/10 text-neon-cyan' 
          : 'text-dark-text hover:bg-dark-surface/50'
        }
      `}
    >
      <div className={`
        p-1.5 rounded-lg transition-colors
        ${isSelected ? 'bg-neon-cyan/20' : 'bg-dark-surface'}
      `}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{command.label}</div>
        {command.category && (
          <div className="text-xs text-dark-muted">{command.category}</div>
        )}
      </div>
      
      {command.shortcut && (
        <kbd className="hidden sm:inline-block px-2 py-1 text-xs bg-dark-card border border-dark-border rounded font-mono">
          {command.shortcut}
        </kbd>
      )}
    </motion.button>
  )
}

export default UnifiedSearch

