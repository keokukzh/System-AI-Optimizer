import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  X,
  Save,
  Play,
  Pause,
  Eye,
  EyeOff
} from 'lucide-react'
import GlassCard from './GlassCard'
import LoadingSpinner from './LoadingSpinner'
import useReducedMotion from '../hooks/useReducedMotion'
import { usePersistedState } from '../hooks/usePersistedState'

/**
 * AutomationRules - If-then rules for automated system actions
 * Provides conditional automation based on system metrics and events
 */
const AutomationRules = () => {
  const [rules, setRules, { reset: resetRules }] = usePersistedState('automation-rules', [])
  const [isCreating, setIsCreating] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // Form state for creating/editing rules
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: true,
    conditions: [
      {
        type: 'metric',
        metric: 'cpu',
        operator: 'greater_than',
        value: 80,
        unit: 'percent'
      }
    ],
    actions: [
      {
        type: 'notification',
        config: {
          message: 'High CPU usage detected',
          type: 'warning'
        }
      }
    ],
    cooldown: 300000, // 5 minutes in milliseconds
    lastTriggered: null
  })

  // Predefined rule templates
  const ruleTemplates = [
    {
      name: 'High CPU Alert',
      description: 'Send notification when CPU usage exceeds 80%',
      conditions: [
        {
          type: 'metric',
          metric: 'cpu',
          operator: 'greater_than',
          value: 80,
          unit: 'percent'
        }
      ],
      actions: [
        {
          type: 'notification',
          config: {
            message: 'High CPU usage detected: {cpu}%',
            type: 'warning'
          }
        }
      ],
      cooldown: 300000
    },
    {
      name: 'Low Disk Space',
      description: 'Auto-scan when disk space is below 20%',
      conditions: [
        {
          type: 'metric',
          metric: 'disk',
          operator: 'less_than',
          value: 20,
          unit: 'percent'
        }
      ],
      actions: [
        {
          type: 'scan',
          config: {
            paths: ['C:\\'],
            message: 'Auto-scanning due to low disk space'
          }
        }
      ],
      cooldown: 3600000 // 1 hour
    },
    {
      name: 'Memory Warning',
      description: 'Alert when RAM usage is high',
      conditions: [
        {
          type: 'metric',
          metric: 'memory',
          operator: 'greater_than',
          value: 85,
          unit: 'percent'
        }
      ],
      actions: [
        {
          type: 'notification',
          config: {
            message: 'High memory usage: {memory}%',
            type: 'error'
          }
        }
      ],
      cooldown: 600000 // 10 minutes
    },
    {
      name: 'Auto Cleanup',
      description: 'Automatically clean temp files when disk is full',
      conditions: [
        {
          type: 'metric',
          metric: 'disk',
          operator: 'greater_than',
          value: 90,
          unit: 'percent'
        }
      ],
      actions: [
        {
          type: 'cleanup',
          config: {
            actions: ['temp-files', 'cache'],
            message: 'Auto-cleanup executed due to low disk space'
          }
        }
      ],
      cooldown: 1800000 // 30 minutes
    }
  ]

  const handleCreateRule = () => {
    setIsCreating(true)
    setEditingRule(null)
    setFormData({
      name: '',
      description: '',
      enabled: true,
      conditions: [
        {
          type: 'metric',
          metric: 'cpu',
          operator: 'greater_than',
          value: 80,
          unit: 'percent'
        }
      ],
      actions: [
        {
          type: 'notification',
          config: {
            message: 'Rule triggered',
            type: 'info'
          }
        }
      ],
      cooldown: 300000,
      lastTriggered: null
    })
  }

  const handleEditRule = (rule) => {
    setEditingRule(rule.id)
    setFormData(rule)
    setIsCreating(true)
  }

  const handleSaveRule = () => {
    if (!formData.name || formData.conditions.length === 0 || formData.actions.length === 0) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const newRule = {
        ...formData,
        id: editingRule || `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: editingRule ? rules.find(r => r.id === editingRule)?.createdAt : Date.now(),
        lastTriggered: editingRule ? rules.find(r => r.id === editingRule)?.lastTriggered : null
      }

      if (editingRule) {
        // Update existing rule
        const updatedRules = rules.map(r => r.id === editingRule ? newRule : r)
        setRules(updatedRules)
      } else {
        // Create new rule
        setRules([...rules, newRule])
      }
      
      setIsCreating(false)
      setEditingRule(null)
    } catch (error) {
      console.error('Failed to save rule:', error)
      alert('Failed to save rule')
    }
  }

  const handleDeleteRule = (id) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      const updatedRules = rules.filter(r => r.id !== id)
      setRules(updatedRules)
    }
  }

  const handleToggleRule = (id) => {
    const updatedRules = rules.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    )
    setRules(updatedRules)
  }

  const handleUseTemplate = (template) => {
    setFormData({
      ...template,
      id: undefined,
      createdAt: undefined,
      lastTriggered: null
    })
    setShowTemplates(false)
  }

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        {
          type: 'metric',
          metric: 'cpu',
          operator: 'greater_than',
          value: 80,
          unit: 'percent'
        }
      ]
    })
  }

  const removeCondition = (index) => {
    const newConditions = formData.conditions.filter((_, i) => i !== index)
    setFormData({ ...formData, conditions: newConditions })
  }

  const updateCondition = (index, updates) => {
    const newConditions = formData.conditions.map((condition, i) => 
      i === index ? { ...condition, ...updates } : condition
    )
    setFormData({ ...formData, conditions: newConditions })
  }

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        {
          type: 'notification',
          config: {
            message: 'Rule triggered',
            type: 'info'
          }
        }
      ]
    })
  }

  const removeAction = (index) => {
    const newActions = formData.actions.filter((_, i) => i !== index)
    setFormData({ ...formData, actions: newActions })
  }

  const updateAction = (index, updates) => {
    const newActions = formData.actions.map((action, i) => 
      i === index ? { ...action, ...updates } : action
    )
    setFormData({ ...formData, actions: newActions })
  }

  const getConditionText = (condition) => {
    const metricNames = {
      cpu: 'CPU Usage',
      memory: 'Memory Usage',
      disk: 'Disk Usage'
    }
    
    const operators = {
      greater_than: '>',
      less_than: '<',
      equals: '=',
      not_equals: '≠'
    }

    return `${metricNames[condition.metric] || condition.metric} ${operators[condition.operator] || condition.operator} ${condition.value}${condition.unit}`
  }

  const getActionText = (action) => {
    const actionNames = {
      notification: 'Send Notification',
      scan: 'Run Scan',
      cleanup: 'Execute Cleanup',
      alert: 'Show Alert'
    }
    
    return actionNames[action.type] || action.type
  }

  const getRuleStatus = (rule) => {
    if (!rule.enabled) return { text: 'Disabled', color: 'text-dark-muted' }
    if (rule.lastTriggered) {
      const timeSince = Date.now() - rule.lastTriggered
      if (timeSince < rule.cooldown) {
        return { text: 'Cooldown', color: 'text-neon-amber' }
      }
    }
    return { text: 'Active', color: 'text-neon-emerald' }
  }

  const containerVariants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-space text-dark-text">Automation Rules</h2>
          <p className="text-dark-muted mt-1">Create if-then rules for automated system actions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-4 py-2 bg-dark-surface/50 text-dark-text rounded-lg hover:bg-dark-surface border border-dark-border transition-colors duration-200"
          >
            <Settings className="w-4 h-4" />
            Templates
          </button>
          
          <button
            onClick={handleCreateRule}
            className="flex items-center gap-2 px-4 py-2 bg-neon-purple text-white rounded-lg hover:shadow-neon-purple transition-all duration-200 font-semibold"
          >
            <Plus className="w-4 h-4" />
            New Rule
          </button>
        </div>
      </div>

      {/* Templates Panel */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">Rule Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ruleTemplates.map((template, index) => (
                  <motion.button
                    key={index}
                    variants={itemVariants}
                    whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
                    whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
                    onClick={() => handleUseTemplate(template)}
                    className="text-left p-4 bg-dark-surface/50 rounded-lg border border-dark-border hover:border-neon-purple/50 transition-colors duration-200"
                  >
                    <h4 className="font-semibold text-dark-text">{template.name}</h4>
                    <p className="text-sm text-dark-muted mt-1">{template.description}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-neon-cyan">
                        If: {template.conditions.map(c => getConditionText(c)).join(' AND ')}
                      </p>
                      <p className="text-xs text-neon-purple">
                        Then: {template.actions.map(a => getActionText(a)).join(', ')}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-dark-text">
                  {editingRule ? 'Edit Rule' : 'Create New Rule'}
                </h3>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-2 text-dark-muted hover:text-dark-text hover:bg-dark-surface/50 rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Rule Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-transparent"
                      placeholder="e.g., High CPU Alert"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-dark-text mb-2">
                      Cooldown (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.cooldown / 60000}
                      onChange={(e) => setFormData({ ...formData, cooldown: parseInt(e.target.value) * 60000 })}
                      className="w-full px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-transparent"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-text mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-transparent"
                    rows={2}
                    placeholder="Describe what this rule does..."
                  />
                </div>

                {/* Conditions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-dark-text">Conditions (IF)</h4>
                    <button
                      onClick={addCondition}
                      className="flex items-center gap-2 px-3 py-1 bg-neon-cyan/20 text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors duration-200 text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      Add Condition
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-dark-surface/30 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                          <select
                            value={condition.metric}
                            onChange={(e) => updateCondition(index, { metric: e.target.value })}
                            className="px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                          >
                            <option value="cpu">CPU Usage</option>
                            <option value="memory">Memory Usage</option>
                            <option value="disk">Disk Usage</option>
                          </select>
                          
                          <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(index, { operator: e.target.value })}
                            className="px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                          >
                            <option value="greater_than">Greater than</option>
                            <option value="less_than">Less than</option>
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not equals</option>
                          </select>
                          
                          <input
                            type="number"
                            value={condition.value}
                            onChange={(e) => updateCondition(index, { value: parseInt(e.target.value) })}
                            className="px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                            min="0"
                            max="100"
                          />
                          
                          <select
                            value={condition.unit}
                            onChange={(e) => updateCondition(index, { unit: e.target.value })}
                            className="px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                          >
                            <option value="percent">%</option>
                            <option value="gb">GB</option>
                            <option value="mb">MB</option>
                          </select>
                        </div>
                        
                        {formData.conditions.length > 1 && (
                          <button
                            onClick={() => removeCondition(index)}
                            className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-dark-text">Actions (THEN)</h4>
                    <button
                      onClick={addAction}
                      className="flex items-center gap-2 px-3 py-1 bg-neon-purple/20 text-neon-purple rounded-lg hover:bg-neon-purple/30 transition-colors duration-200 text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      Add Action
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.actions.map((action, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-dark-surface/30 rounded-lg">
                        <div className="flex-1">
                          <select
                            value={action.type}
                            onChange={(e) => updateAction(index, { type: e.target.value, config: {} })}
                            className="w-full px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-neon-purple/50 mb-3"
                          >
                            <option value="notification">Send Notification</option>
                            <option value="scan">Run Scan</option>
                            <option value="cleanup">Execute Cleanup</option>
                            <option value="alert">Show Alert</option>
                          </select>
                          
                          {action.type === 'notification' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={action.config.message || ''}
                                onChange={(e) => updateAction(index, { 
                                  config: { ...action.config, message: e.target.value }
                                })}
                                className="px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                                placeholder="Notification message"
                              />
                              <select
                                value={action.config.type || 'info'}
                                onChange={(e) => updateAction(index, { 
                                  config: { ...action.config, type: e.target.value }
                                })}
                                className="px-3 py-2 bg-dark-surface/50 border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
                              >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="error">Error</option>
                                <option value="success">Success</option>
                              </select>
                            </div>
                          )}
                        </div>
                        
                        {formData.actions.length > 1 && (
                          <button
                            onClick={() => removeAction(index)}
                            className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save/Cancel */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enabled"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-4 h-4 text-neon-purple bg-dark-surface border-dark-border rounded focus:ring-neon-purple/50"
                    />
                    <label htmlFor="enabled" className="text-sm text-dark-text">
                      Enable this rule
                    </label>
                  </div>
                  
                  <div className="flex gap-3 ml-auto">
                    <button
                      onClick={handleSaveRule}
                      className="flex items-center gap-2 px-4 py-2 bg-neon-purple text-white rounded-lg hover:shadow-neon-purple transition-all duration-200 font-semibold"
                    >
                      <Save className="w-4 h-4" />
                      {editingRule ? 'Update' : 'Create'}
                    </button>
                    
                    <button
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 bg-dark-surface/50 text-dark-text rounded-lg hover:bg-dark-surface border border-dark-border transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {rules.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Zap className="w-12 h-12 text-dark-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-text mb-2">No Automation Rules</h3>
            <p className="text-dark-muted mb-4">Create your first automation rule to get started</p>
            <button
              onClick={handleCreateRule}
              className="px-4 py-2 bg-neon-purple text-white rounded-lg hover:shadow-neon-purple transition-all duration-200 font-semibold"
            >
              Create Rule
            </button>
          </GlassCard>
        ) : (
          rules.map((rule) => {
            const status = getRuleStatus(rule)
            return (
              <motion.div key={rule.id} variants={itemVariants}>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-dark-text">{rule.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rule.enabled 
                            ? 'bg-neon-emerald/20 text-neon-emerald' 
                            : 'bg-dark-muted/20 text-dark-muted'
                        }`}>
                          {status.text}
                        </span>
                      </div>
                      
                      <p className="text-dark-muted text-sm mb-3">{rule.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-dark-muted">If:</span>
                          <span className="ml-2 text-dark-text">
                            {rule.conditions.map(c => getConditionText(c)).join(' AND ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-dark-muted">Then:</span>
                          <span className="ml-2 text-dark-text">
                            {rule.actions.map(a => getActionText(a)).join(', ')}
                          </span>
                        </div>
                      </div>
                      
                      {rule.lastTriggered && (
                        <div className="mt-2 text-xs text-dark-muted">
                          Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          rule.enabled
                            ? 'text-neon-amber hover:bg-neon-amber/20'
                            : 'text-neon-emerald hover:bg-neon-emerald/20'
                        }`}
                        title={rule.enabled ? 'Disable' : 'Enable'}
                      >
                        {rule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-2 text-dark-muted hover:text-dark-text hover:bg-dark-surface/50 rounded-lg transition-colors duration-200"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })
        )}
      </motion.div>
    </div>
  )
}

export default AutomationRules
