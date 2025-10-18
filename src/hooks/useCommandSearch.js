import { useState, useEffect, useMemo } from 'react'
import { Scan, Settings, Folder, Cpu, HardDrive, Zap, Trash, FileCheck, History, Lock } from 'lucide-react'

/**
 * Custom hook for command search functionality
 * Provides fuzzy search across actions, files, settings, help docs
 */
export const useCommandSearch = () => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentActions, setRecentActions] = useState([])

  // Define all available commands
  const commands = useMemo(() => [
    { 
      id: 'scan-quick', 
      label: 'Quick Scan (C:\\ Drive)', 
      icon: Scan, 
      shortcut: 'Ctrl+S', 
      category: 'Actions',
      action: () => {
        // Quick Scan action
      },
      keywords: ['scan', 'quick', 'c', 'drive', 'analyze']
    },
    { 
      id: 'scan-custom', 
      label: 'Custom Scan', 
      icon: Folder, 
      category: 'Actions',
      action: () => {
        // Custom Scan action
      },
      keywords: ['scan', 'custom', 'folder', 'choose']
    },
    { 
      id: 'ai-suggestions', 
      label: 'Generate AI Suggestions', 
      icon: Zap, 
      shortcut: 'Ctrl+A', 
      category: 'AI',
      action: () => {
        // AI Suggestions action
      },
      keywords: ['ai', 'suggestions', 'optimize', 'recommendations']
    },
    { 
      id: 'processes', 
      label: 'View Processes', 
      icon: Cpu, 
      category: 'System',
      action: () => {
        // Processes action
      },
      keywords: ['processes', 'cpu', 'monitor', 'tasks']
    },
    { 
      id: 'disk-usage', 
      label: 'Analyze Disk Usage', 
      icon: HardDrive, 
      category: 'System',
      action: () => {
        // Disk Usage action
      },
      keywords: ['disk', 'usage', 'space', 'storage']
    },
    { 
      id: 'cleanup', 
      label: 'Clean Temp Files', 
      icon: Trash, 
      category: 'Actions',
      action: () => {
        // Cleanup action
      },
      keywords: ['clean', 'temp', 'temporary', 'delete', 'trash']
    },
    { 
      id: 'history', 
      label: 'View Action History', 
      icon: History, 
      category: 'System',
      action: () => {
        // History action
      },
      keywords: ['history', 'actions', 'undo', 'past']
    },
    { 
      id: 'vault', 
      label: 'Open Vault', 
      icon: Lock, 
      category: 'Security',
      action: () => {
        // Vault action
      },
      keywords: ['vault', 'secure', 'password', 'secrets']
    },
    { 
      id: 'settings', 
      label: 'Open Settings', 
      icon: Settings, 
      category: 'Settings',
      action: () => {
        // Settings action
      },
      keywords: ['settings', 'preferences', 'config', 'options']
    },
    { 
      id: 'verify', 
      label: 'Verify File Integrity', 
      icon: FileCheck, 
      category: 'Actions',
      action: () => {
        // Verify action
      },
      keywords: ['verify', 'integrity', 'check', 'validate']
    }
  ], [])

  // Fuzzy search filter
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands

    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd => {
      const matchLabel = cmd.label.toLowerCase().includes(lowerQuery)
      const matchKeywords = cmd.keywords.some(kw => kw.includes(lowerQuery))
      const matchCategory = cmd.category.toLowerCase().includes(lowerQuery)
      return matchLabel || matchKeywords || matchCategory
    })
  }, [query, commands])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = {}
    filteredCommands.forEach(cmd => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = []
      }
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])

  // Load recent actions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentCommands')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setRecentActions(parsed.slice(0, 5)) // Keep last 5
      } catch (error) {
        console.error('Failed to load recent commands:', error)
      }
    }
  }, [])

  // Execute command and add to recent
  const executeCommand = (command) => {
    command.action()
    
    // Add to recent (avoiding duplicates)
    const updated = [
      command,
      ...recentActions.filter(cmd => cmd.id !== command.id)
    ].slice(0, 5)
    
    setRecentActions(updated)
    localStorage.setItem('recentCommands', JSON.stringify(updated))
  }

  // Reset state
  const reset = () => {
    setQuery('')
    setSelectedIndex(0)
  }

  return {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    filteredCommands,
    groupedCommands,
    recentActions,
    executeCommand,
    reset,
    allCommands: commands
  }
}

export default useCommandSearch

