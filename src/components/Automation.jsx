import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Zap, Settings, Calendar, Activity, Plus, Play, Pause } from 'lucide-react'
import GlassCard from './GlassCard'
import useReducedMotion from '../hooks/useReducedMotion'

/**
 * Automation - Combined automation management interface
 * Includes both scheduled scans and automation rules
 */
const Automation = () => {
  const [activeTab, setActiveTab] = useState('schedules')
  const prefersReducedMotion = useReducedMotion()

  const tabs = [
    {
      id: 'schedules',
      label: 'Scheduled Scans',
      icon: Clock,
      description: 'Create automated scans and maintenance tasks'
    },
    {
      id: 'rules',
      label: 'Automation Rules',
      icon: Zap,
      description: 'Set up if-then rules for system actions'
    }
  ]

  const containerVariants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const tabVariants = prefersReducedMotion ? {
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
          <h2 className="text-2xl font-bold font-space text-dark-text">Automation</h2>
          <p className="text-dark-muted mt-1">Automate system scans and create intelligent rules</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex space-x-1 bg-dark-surface/30 p-1 rounded-lg"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <motion.button
              key={tab.id}
              variants={tabVariants}
              whileHover={!prefersReducedMotion ? { scale: 1.02 } : {}}
              whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                isActive
                  ? 'bg-neon-cyan text-dark-bg shadow-neon-cyan'
                  : 'text-dark-muted hover:text-dark-text hover:bg-dark-surface/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'schedules' && (
            <GlassCard className="p-8 text-center">
              <Clock className="w-16 h-16 text-neon-cyan mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-dark-text mb-2">Scheduled Scans</h3>
              <p className="text-dark-muted mb-6">Create automated scans and maintenance tasks</p>
              <button className="px-6 py-3 bg-neon-cyan text-dark-bg rounded-lg hover:shadow-neon-cyan transition-all duration-200 font-semibold">
                <Plus className="w-4 h-4 inline mr-2" />
                Create Schedule
              </button>
            </GlassCard>
          )}
          
          {activeTab === 'rules' && (
            <GlassCard className="p-8 text-center">
              <Zap className="w-16 h-16 text-neon-purple mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-dark-text mb-2">Automation Rules</h3>
              <p className="text-dark-muted mb-6">Set up if-then rules for system actions</p>
              <button className="px-6 py-3 bg-neon-purple text-white rounded-lg hover:shadow-neon-purple transition-all duration-200 font-semibold">
                <Plus className="w-4 h-4 inline mr-2" />
                Create Rule
              </button>
            </GlassCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Quick Stats */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-cyan/20 rounded-lg">
              <Clock className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <div className="text-sm text-dark-muted">Active Schedules</div>
              <div className="text-lg font-bold text-dark-text">0</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-purple/20 rounded-lg">
              <Zap className="w-5 h-5 text-neon-purple" />
            </div>
            <div>
              <div className="text-sm text-dark-muted">Active Rules</div>
              <div className="text-lg font-bold text-dark-text">0</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neon-emerald/20 rounded-lg">
              <Activity className="w-5 h-5 text-neon-emerald" />
            </div>
            <div>
              <div className="text-sm text-dark-muted">Last Execution</div>
              <div className="text-lg font-bold text-dark-text">Never</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}

export default Automation
