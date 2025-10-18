import React from 'react'
import { motion } from 'framer-motion'
import { Search, FolderOpen, Zap, ArrowRight, TrendingDown, Clock } from 'lucide-react'
import GlassCard from './GlassCard'
import useReducedMotion from '../hooks/useReducedMotion'

const EmptyState = ({ type = 'scan', onAction }) => {
  const prefersReducedMotion = useReducedMotion()
  const getContent = () => {
    switch (type) {
      case 'scan':
        return {
          icon: <Search className="w-12 h-12 text-neon-cyan" />,
          iconBg: 'bg-neon-cyan/10',
          title: "No scan data yet",
          description: "Scan your system to discover optimization opportunities and free up valuable disk space.",
          stats: [
            { icon: <TrendingDown className="w-5 h-5" />, label: "Avg Savings", value: "12.4 GB" },
            { icon: <Clock className="w-5 h-5" />, label: "Scan Time", value: "~2 min" }
          ],
          action: {
            label: "Quick Scan (C:\\ Drive)",
            onClick: onAction,
            secondary: "Custom Scan"
          },
          tip: "💡 OptiAI finds duplicate files, temp data, and unused cache"
        }
      
      case 'files':
        return {
          icon: <FolderOpen className="w-12 h-12 text-neon-amber" />,
          iconBg: 'bg-neon-amber/10',
          title: "No files found",
          description: "Try adjusting your scan scope or filters to find files.",
          action: {
            label: "Adjust Scope",
            onClick: onAction
          }
        }
      
      case 'ai':
        return {
          icon: <Zap className="w-12 h-12 text-neon-purple" />,
          iconBg: 'bg-neon-purple/10',
          title: "No AI suggestions yet",
          description: "Run a scan first to get AI-powered optimization recommendations.",
          stats: [
            { label: "Smart Analysis", value: "Powered by AI" },
            { label: "Safety Level", value: "100%" }
          ],
          action: {
            label: "Run Scan First",
            onClick: onAction
          }
        }
      
      default:
        return {
          icon: <Search className="w-12 h-12 text-neon-cyan" />,
          iconBg: 'bg-neon-cyan/10',
          title: "No data available",
          description: "Start by running a system scan.",
          action: {
            label: "Get Started",
            onClick: onAction
          }
        }
    }
  }

  const content = getContent()

  const iconAnimation = prefersReducedMotion ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 }
  } : {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.3, ease: 'easeOut' }
  }

  return (
    <GlassCard className="max-w-2xl mx-auto" neonBorder neonColor="cyan">
      <div className="text-center py-16 px-6">
        {/* Animated Icon */}
        <motion.div {...iconAnimation} className="mb-6">
          <div className={`w-24 h-24 mx-auto rounded-full ${content.iconBg || 'bg-neon-cyan/10'} flex items-center justify-center`}>
            {content.icon}
          </div>
        </motion.div>
        
        <h2 className="text-2xl font-bold font-space text-dark-text mb-3">
          {content.title}
        </h2>
        
        <p className="text-dark-muted mb-8 max-w-md mx-auto leading-relaxed">
          {content.description}
        </p>

        {/* Value Prop Stats */}
        {content.stats && (
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
            {content.stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.2 }}
                className="bg-dark-surface/50 rounded-lg p-4 border border-dark-border"
              >
                {stat.icon && (
                  <div className="flex justify-center mb-2 text-neon-cyan">
                    {stat.icon}
                  </div>
                )}
                <div className="text-xs text-dark-muted mb-1">{stat.label}</div>
                <div className="text-lg font-bold text-dark-text">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Primary Action */}
        {content.action && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.button
              whileHover={!prefersReducedMotion ? { scale: 1.05 } : {}}
              whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
              onClick={content.action.onClick}
              className="px-8 py-3 bg-neon-cyan text-dark-bg rounded-lg hover:shadow-neon-cyan transition-all duration-200 font-semibold"
            >
              {content.action.label}
            </motion.button>
            
            {content.action.secondary && (
              <button
                onClick={content.action.onClick}
                className="px-6 py-3 bg-dark-surface/50 text-dark-text rounded-lg hover:bg-dark-surface border border-dark-border transition-colors duration-200"
              >
                {content.action.secondary}
              </button>
            )}
          </div>
        )}

        {/* Tip */}
        {content.tip && (
          <p className="text-sm text-dark-muted mt-6 bg-dark-surface/30 rounded-lg p-3 max-w-md mx-auto">
            {content.tip}
          </p>
        )}
      </div>
    </GlassCard>
  )
}

export default EmptyState
