import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cpu, MemoryStick, HardDrive, Activity } from 'lucide-react'
import { API_CONFIG } from '../config/environment'

const StatusDock = () => {
  // Direct fetch for debugging
  const [metricsData, setMetricsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [metrics, setMetrics] = useState({
    cpu: 0,
    memory: 0,
    disk: 0
  })

  // Direct fetch function
  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('StatusDock: Fetching metrics from:', `${API_CONFIG.BASE_URL}/api/metrics`)
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/metrics`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('StatusDock: Received data:', data)
      setMetricsData(data)
      
      // Update metrics immediately
      const newMetrics = {
        cpu: Math.round(data.cpu_percent || 0),
        memory: Math.round(data.memory_percent || 0),
        disk: Math.round(data.disk_percent || 0)
      }
      console.log('StatusDock: Setting metrics to:', newMetrics)
      setMetrics(newMetrics)
      
    } catch (err) {
      console.error('StatusDock: Fetch error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // Update metrics when data changes
  useEffect(() => {
    console.log('StatusDock: metricsData received:', metricsData)
    console.log('StatusDock: loading:', loading, 'error:', error)
    
    if (metricsData) {
      // Force update with real data - prioritize flat fields
      const newMetrics = {
        cpu: Math.round(metricsData.cpu_percent || 0),
        memory: Math.round(metricsData.memory_percent || 0),
        disk: Math.round(metricsData.disk_percent || 0)
      }
      console.log('StatusDock: setting metrics to:', newMetrics)
      setMetrics(newMetrics)
    } else {
      console.log('StatusDock: No metrics data available')
      // Set fallback values for debugging
      setMetrics({ cpu: 0, memory: 0, disk: 0 })
    }
  }, [metricsData, loading, error])

  // Auto-fetch on mount and set up polling
  useEffect(() => {
    // Initial fetch
    fetchMetrics()
    
    // Set up polling every 10 seconds
    const interval = setInterval(fetchMetrics, 10000)
    
    // Smart polling - pause when tab is not visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, pause polling
        clearInterval(interval)
      } else {
        // Tab is visible, resume polling
        fetchMetrics()
        setInterval(fetchMetrics, 10000)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const getStatusColor = (percent) => {
    if (percent < 50) return 'text-neon-emerald'
    if (percent < 80) return 'text-neon-amber'
    return 'text-neon-pink'
  }

  // Only show 3 core metrics (CPU, RAM, Disk) - reduced visual clutter
  const coreMetrics = [
    {
      icon: Cpu,
      label: 'CPU',
      value: `${Math.round(metrics.cpu)}%`,
      color: getStatusColor(metrics.cpu),
      pulse: metrics.cpu > 80
    },
    {
      icon: MemoryStick,
      label: 'RAM',
      value: `${Math.round(metrics.memory)}%`,
      color: getStatusColor(metrics.memory),
      pulse: metrics.memory > 80
    },
    {
      icon: HardDrive,
      label: 'Disk',
      value: `${Math.round(metrics.disk)}%`,
      color: getStatusColor(metrics.disk),
      pulse: metrics.disk > 90
    }
  ]

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40"
    >
      {/* Glass Dock - Simplified to 3 core metrics */}
      <div className="bg-dark-card/80 backdrop-blur-2xl rounded-2xl shadow-float border border-neon-cyan/20 px-6 py-3">
        <div className="flex items-center gap-4">
          {coreMetrics.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.label}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 group cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`
                  relative p-2 rounded-lg bg-dark-surface/50 
                  group-hover:bg-dark-surface transition-all duration-200
                  ${item.pulse ? 'animate-pulse' : ''}
                `}>
                  <Icon className={`w-4 h-4 ${item.color} transition-colors duration-200`} />
                  
                  {/* Glow effect on high usage */}
                  {item.pulse && (
                    <div className={`absolute inset-0 rounded-lg blur-md ${item.color} opacity-30`} />
                  )}
                </div>
                
                <div className="hidden sm:block">
                  <div className="text-xs text-dark-muted font-medium">{item.label}</div>
                  <div className={`text-sm font-bold ${item.color} font-mono`}>
                    {loading ? '...' : error ? 'ERR' : item.value}
                  </div>
                </div>

                {/* Separator */}
                {index < coreMetrics.length - 1 && (
                  <div className="hidden md:block w-px h-6 bg-dark-border mx-2" />
                )}
              </motion.div>
            )
          })}

          {/* Debug refresh button */}
          <motion.button
            onClick={() => {
              console.log('Manual refresh clicked')
              fetchMetrics()
            }}
            className="hidden lg:flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 hover:bg-neon-cyan/20 rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Activity className="w-4 h-4 text-neon-cyan" />
            <span className="text-xs text-neon-cyan font-mono">Refresh</span>
          </motion.button>

          {/* Time/Date */}
          <motion.div
            className="hidden xl:flex items-center gap-2 pl-4 border-l border-dark-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-sm font-mono text-dark-text">
              {new Date().toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating indicator dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full bg-neon-cyan/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default StatusDock

