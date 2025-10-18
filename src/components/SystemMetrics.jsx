import React from 'react'
import MetricCard from './MetricCard'
import { HardDrive, MemoryStick, Cpu, Activity } from 'lucide-react'

/**
 * SystemMetrics - Displays system health metrics in compact cards
 * Optimized layout with professional styling
 */
const SystemMetrics = ({ metrics }) => {
  // Extract metrics from the nested structure
  const diskUsage = metrics?.metrics?.disk || metrics?.disk || { percent: 0, used: 0, total: 0, free: 0 }
  const memoryUsage = metrics?.metrics?.memory || metrics?.memory || { percent: 0, used: 0, total: 0, available: 0 }
  const cpuUsage = metrics?.metrics?.cpu || metrics?.cpu || { percent: 0, count: 0 }

  // Format bytes to GB
  const formatBytes = (bytes) => {
    if (!bytes) return '0 GB'
    return `${(bytes / (1024 ** 3)).toFixed(2)} GB`
  }

  // Determine color based on usage percentage
  const getUsageColor = (percent) => {
    if (percent < 60) return 'emerald'
    if (percent < 80) return 'amber'
    return 'purple'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Disk Usage */}
      <MetricCard
        icon={HardDrive}
        label="Disk Usage"
        value={`${Math.round(diskUsage.percent)}%`}
        subValue={`${formatBytes(diskUsage.used)} / ${formatBytes(diskUsage.total)}`}
        percent={diskUsage.percent}
        color={getUsageColor(diskUsage.percent)}
        delay={0}
      />

      {/* Memory Usage */}
      <MetricCard
        icon={MemoryStick}
        label="Memory Usage"
        value={`${Math.round(memoryUsage.percent)}%`}
        subValue={`${formatBytes(memoryUsage.used)} / ${formatBytes(memoryUsage.total)}`}
        percent={memoryUsage.percent}
        color={getUsageColor(memoryUsage.percent)}
        delay={0.1}
      />

      {/* CPU Usage */}
      <MetricCard
        icon={Cpu}
        label="CPU Usage"
        value={`${Math.round(cpuUsage.percent)}%`}
        subValue={`${cpuUsage.count || 0} cores`}
        percent={cpuUsage.percent}
        color={getUsageColor(cpuUsage.percent)}
        delay={0.2}
      />

      {/* System Status */}
      <MetricCard
        icon={Activity}
        label="System"
        value={metrics?.system?.hostname ? 'Online' : 'Unknown'}
        subValue={metrics?.system?.platform || 'Platform unknown'}
        color="cyan"
        delay={0.3}
      />
    </div>
  )
}

export default SystemMetrics
